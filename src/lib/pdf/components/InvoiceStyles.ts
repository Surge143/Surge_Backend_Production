import { StyleSheet, Font } from '@react-pdf/renderer'
import fs from 'fs'
import path from 'path'

const fontSrc = (name: string): string => {
  const fontPath = path.join(process.cwd(), 'public', 'fonts', name)
  const buffer = fs.readFileSync(fontPath)
  return `data:font/truetype;base64,${buffer.toString('base64')}`
}

Font.register({
  family: 'Montserrat',
  fonts: [
    { src: fontSrc('Montserrat-Regular.ttf'), fontWeight: 400, fontStyle: 'normal' },
    { src: fontSrc('Montserrat-Italic.ttf'), fontWeight: 400, fontStyle: 'italic' },
    { src: fontSrc('Montserrat-SemiBold.ttf'), fontWeight: 600, fontStyle: 'normal' },
    { src: fontSrc('Montserrat-SemiBoldItalic.ttf'), fontWeight: 600, fontStyle: 'italic' },
    { src: fontSrc('Montserrat-Bold.ttf'), fontWeight: 700, fontStyle: 'normal' },
    { src: fontSrc('Montserrat-BoldItalic.ttf'), fontWeight: 700, fontStyle: 'italic' },
  ],
})

// ─── Font Registration ───────────────────────────────────────────────────────

// ─── Color tokens ────────────────────────────────────────────────────────────
export const colors = {
  primary: '#414343',
  dark: '#818686',
  border: '#818686',
  white: '#ffffff',
}

// ─── Column geometry ──────────────────────────────────────────────────────────
// A4 content width ≈ 506pt (595 − 56 paddingLeft − 33 paddingRight)
// Target: right block starts at ~60% ≈ 304pt from left → right block = ~202pt
// infoCol (Order Id)   = 100pt
// infoColLast (Order Date) = 102pt
// addressIssuedCol = 202pt (same combined width)
//
// Table target (from screenshot):
// Description ~37%, Qty ~13%, Unit Price ~25%, Amount ~25%
// → flex: 4, 1.4, 2, 2

