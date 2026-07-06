// ============================================================
// Smart Konstruksi — File Serve API
// GET /api/files/[id] — Redirect to file URL for image serving
// ============================================================

import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

// Helper: extract [id] from URL path
function extractId(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  return pathParts[3] || "";
}

// GET /api/files/[id] — Redirect to the actual file URL
export const GET = withAuth(async (request) => {
  try {
    const id = extractId(request.url);
    if (!id) {
      return apiError(new Error("File ID is required"));
    }

    const file = await prisma.file.findFirst({
      where: { id },
      select: { url: true },
    });

    if (!file) {
      return apiError(new Error("File not found"));
    }

    // Redirect to the actual file URL so the browser renders the image
    return new Response(null, {
      status: 302,
      headers: { Location: file.url },
    });
  } catch (error) {
    return apiError(error);
  }
});
