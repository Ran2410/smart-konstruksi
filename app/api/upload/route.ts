// ============================================================
// Smart Konstruksi — File Upload API
// POST /api/upload — Upload multiple image files
// ============================================================

import { prisma } from "@/lib/prisma";
import { withAuth, apiSuccess } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// POST /api/upload — Upload multiple image files
export const POST = withAuth(async (request, { user }) => {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return apiError(new Error("No files provided"));
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

      // Generate unique filename: timestamp + uuid + original extension
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

    return apiSuccess({ data: uploadedFiles });
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