// ─── Styles ───────────────────────────────────────────────────────────────────
export const styles = StyleSheet.create({

  page: {
    paddingLeft: 33,
    paddingRight: 33,
    paddingBottom: 0,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
    fontSize: 10,
    color: colors.dark,
    backgroundColor: colors.white,
    fontFamily: 'Montserrat',   // ← only addition
  },

  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 25,
    backgroundColor: colors.primary,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',            // ← was: 'center'
    // borderBottomWidth: 1,             // ← removed: header bg replaces the border
    // borderBottomColor: colors.border,
    // borderBottomStyle: 'solid',
    paddingTop: 24,                      // ← added: breathe inside the dark block
    paddingBottom: 13,                   // ← was: paddingBottom: 16 (via shorthand)
    // marginBottom: 24,                 // ← removed: body wrapper handles its own top padding
    backgroundColor: colors.primary,
    marginLeft: -56,                     // ← bleed over page paddingLeft
    marginRight: -33,                    // ← bleed over page paddingRight
    paddingLeft: 56,                     // ← restore inner alignment after bleed
    paddingRight: 33,
    marginBottom: 32,
  },

  // ── NEW: brand block (left side of header) ────────────────────────────────
  brandBlock: {
    flexDirection: 'column',
    gap: 5,
  },
  brandSub: {                            // company address lines under the name
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 1.7,
    fontWeight: 'normal',
  },

  // ── NEW: invoice date label (small text above the date on the right) ──────
  invoiceDateLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    // marginTop: 6,
  },

  invoiceTitle: {
    fontSize: 16,
    // fontWeight: 'bold',
    fontWeight: 600,
    color: colors.white,
    // lineHeight: 1.1,
    // paddingLeft: 29,                  // ← removed: was a positional hack for old layout
    // paddingTop: 20,                   // ← removed: same
  },
  invoiceTitleDate: {
    fontSize: 12,
    fontWeight: 400,
    color: colors.white,
    // lineHeight: 1.1,
    // paddingLeft: 29,                  // ← removed: was a positional hack for old layout
    // paddingTop: 20,                   // ← removed: same
  },
  invoiceDate: {
    fontSize: 12,
    color: colors.white,
    marginTop: 4,
    // paddingLeft: 38,                  // ← removed: was a positional hack for old layout
  },
  logoArea: {
    flexDirection: 'column',
    alignItems: 'flex-end',             // ← was: 'center'
    justifyContent: 'flex-start',       // ← was: 'flex-end'
  },
  brandName: {
    fontSize: 22,                       // ← was: 12 — matches the large SURGE in the header
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  brandDetail: {
    fontSize: 12,
    color: colors.white,
    fontWeight: 400,
    // lineHeight: 1.7,
  },
  logoWrapper: {
    // marginHorizontal: 6,
    // marginTop: 2,
  }
  ,

  // ── NEW: body wrapper (replaces the old paddingTop on page) ───────────────
  body: {
    paddingTop: 28,
    flexGrow: 1,
  },

  // ── Info grid ────────────────────────────────────────────────────────────────
  // [Recipient: flex:1] [Invoice no.: 100pt] [Order Date: 102pt]
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  // ── NEW: flex-1 recipient column (was written inline in the component) ─────
  infoColGrow: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  infoCol: {
    flexDirection: 'column',
    gap: 2,
    width: 100,                         // ← was: 80
  },
  infoColLast: {
    flexDirection: 'column',
    gap: 2,
    width: 102,                         // ← was: 90
  },
  label: {
    fontSize: 12,
    fontWeight: 400,
    color: colors.dark,
    marginBottom: 1,
  },
  infoNameBold: {
    fontSize: 10,
    color: colors.primary,
    marginBottom: 7,
  },
  infoText: {
    fontSize: 10,
    color: colors.primary,
  },
  infoTextBold: {
    fontSize: 10,
    color: colors.primary,
  },

  // ── NEW: second meta row (Payment Method / Pickup Time) ──────────────────
  infoGridSecond: {
    flexDirection: 'row',
    marginBottom: 24,
    marginTop: -16,                     // pulls it closer under the first row
  },
  infoGridSecondSpacer: {
    flex: 1,
  },

  // ── Address grid ─────────────────────────────────────────────────────────────
  // [Bill To: flex:1] [Issued By / Ship To: 202pt]
  addressGrid: {
    flexDirection: 'row',
    marginBottom: 28,
  },
  addressCol: {
    flex: 1,
    flexDirection: 'column',
    gap: 1,
    maxWidth: 280,
  },
  addressIssuedCol: {
    width: 202,                         // ← was: 170 — matches infoCol + infoColLast
    flexDirection: 'column',
    gap: 1,
    marginLeft: 'auto',
  },
  addrBold: {
    fontSize: 10,
    color: colors.primary,
    marginBottom: 1,
  },
  addrText: {
    fontSize: 10,
    color: colors.primary,
    lineHeight: 1.3,
  },

  // ── Table ────────────────────────────────────────────────────────────────────
  table: {
    width: '100%',
    marginBottom: 20,
    // marginTop: 20,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    display: 'flex',
  },
  tableHead: {
    borderBottomWidth: 1,
    borderBottomColor: colors.dark,
    borderBottomStyle: 'solid',
    paddingBottom: 10,
    marginBottom: 4,
  },
  tableBodyRow: {
    // borderBottomWidth: 1,
    borderBottomColor: colors.border,
    // borderBottomStyle: 'solid',
    paddingTop: 10,
    paddingBottom: 10,
  },
  th: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
  },
  td: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: 400,
  },

  // ── Totals ───────────────────────────────────────────────────────────────────
  totalsWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 40,
  },
  totalsBlock: {
    width: '42%',
    flexDirection: 'column',
    gap: 8,
    color: colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalRowLabel: {
    fontSize: 10,
    color: colors.primary,
  },
  totalRowValue: {
    fontSize: 10,
    color: colors.primary,
  },
  totalDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopStyle: 'solid',
    marginTop: 8,
    marginBottom: 4,
  },
  totalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 600,
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary,
  },

  // ── Footer ───────────────────────────────────────────────────────────────────
  footer: {
    marginTop: 'auto',
    paddingBottom: 30,
  },
  footerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.dark,
    borderBottomStyle: 'solid',
    paddingBottom: 10,
    marginBottom: 14,
  },
  thankYou: {
    fontSize: 12,
    // fontStyle: 'italic',
    color: colors.dark,
    fontWeight: 400,
  },
  paidVia: {
    fontSize: 10,
    color: colors.dark,
  },
  footerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  // ── NEW: footer contact block (left side) ─────────────────────────────────
  footerContactLabel: {
    fontSize: 9,
    color: colors.dark,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  footerContactVal: {
    fontSize: 10,
    color: colors.dark,
    lineHeight: 1.8,
  },

  trn: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: 'normal',

  },
  footerSpace: {
    gap: 2,
    marginTop: 3,
  },
  footerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  // ── NEW: bold portion of the TRN number ───────────────────────────────────
  trnValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.dark,
  },
  companyFooter: {
    fontSize: 10,
    // fontStyle: 'italic',
    color: colors.dark,
    textAlign: 'right',
    marginBottom: 3,
  },

  terms: {
    fontSize: 10,
    color: colors.dark,
    textDecoration: 'underline',
  },
})
