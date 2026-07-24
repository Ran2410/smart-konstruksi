import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// ── Colors ─────────────────────────────────────────────────────────────────
const C = {
  primary: "#004f35",
  textDark: "#1a1a1a",
  textBody: "#333333",
  textMuted: "#6f7a72",
  border: "#e0e5e2",
  borderLight: "#eef2ef",
  bgLight: "#f8faf9",
  white: "#ffffff",
};

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    padding: "48px 56px",
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.textBody,
    lineHeight: 1.5,
    backgroundColor: C.white,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 36,
    paddingBottom: 24,
    borderBottom: `1px solid ${C.border}`,
  },
  companyInfo: {
    gap: 4,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 700,
    color: C.primary,
    letterSpacing: -0.3,
  },
  companyDetail: {
    fontSize: 9,
    color: C.textMuted,
    lineHeight: 1.6,
  },
  titleSection: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: C.textDark,
  },
  invoiceNoText: {
    fontSize: 11,
    fontWeight: 600,
    color: C.textMuted,
    marginTop: 4,
  },
  // Status Badge (divider line)
  statusLine: {
    height: 3,
    backgroundColor: C.primary,
    borderRadius: 2,
    marginBottom: 28,
    width: 80,
  },
  // Info Grid
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  infoBlock: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: 600,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 10,
    fontWeight: 600,
    color: C.textDark,
  },
  infoSub: {
    fontSize: 9,
    color: C.textMuted,
    marginTop: 2,
  },
  // Table
  table: {
    marginBottom: 32,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.primary,
    borderRadius: 4,
    padding: "8px 12px",
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 700,
    color: C.white,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: "row",
    padding: "10px 12px",
    borderBottom: `1px solid ${C.borderLight}`,
  },
  tableRowEven: {
    backgroundColor: C.bgLight,
  },
  tableCellDesc: { flex: 3 },
  tableCellQty: { flex: 1, textAlign: "right" },
  tableCellPrice: { flex: 2, textAlign: "right" },
  tableCellTotal: { flex: 2, textAlign: "right" },
  cellDescText: {
    fontSize: 10,
    color: C.textDark,
  },
  cellText: {
    fontSize: 10,
    fontWeight: 600,
    color: C.textDark,
  },
  // Summary
  summary: {
    marginLeft: "auto",
    width: "45%",
    gap: 6,
    padding: 16,
    backgroundColor: C.bgLight,
    borderRadius: 8,
    marginBottom: 32,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontSize: 9,
    color: C.textMuted,
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 600,
    color: C.textDark,
  },
  summaryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTop: `1.5px solid ${C.primary}`,
    marginTop: 4,
  },
  summaryTotalLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: C.textDark,
  },
  summaryTotalValue: {
    fontSize: 14,
    fontWeight: 700,
    color: C.primary,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 36,
    left: 56,
    right: 56,
    borderTop: `1px solid ${C.border}`,
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: C.textMuted,
  },
  // Payment Summary
  paymentSummary: {
    marginBottom: 32,
  },
  paymentTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: C.textDark,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "6px 12px",
    backgroundColor: C.bgLight,
    borderRadius: 4,
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 9,
    color: C.textMuted,
  },
  paymentAmount: {
    fontSize: 9,
    fontWeight: 600,
    color: C.textDark,
  },
});

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmtCurrency(amount: number | string | null | undefined): string {
  if (amount == null) return "—";
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ── Types ───────────────────────────────────────────────────────────────────
export type InvoicePdfData = {
  invoiceNo: string;
  status: string;
  amount: number;
  totalPaid: number;
  remainingAmount: number;
  issuedAt: string;
  dueDate: string;
  paidAt: string | null;
  logoUri: string | null;
  project: {
    name: string;
    code: string | null;
    branch: { name: string } | null;
  } | null;
  payments: {
    amount: number;
    method: string;
    paidAt: string;
    confirmedBy: { name: string } | null;
  }[];
  company?: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
};

// ── PDF Document Component ─────────────────────────────────────────────────
export default function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const company = data.company || {
    name: "PT Karya Solusi Indonesia",
    address: "Jl. Merdeka No. 123, Bandung, Jawa Barat 40123",
    phone: "+62 22 1234 5678",
    email: "finance@karyasolusindonesia.com",
  };

  const remaining = Math.max(0, data.amount - data.totalPaid);
  const isPaid = data.status === "PAID";
  const isOverdue = data.status === "OVERDUE";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            {data.logoUri && (
              <Image
                src={data.logoUri}
                style={{ width: 60, height: 60, objectFit: "contain" }}
              />
            )}
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{company.name}</Text>
              <Text style={styles.companyDetail}>{company.address}</Text>
              <Text style={styles.companyDetail}>
                {company.phone} &nbsp;|&nbsp; {company.email}
              </Text>
            </View>
          </View>
          <View style={styles.titleSection}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNoText}>{data.invoiceNo}</Text>
          </View>
        </View>

        {/* Status indicator */}
        <View style={styles.statusLine} />

        {/* ── Info Grid ──────────────────────────────────────────────── */}
        <View style={styles.infoGrid}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Project</Text>
            <Text style={styles.infoValue}>{data.project?.name || "—"}</Text>
            {data.project?.code && (
              <Text style={styles.infoSub}>Code: {data.project.code}</Text>
            )}
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Branch</Text>
            <Text style={styles.infoValue}>
              {data.project?.branch?.name || "—"}
            </Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Issued Date</Text>
            <Text style={styles.infoValue}>{fmtDate(data.issuedAt)}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Due Date</Text>
            <Text
              style={{
                ...styles.infoValue,
                color: isOverdue ? "#ba1a1a" : styles.infoValue.color,
              }}
            >
              {fmtDate(data.dueDate)}
            </Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text
              style={{
                ...styles.infoValue,
                color: isPaid
                  ? "#15803d"
                  : isOverdue
                    ? "#ba1a1a"
                    : styles.infoValue.color,
              }}
            >
              {data.status}
            </Text>
          </View>
        </View>

        {/* ── Line Items Table ───────────────────────────────────────── */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.tableCellDesc]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderText, styles.tableCellQty]}>
              Qty
            </Text>
            <Text style={[styles.tableHeaderText, styles.tableCellPrice]}>
              Unit Price
            </Text>
            <Text style={[styles.tableHeaderText, styles.tableCellTotal]}>
              Total
            </Text>
          </View>

          {/* Single line item — invoice total */}
          <View
            style={[styles.tableRow, { backgroundColor: C.bgLight }]}
          >
            <Text style={[styles.cellDescText, styles.tableCellDesc]}>
              {data.project?.name || "Construction Project"}
              {" — "}
              {data.invoiceNo}
            </Text>
            <Text style={[styles.cellText, styles.tableCellQty]}>1</Text>
            <Text style={[styles.cellText, styles.tableCellPrice]}>
              {fmtCurrency(data.amount)}
            </Text>
            <Text
              style={[
                styles.cellText,
                styles.tableCellTotal,
                { fontWeight: 700 },
              ]}
            >
              {fmtCurrency(data.amount)}
            </Text>
          </View>
        </View>

        {/* ── Summary ────────────────────────────────────────────────── */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              {fmtCurrency(data.amount)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Paid</Text>
            <Text
              style={{
                ...styles.summaryValue,
                color: "#15803d",
              }}
            >
              {fmtCurrency(data.totalPaid)}
            </Text>
          </View>
          {!isPaid && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Remaining</Text>
              <Text
                style={{
                  ...styles.summaryValue,
                  color: remaining > 0 ? "#b45309" : styles.summaryValue.color,
                }}
              >
                {fmtCurrency(remaining)}
              </Text>
            </View>
          )}
          <View style={styles.summaryTotal}>
            <Text style={styles.summaryTotalLabel}>
              {isPaid ? "Total Paid" : "Total Due"}
            </Text>
            <Text style={styles.summaryTotalValue}>
              {fmtCurrency(isPaid ? data.totalPaid : data.amount)}
            </Text>
          </View>
        </View>

        {/* ── Payment History ────────────────────────────────────────── */}
        {data.payments.length > 0 && (
          <View style={styles.paymentSummary}>
            <Text style={styles.paymentTitle}>Payment History</Text>
            {data.payments.map((p, i) => (
              <View key={i} style={styles.paymentRow}>
                <View>
                  <Text style={styles.paymentDate}>
                    {fmtDate(p.paidAt)} &nbsp;—&nbsp; {p.method}
                  </Text>
                  {p.confirmedBy && (
                    <Text
                      style={{
                        fontSize: 8,
                        color: "#15803d",
                        marginTop: 2,
                      }}
                    >
                      Verified by {p.confirmedBy.name}
                    </Text>
                  )}
                </View>
                <Text style={styles.paymentAmount}>
                  {fmtCurrency(p.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Payment Terms ──────────────────────────────────────────── */}
        {!isPaid && (
          <View
            style={{
              padding: "12px 16px",
              backgroundColor: C.bgLight,
              borderRadius: 6,
              marginBottom: 32,
            }}
          >
            <Text
              style={{
                fontSize: 8,
                fontWeight: 700,
                color: C.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              Payment Instructions
            </Text>
            <Text style={{ fontSize: 9, color: C.textBody, lineHeight: 1.6 }}>
              Please transfer the amount to:
              {"\n"}
              Bank: BCA — Account: 1234567890 — Name: PT Karya Solusi Indonesia
              {"\n"}
              Reference: {data.invoiceNo}
            </Text>
          </View>
        )}

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Invoice #{data.invoiceNo} — Generated on {fmtDate(new Date())}
          </Text>
          <Text style={styles.footerText}>
            PT Karya Solusi Indonesia &bull; {data.project?.branch?.name || "Bandung"}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
