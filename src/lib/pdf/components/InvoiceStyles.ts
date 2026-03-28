import { StyleSheet, Font } from "@react-pdf/renderer";

// ─── Font Registration ───────────────────────────────────────────────────────
Font.register({
  family: "Lato",
  fonts: [
    { src: "/fonts/Lato-Regular.ttf" },
    { src: "/fonts/Lato-Bold.ttf", fontWeight: "bold" },
    { src: "/fonts/Lato-Italic.ttf", fontStyle: "italic" },
  ],
});

// ─── Color tokens ────────────────────────────────────────────────────────────
export const colors = {
  primary: "#6C7A5F",
  dark: "#000000",
  border: "#e4e4e4",
  white: "#ffffff",
};

// ─── Column geometry ──────────────────────────────────────────────────────────
// A4 content width ≈ 506pt (595 − 56 paddingLeft − 33 paddingRight)
// Target: right block starts at ~60% ≈ 304pt from left → right block = ~202pt
// infoCol (Order Id)   = 100pt
// infoColLast (Order Date) = 102pt
// addressIssuedCol = 202pt (same combined width)
//
// Table target (from screenshot):
// Description ~37%, Frequency ~13%, Qty ~8%, Unit Price ~22%, Amount ~20%
// → flex: 4, 1.4, 0.8, 2, 2

// ─── Styles ───────────────────────────────────────────────────────────────────
export const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingLeft: 56,
    paddingRight: 33,
    paddingBottom: 0,
    display: "flex",
    flexDirection: "column",
    minHeight: "100%",
    fontSize: 10,
    color: colors.dark,
    fontFamily: "Lato",
    backgroundColor: colors.white,
  },

  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 25,
    backgroundColor: colors.primary,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: "solid",
    paddingBottom: 16,
    marginBottom: 24,
  },
  invoiceTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.primary,
    lineHeight: 1.1,
  },
  invoiceDate: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
  },
  logoArea: {
    flexDirection: "column",
    alignItems: "center",       // Vertically centers logo with text
    justifyContent: "flex-end",  // Pushes the whole group to the right
  },
  brandName: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  logoWrapper: {
    marginHorizontal: 6,        // Even spacing on both sides of the logo
    marginTop: 2,               // Fine-tunes the logo to hit the text baseline
  },

  // ── Info grid ────────────────────────────────────────────────────────────────
  // [Recipient: flex:1] [Order Id: 100pt] [Order Date: 102pt]
  infoGrid: {
    flexDirection: "row",
    marginBottom: 24,
  },
  infoCol: {
    flexDirection: "column",
    gap: 2,
    width: 80,
  },
  infoColLast: {
    flexDirection: "column",
    gap: 2,
    width: 90,
  },
  label: {
    fontSize: 9,
    color: colors.dark,
    marginBottom: 1,
    fontWeight: "bold",
  },
  infoNameBold: {
    fontSize: 10,
    color: colors.dark,

  },
  infoText: {
    fontSize: 10,
    color: colors.dark,
  },
  infoTextBold: {
    fontSize: 10,
    color: colors.dark,

  },

  // ── Address grid ─────────────────────────────────────────────────────────────
  // [Bill To: flex:1] [Issued By: 202pt]
  // 202pt = infoCol(100) + infoColLast(102) → same left edge as Order Id
  addressGrid: {
    flexDirection: "row",
    marginBottom: 28,
  },
  addressCol: {
    flex: 1,
    flexDirection: "column",
    gap: 1,
    maxWidth: 280,   // ← add this
  },
  addressIssuedCol: {
    width: 170,
    flexDirection: "column",
    gap: 1,
    marginLeft: "auto",   // ← add this
  },
  addrBold: {
    fontSize: 10,
    color: colors.dark,
    marginBottom: 1,

  },
  addrText: {
    fontSize: 10,
    color: colors.dark,
    lineHeight: 1.3,
  },

  // ── Table ────────────────────────────────────────────────────────────────────
  table: {
    width: "100%",
    marginBottom: 20,
    marginTop: 20,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center", // This centers items vertically
    display: "flex",
  },
  tableHead: {
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    borderBottomStyle: "solid",
    paddingBottom: 10,
    marginBottom: 4,
  },
  tableBodyRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: "solid",
    paddingTop: 10,
    paddingBottom: 10,
  },
  th: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.dark,
  },
  td: {
    fontSize: 9,
    color: colors.dark,
  },

  // ── Totals ───────────────────────────────────────────────────────────────────
  totalsWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 40,
  },
  totalsBlock: {
    width: "42%",
    flexDirection: "column",
    gap: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalRowLabel: {
    fontSize: 10,
    color: colors.dark,
  },
  totalRowValue: {
    fontSize: 10,
    color: colors.dark,
  },
  totalDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopStyle: "solid",
    marginTop: 8,
    marginBottom: 4,
  },
  totalFinalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 11,
    color: colors.dark,
  },
  totalValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.dark,
  },

  // ── Footer ───────────────────────────────────────────────────────────────────
  footer: {
    marginTop: "auto",
    paddingBottom: 30,
  },
  footerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: "solid",
    paddingBottom: 10,
    marginBottom: 14,
  },
  thankYou: {
    fontSize: 10,
    fontStyle: "italic",
    color: colors.dark,
  },
  paidVia: {
    fontSize: 10,
    color: colors.dark,
  },
  footerBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  trn: {
    fontSize: 10,
    color: colors.dark,
    fontWeight: "normal", // This overrides the parent's bold setting
  },
  companyFooter: {
    fontSize: 10,
    fontStyle: "italic",
    color: colors.dark,
    textAlign: "right",
    marginBottom: 3,
  },
  terms: {
    fontSize: 10,
    color: colors.dark,
    textDecoration: "underline",
  },
});