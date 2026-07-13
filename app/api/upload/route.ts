// ============================================================
// Smart Konstruksi — File Upload API (Secured)
// POST /api/upload — Upload multiple image/files with validation
// ============================================================
// SECURITY:
// 1. Permission check: file:upload
// 2. File size limit: 10MB
// 3. MIME type whitelist: jpeg, png, webp, gif, pdf, doc, xls
// 4. Extension whitelist (defense-in-depth)
// 5. Path traversal prevention via crypto.randomUUID
// ============================================================

import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import { validateFile, MAX_FILE_SIZE } from "@/lib/validation/schemas";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Allowed file extensions (defense-in-depth alongside MIME check)
const ALLOWED_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "webp", "gif",
  "pdf", "doc", "docx", "xls", "xlsx",
]);

// POST /api/upload — Upload multiple files
export const POST = withPermission("file:upload", async (request, { user }) => {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return Response.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Enforce max file count per request
    if (files.length > 20) {
      return Response.json(
        { error: "Too many files. Max 20 files per request" },
        { status: 400 }
      );
    }

    // Validate each file before any write
    const errors: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!(file instanceof File)) {
        errors.push(`File at index ${i} is invalid`);
        continue;
      }

      // MIME type + size validation
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`File "${file.name}": ${validationError}`);
        continue;
      }

      // Extension whitelist (defense-in-depth)
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        errors.push(`File "${file.name}": extension .${ext} is not allowed`);
        continue;
      }
    }

    // Return all validation errors at once
    if (errors.length > 0) {
      return Response.json(
        {
          error: "File validation failed",
          details: errors,
          maxSizeMB: MAX_FILE_SIZE / 1024 / 1024,
        },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "reports");
    await mkdir(uploadDir, { recursive: true });

    const uploadedFiles: Array<{
      id: string;
      filename: string;
      url: string;
      size: number;
      mimeType: string;
    }> = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      // Generate unique filename
      const ext = file.name.split(".").pop() || "jpg";
      const uniqueName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const filePath = path.join(uploadDir, uniqueName);

      // Convert File to Buffer and write to disk
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await writeFile(filePath, buffer);

      // Create File record in DB
      const fileRecord = await prisma.file.create({
        data: {
          filename: file.name,
          url: `/uploads/reports/${uniqueName}`,
          size: file.size,
          mimeType: file.type,
          uploaderId: user.id,
          createdBy: user.id,
        },
        select: {
          id: true,
          filename: true,
          url: true,
          size: true,
          mimeType: true,
        },
      });

      uploadedFiles.push(fileRecord);
    }

    return Response.json({ data: uploadedFiles }, { status: 201 });
  } catch (error) {
    // Handle disk-space or write failures gracefully
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
