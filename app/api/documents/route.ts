// ============================================================
// Smart Konstruksi — Documents API
// POST /api/documents - Upload document
// GET /api/documents - List documents with filters
// ============================================================

import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import { accessibleProjectWhere, userCanAccessProject } from "@/lib/rbac/resource-access";
import { validateFile, MAX_FILE_SIZE } from "@/lib/validation/schemas";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Allowed file extensions
const ALLOWED_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "webp", "gif",
  "pdf", "doc", "docx", "xls", "xlsx",
]);

// POST /api/documents - Upload document
export const POST = withPermission("file:upload", async (request, { user }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const categoryId = formData.get("categoryId") as string;
    const projectId = formData.get("projectId") as string;
    const isClientVisible = formData.get("isClientVisible") === "true";
    const expiryDate = formData.get("expiryDate") as string | null;
    const requestedStatus = formData.get("status");
    const documentStatus = requestedStatus === "DRAFT" ? "DRAFT" : "ACTIVE";

    if (requestedStatus && requestedStatus !== "ACTIVE" && requestedStatus !== "DRAFT") {
      return Response.json(
        { error: "New documents can only be Active or Draft" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!file || !name || !categoryId || !projectId) {
      return Response.json(
        { error: "Missing required fields: file, name, categoryId, projectId" },
        { status: 400 }
      );
    }

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      return Response.json(
        { error: validationError, maxSizeMB: MAX_FILE_SIZE / 1024 / 1024 },
        { status: 400 }
      );
    }

    // Extension whitelist
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return Response.json(
        { error: `File extension .${ext} is not allowed` },
        { status: 400 }
      );
    }

    // Check if category and project exist
    const [category, project] = await Promise.all([
      prisma.documentCategory.findUnique({ where: { id: categoryId } }),
      prisma.project.findUnique({ where: { id: projectId } }),
    ]);

    if (!category || !project) {
      return Response.json(
        { error: "Category or Project not found" },
        { status: 404 }
      );
    }

    if (!(await userCanAccessProject(user, projectId))) {
      return Response.json(
        { error: "You don't have permission to upload documents to this project" },
        { status: 403 }
      );
    }

    // Ensure upload directory exists. Files are stored OUTSIDE public/ so
    // Next.js never serves them statically — access goes through the
    // authenticated, authorization-checked download handler.
    const uploadDir = path.join(process.cwd(), "uploads", "documents");
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const filePath = path.join(uploadDir, uniqueName);

    // Write file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    // Create Document record
    const document = await prisma.document.create({
      data: {
        name,
        description,
        fileUrl: `/uploads/documents/${uniqueName}`,
        fileType: ext,
        fileSize: file.size,
        categoryId,
        projectId,
        uploaderId: user.id,
        isClientVisible,
        status: documentStatus,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        createdBy: user.id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return Response.json({ data: document }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("ENOSPC") || error.message.includes("EACCES"))
    ) {
      return apiError(
        new Error("Failed to write file: insufficient disk space or permissions")
      );
    }
    return apiError(error);
  }
});

// GET /api/documents - List documents with filters
export const GET = withPermission("file:read", async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const clientVisible = searchParams.get("clientVisible");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause
    const where: any = {
      project: accessibleProjectWhere(user),
    };

    if (user.role === "CLIENT" || user.role === "HOME_OWNER") {
      where.isClientVisible = true;
    }

    if (categoryId) where.categoryId = categoryId;
    if (projectId) where.projectId = projectId;
    if (status) {
      const allowedStatuses = new Set(["ACTIVE", "DRAFT", "ARCHIVED"]);
      const statuses = status.split(",").map((value) => value.trim()).filter(Boolean);
      if (statuses.length === 0 || statuses.some((value) => !allowedStatuses.has(value))) {
        return Response.json({ error: "Invalid document status filter" }, { status: 400 });
      }
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }
    if (clientVisible === "true") where.isClientVisible = true;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.document.count({ where });

    // Get documents with pagination
    const documents = await prisma.document.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return Response.json({
      data: documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return apiError(error);
  }
});
