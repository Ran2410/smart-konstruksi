// ============================================================
// Smart Konstruksi — Invoice PDF Generator
// GET /api/invoices/[id]/pdf — Download invoice as PDF
// ============================================================

import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import InvoiceDocument from "@/components/ui/invoice-pdf";
import { renderToStream } from "@react-pdf/renderer";
import fs from "fs";
import path from "path";

/**
 * Helper: extract [id] from URL path
 * /api/invoices/[id]/pdf → parts[3] = [id]
 */
function extractInvoiceId(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  // pathParts: ['', 'api', 'invoices', '<id>', 'pdf']
  return pathParts[3] || "";
}

export const GET = withPermission(
  "invoice:read",
  async (request, { user }) => {
    try {
      const id = extractInvoiceId(request.url);

      if (!id) {
        return apiError(new Error("Invoice ID is required"));
      }

      const invoice = await prisma.invoice.findFirst({
        where: { id, deletedAt: null },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              code: true,
              branch: { select: { name: true } },
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              method: true,
              paidAt: true,
              confirmedBy: { select: { name: true } },
            },
            orderBy: { paidAt: "desc" },
          },
        },
      });

      if (!invoice) {
        return apiError(new Error("Invoice not found"));
      }

      // Calculate totals
      const totalPaid = invoice.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const invoiceAmount = Number(invoice.amount);

      // Load logo as base64 data URI
      let logoUri: string | null = null;
      try {
        const logoPath = path.join(process.cwd(), "public", "smartkonstrunksi.jpeg");
        const logoBuffer = fs.readFileSync(logoPath);
        const logoBase64 = logoBuffer.toString("base64");
        logoUri = `data:image/jpeg;base64,${logoBase64}`;
      } catch {
        // Logo optional — proceed without it
        console.warn("Logo not found, proceeding without it");
      }

      const pdfData = {
        invoiceNo: invoice.invoiceNo,
        status: invoice.status,
        amount: invoiceAmount,
        totalPaid,
        remainingAmount: Math.max(0, invoiceAmount - totalPaid),
        issuedAt: invoice.issuedAt.toISOString(),
        dueDate: invoice.dueDate.toISOString(),
        paidAt: invoice.paidAt?.toISOString() || null,
        logoUri,
        project: invoice.project
          ? {
              name: invoice.project.name,
              code: invoice.project.code,
              branch: invoice.project.branch,
            }
          : null,
        payments: invoice.payments.map((p) => ({
          amount: Number(p.amount),
          method: p.method,
          paidAt: p.paidAt.toISOString(),
          confirmedBy: p.confirmedBy,
        })),
      };

      // Render PDF to stream
      const stream = await renderToStream(
        <InvoiceDocument data={pdfData} />
      );

      // Collect stream into buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk as Uint8Array);
      }
      const buffer = Buffer.concat(chunks);

      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNo}.pdf"`,
          "Content-Length": String(buffer.length),
        },
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      return apiError(error);
    }
  }
);
