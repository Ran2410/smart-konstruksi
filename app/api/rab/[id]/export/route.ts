// ============================================================
// Smart Konstruksi — RAB Export to Excel
// GET /api/rab/[id]/export — Download RAB as .xlsx
// ============================================================

import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import ExcelJS from "exceljs";

function extractIdFromPath(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  // /api/rab/<id>/export → parts[3]
  return pathParts[3] || "";
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export const GET = withPermission(
  "rab:read",
  async (request, { user }) => {
    try {
      const id = extractIdFromPath(request.url);
      if (!id) return apiError(new Error("RAB ID is required"));

      const rab = await prisma.rAB.findFirst({
        where: { id, deletedAt: null },
        include: {
          lead: {
            select: { name: true, company: true, location: true },
          },
          items: {
            orderBy: [{ section: "asc" }, { createdAt: "asc" }],
          },
        },
      });

      if (!rab) return apiError(new Error("RAB not found"));

      // Group items by section
      const sections = [...new Set(rab.items.map((i) => i.section))];
      const sectionRows: { section: string; items: typeof rab.items }[] = sections.map((s) => ({
        section: s,
        items: rab.items.filter((i) => i.section === s),
      }));

      const grandTotal = rab.items.reduce((sum, i) => sum + Number(i.total), 0);
      const marginPct = Number(rab.marginPercent);
      const marginAmount = grandTotal * marginPct / 100;
      const grandTotalWithMargin = grandTotal + marginAmount;

      // ── Build Excel Workbook ──────────────────────────────────────────
      const wb = new ExcelJS.Workbook();
      wb.creator = "Smart Konstruksi ERP";
      wb.created = new Date();

      const ws = wb.addWorksheet(`RAB ${rab.code}`);

      // Column widths
      ws.getColumn(1).width = 6;   // No
      ws.getColumn(2).width = 22;  // Section
      ws.getColumn(3).width = 36;  // Item Name
      ws.getColumn(4).width = 10;  // Unit
      ws.getColumn(5).width = 14;  // Qty
      ws.getColumn(6).width = 22;  // Unit Price
      ws.getColumn(7).width = 22;  // Total

      // ── Title section ────────────────────────────────────────────────
      ws.mergeCells("A1:G1");
      const titleCell = ws.getCell("A1");
      titleCell.value = `RENCANA ANGGARAN BIAYA (RAB)`;
      titleCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FF004f35" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      ws.getRow(1).height = 36;

      ws.mergeCells("A2:G2");
      const codeCell = ws.getCell("A2");
      codeCell.value = `${rab.code} — ${rab.title}`;
      codeCell.font = { name: "Calibri", size: 12, bold: true, color: { argb: "FF333333" } };
      codeCell.alignment = { horizontal: "center" };
      ws.getRow(2).height = 24;

      // ── Info section ────────────────────────────────────────────────
      const infoStart = 4;
      const infoData = [
        { label: "Lead / Client", value: rab.lead?.name || "—" },
        { label: "Company", value: rab.lead?.company || "—" },
        { label: "Location", value: rab.lead?.location || "—" },
        { label: "Status", value: rab.status },
      ];

      infoData.forEach((info, i) => {
        const rowNum = infoStart + i;
        const labelCell = ws.getCell(`A${rowNum}`);
        labelCell.value = info.label;
        labelCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF6f7a72" } };
        labelCell.alignment = { vertical: "middle" };

        const valCell = ws.getCell(`B${rowNum}`);
        ws.mergeCells(`B${rowNum}:G${rowNum}`);
        valCell.value = info.value;
        valCell.font = { name: "Calibri", size: 10 };
        valCell.alignment = { vertical: "middle" };
      });

      // ── Header row ──────────────────────────────────────────────────
      const headerRowNum = infoStart + infoData.length + 1;
      const headerRow = ws.getRow(headerRowNum);
      headerRow.height = 28;

      const headers = ["No", "Section", "Item Name", "Unit", "Qty", "Unit Price", "Total"];
      headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF004f35" } };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // ── Item rows ───────────────────────────────────────────────────
      let rowIdx = headerRowNum + 1;
      let no = 1;

      for (const section of sectionRows) {
        const startRow = rowIdx;
        section.items.forEach((item) => {
          const row = ws.getRow(rowIdx);
          row.height = 20;

          row.getCell(1).value = no++;
          row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

          if (rowIdx === startRow) {
            // Merge section cells vertically
            // We'll handle this after we know the count
          }

          row.getCell(2).value = item.section;
          row.getCell(2).font = { name: "Calibri", size: 10 };
          row.getCell(2).alignment = { vertical: "middle" };

          row.getCell(3).value = item.name;
          row.getCell(3).font = { name: "Calibri", size: 10 };
          row.getCell(3).alignment = { vertical: "middle" };

          row.getCell(4).value = item.unit;
          row.getCell(4).font = { name: "Calibri", size: 10 };
          row.getCell(4).alignment = { horizontal: "center", vertical: "middle" };

          row.getCell(5).value = Number(item.qty);
          row.getCell(5).font = { name: "Calibri", size: 10 };
          row.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
          row.getCell(5).numFmt = '#,##0.00';

          row.getCell(6).value = Number(item.unitPrice);
          row.getCell(6).font = { name: "Calibri", size: 10 };
          row.getCell(6).alignment = { horizontal: "right", vertical: "middle" };
          row.getCell(6).numFmt = '#,##0';

          row.getCell(7).value = Number(item.total);
          row.getCell(7).font = { name: "Calibri", size: 10, bold: true };
          row.getCell(7).alignment = { horizontal: "right", vertical: "middle" };
          row.getCell(7).numFmt = '#,##0';

          // Borders for all cells
          for (let c = 1; c <= 7; c++) {
            row.getCell(c).border = {
              top: { style: "thin", color: { argb: "FFbec9c1" } },
              bottom: { style: "thin", color: { argb: "FFbec9c1" } },
              left: { style: "thin", color: { argb: "FFbec9c1" } },
              right: { style: "thin", color: { argb: "FFbec9c1" } },
            };
            row.getCell(c).fill = rowIdx % 2 === 0
              ? { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5f8f6" } }
              : undefined;
          }

          rowIdx++;
        });

        // Merge section cells for all items in this section
        const count = section.items.length;
        if (count > 1) {
          ws.mergeCells(`B${startRow}:B${startRow + count - 1}`);
          ws.getCell(`B${startRow}`).alignment = {
            vertical: "middle",
            wrapText: true,
          };
        }
      }

      // ── Summary section ──────────────────────────────────────────────
      rowIdx++; // blank row

      // Section totals
      for (const section of sectionRows) {
        const secTotal = section.items.reduce((s, i) => s + Number(i.total), 0);
        const row = ws.getRow(rowIdx);
        row.height = 20;

        ws.mergeCells(`A${rowIdx}:F${rowIdx}`);
        row.getCell(1).value = `Subtotal: ${section.section}`;
        row.getCell(1).font = { name: "Calibri", size: 10, bold: true, italic: true };
        row.getCell(1).alignment = { horizontal: "right", vertical: "middle" };

        row.getCell(7).value = secTotal;
        row.getCell(7).font = { name: "Calibri", size: 10, bold: true };
        row.getCell(7).alignment = { horizontal: "right", vertical: "middle" };
        row.getCell(7).numFmt = '#,##0';

        for (let c = 1; c <= 7; c++) {
          row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFeef2ef" } };
          row.getCell(c).border = { top: { style: "thin", color: { argb: "FFbec9c1" } }, bottom: { style: "thin", color: { argb: "FFbec9c1" } } };
        }
        rowIdx++;
      }

      // Grand Total
      const totalRow = ws.getRow(rowIdx);
      totalRow.height = 24;
      ws.mergeCells(`A${rowIdx}:F${rowIdx}`);
      totalRow.getCell(1).value = "GRAND TOTAL";
      totalRow.getCell(1).font = { name: "Calibri", size: 12, bold: true, color: { argb: "FF004f35" } };
      totalRow.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
      totalRow.getCell(7).value = grandTotal;
      totalRow.getCell(7).font = { name: "Calibri", size: 12, bold: true, color: { argb: "FF004f35" } };
      totalRow.getCell(7).alignment = { horizontal: "right", vertical: "middle" };
      totalRow.getCell(7).numFmt = '#,##0';
      for (let c = 1; c <= 7; c++) {
        totalRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFd4e8e1" } };
        totalRow.getCell(c).border = {
          top: { style: "medium", color: { argb: "FF004f35" } },
          bottom: { style: "medium", color: { argb: "FF004f35" } },
          left: { style: "thin", color: { argb: "FFbec9c1" } },
          right: { style: "thin", color: { argb: "FFbec9c1" } },
        };
      }
      rowIdx++;

      // Margin row
      if (marginPct > 0) {
        const marginRow = ws.getRow(rowIdx);
        marginRow.height = 22;
        ws.mergeCells(`A${rowIdx}:F${rowIdx}`);
        marginRow.getCell(1).value = `Overhead & Profit (${marginPct}%)`;
        marginRow.getCell(1).font = { name: "Calibri", size: 10, bold: true, italic: true, color: { argb: "FFb45309" } };
        marginRow.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
        marginRow.getCell(7).value = marginAmount;
        marginRow.getCell(7).font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFb45309" } };
        marginRow.getCell(7).alignment = { horizontal: "right", vertical: "middle" };
        marginRow.getCell(7).numFmt = '#,##0';
        for (let c = 1; c <= 7; c++) {
          marginRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFfef3e7" } };
          marginRow.getCell(c).border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
        }
        rowIdx++;

        // Grand Total with Margin
        const finalRow = ws.getRow(rowIdx);
        finalRow.height = 28;
        ws.mergeCells(`A${rowIdx}:F${rowIdx}`);
        finalRow.getCell(1).value = "TOTAL (incl. Margin)";
        finalRow.getCell(1).font = { name: "Calibri", size: 14, bold: true, color: { argb: "FF004f35" } };
        finalRow.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
        finalRow.getCell(7).value = grandTotalWithMargin;
        finalRow.getCell(7).font = { name: "Calibri", size: 14, bold: true, color: { argb: "FF004f35" } };
        finalRow.getCell(7).alignment = { horizontal: "right", vertical: "middle" };
        finalRow.getCell(7).numFmt = '#,##0';
        for (let c = 1; c <= 7; c++) {
          finalRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF004f35" } };
          finalRow.getCell(c).font = { color: { argb: "FFFFFFFF" } };
          finalRow.getCell(c).border = {
            top: { style: "medium", color: { argb: "FF004f35" } },
            bottom: { style: "medium", color: { argb: "FF004f35" } },
          };
        }
      }

      // Generate buffer
      const buffer = await wb.xlsx.writeBuffer();

      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="RAB-${rab.code}.xlsx"`,
        },
      });
    } catch (error) {
      console.error("RAB Export error:", error);
      return apiError(error);
    }
  }
);
