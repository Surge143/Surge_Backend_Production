import React from "react";
import { Document, Page, Link, Text, View, Svg, Path, G, Defs, ClipPath, Rect } from "@react-pdf/renderer";
import { InvoiceData } from "../types/invoice.types";
import { styles, colors as C, colors } from "./InvoiceStyles";

interface InvoiceDocumentProps {
    data: InvoiceData;
}

// ─── White Mantis SVG logo ──────────────────────────────────────────────────
const DiamondLogo = () => (
    <Svg width="39" height="43" viewBox="0 0 39 43">
        <G clipPath="url(#clip0)">
            <Path
                d="M33.3011 0C33.4112 0.0548789 33.533 0.0940781 33.6274 0.164637C33.993 0.427271 34.0559 0.913342 33.7728 1.30926C32.8766 2.56754 31.9764 3.82192 31.0761 5.0763C31.0368 5.13118 31.0015 5.18606 30.9503 5.26446C31.0329 5.26838 31.0919 5.27621 31.1469 5.27621C31.7759 5.27621 32.4048 5.27621 33.0338 5.27621C35.4554 5.27621 36.8705 7.73009 35.6598 9.82332C31.5478 16.9262 27.432 24.0291 23.3202 31.132C22.3059 32.8842 21.2917 34.6326 20.2814 36.3847C20.1202 36.663 19.8962 36.8277 19.5698 36.8356C19.2278 36.8356 18.9919 36.6709 18.8229 36.3808C18.0839 35.099 17.337 33.8172 16.598 32.5353C12.2069 24.9542 7.81592 17.3731 3.42882 9.79197C2.51288 8.20832 3.14579 6.24443 4.80077 5.52709C5.18601 5.36246 5.58699 5.28406 6.00761 5.28406C6.7152 5.28406 7.42673 5.28406 8.17364 5.28406C8.12647 5.20958 8.09109 5.1547 8.05571 5.10766C7.15549 3.84544 6.25134 2.58714 5.35113 1.32493C5.03271 0.881982 5.15457 0.325353 5.6145 0.0979981C5.68134 0.0666387 5.74816 0.0391992 5.815 0.0117598C5.92506 0.0117598 6.03513 0.0117598 6.14914 0.0117598C6.42824 0.109758 6.60907 0.313593 6.77811 0.548789C7.86309 2.07756 8.95986 3.60241 10.0488 5.13118C10.1274 5.24093 10.206 5.28798 10.3475 5.28798C16.4918 5.28406 22.64 5.28406 28.7843 5.28798C28.9219 5.28798 29.0045 5.24878 29.087 5.1351C30.172 3.61024 31.2609 2.09323 32.3459 0.568389C32.5031 0.317513 32.6839 0.101918 32.967 0C33.0771 0 33.1911 0 33.3011 0ZM19.5541 34.4209C19.6052 34.3386 19.6406 34.2797 19.676 34.2209C20.2971 33.1508 20.9182 32.0846 21.5275 31.0106C21.5944 30.889 21.6415 30.7361 21.6415 30.5989C21.6455 25.699 21.6494 20.7991 21.6415 15.8992C21.6415 15.6288 21.7163 15.4013 21.8735 15.1819C23.8114 12.4771 25.7495 9.76845 27.6836 7.0637C27.719 7.01274 27.7543 6.95787 27.8016 6.8873H11.3106C11.3618 6.96178 11.3971 7.01666 11.4325 7.06762C13.3666 9.76845 15.2967 12.4732 17.2348 15.1701C17.3959 15.3974 17.4706 15.6288 17.4706 15.907C17.4667 20.8187 17.4706 25.7343 17.4706 30.646C17.4706 30.7597 17.506 30.889 17.565 30.9909C18.1861 32.0728 18.8112 33.1547 19.4362 34.2327C19.4715 34.2914 19.507 34.3463 19.5541 34.4209ZM15.8275 27.9843L15.8668 27.9726C15.8668 27.9059 15.8668 27.8393 15.8668 27.7727C15.8668 24.084 15.8589 20.3953 15.8746 16.7028C15.8746 16.2246 15.7567 15.8443 15.4737 15.4562C13.4491 12.6536 11.4443 9.839 9.43159 7.0245C9.37262 6.93827 9.32152 6.86379 9.18786 6.8677C8.12647 6.87555 7.06508 6.8677 6.00761 6.87162C5.59092 6.87162 5.23713 7.02058 4.95802 7.33418C4.53739 7.80849 4.49808 8.42391 4.84402 9.02758C8.4724 15.2956 12.1007 21.5634 15.7292 27.8314C15.7606 27.8824 15.792 27.9333 15.8236 27.9843H15.8275ZM23.2533 27.9608C23.2533 27.9608 23.2808 27.9687 23.2926 27.9726C23.3241 27.9216 23.3555 27.8668 23.383 27.8158C24.0945 26.5888 24.8061 25.358 25.5175 24.131C28.4305 19.0979 31.3474 14.0647 34.2564 9.0315C34.3586 8.8551 34.449 8.65127 34.4765 8.45136C34.5984 7.59289 33.9655 6.88338 33.0771 6.87947C32.0549 6.87162 31.029 6.87947 30.0069 6.87555C29.8457 6.87555 29.7553 6.92258 29.6609 7.05194C27.5618 9.9958 25.4547 12.9397 23.3516 15.8836C23.2886 15.9698 23.2494 16.0952 23.2494 16.201C23.2454 20.07 23.2454 23.935 23.2454 27.804V27.9648L23.2533 27.9608Z"
                fill={C.primary}
            />
            <Path
                d="M16.8369 42.9523C16.5656 42.8778 16.3926 42.6936 16.2354 42.4701C11.125 35.2692 6.0067 28.0722 0.892358 20.8754C0.420628 20.2089 0.110071 19.4877 0.0314494 18.6724C0.0314494 18.637 0.0117933 18.6018 0 18.5665C0 18.3469 0 18.1236 0 17.904C0.0471731 17.657 0.0825531 17.4061 0.14152 17.1631C0.416695 16.0538 1.03781 15.1797 1.98913 14.5407C2.23286 14.3761 2.48445 14.2232 2.7439 14.0547C2.99942 14.4662 3.25101 14.866 3.51046 15.2777C3.29819 15.4149 3.08984 15.5481 2.88542 15.6815C1.36409 16.6614 1.00243 18.5272 2.05202 20.0051C6.7143 26.567 11.3726 33.125 16.0349 39.6831C16.0702 39.7301 16.1057 39.7771 16.1882 39.8202V35.4888C16.1882 35.4888 16.2236 35.4809 16.2433 35.477C16.2708 35.5122 16.2983 35.5437 16.3218 35.5829C16.7307 36.2846 17.1395 36.9862 17.5405 37.6918C17.5838 37.7662 17.6074 37.8642 17.6074 37.9505C17.6348 39.3538 17.6545 40.7532 17.6781 42.1566C17.6859 42.5642 17.5169 42.7838 17.0609 42.9601H16.8408L16.8369 42.9523Z"
                fill={C.primary}
            />
            <Path
                d="M38.9991 18.5625C38.9598 18.79 38.9245 19.0212 38.8733 19.2446C38.7357 19.8247 38.4763 20.3501 38.1303 20.8401C34.1875 26.3829 30.2485 31.9295 26.3095 37.4762C25.1264 39.1422 23.9431 40.8042 22.7638 42.4702C22.6065 42.6936 22.4335 42.8779 22.1623 42.9523H21.9422C21.4351 42.7563 21.3171 42.5643 21.3289 42.0194C21.3564 40.6749 21.3721 39.3264 21.3958 37.9819C21.3958 37.8721 21.4311 37.7506 21.4822 37.6565C21.8715 36.9705 22.2685 36.2924 22.6616 35.6103C22.6891 35.5633 22.7205 35.5202 22.7716 35.481C22.8857 36.9274 22.8188 38.3739 22.8266 39.8673C22.8896 39.7851 22.9289 39.7341 22.9642 39.6831C27.2766 33.6151 31.589 27.5471 35.8975 21.479C36.2552 20.9772 36.613 20.4755 36.9668 19.9737C37.9849 18.5312 37.6232 16.6575 36.1412 15.6971C35.9289 15.5599 35.7167 15.4227 35.4848 15.2737C35.7403 14.8661 35.9919 14.4623 36.2395 14.0664C37.5486 14.7524 38.5116 15.7127 38.8615 17.1749C38.9166 17.4141 38.952 17.6571 38.9952 17.8962V18.5586L38.9991 18.5625Z"
                fill={C.primary}
            />
        </G>
        <Defs>
            <ClipPath id="clip0">
                <Rect width="39" height="43" fill="white" />
            </ClipPath>
        </Defs>
    </Svg>
);

const TotalRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.totalRow}>
        <Text style={styles.totalRowLabel}>{label}</Text>
        <Text style={styles.totalRowValue}>{value}</Text>
    </View>
);

export const TakeAwayInvoice: React.FC<InvoiceDocumentProps> = ({ data }) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.sidebar} />

                {/* ── HEADER ── */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.invoiceTitle}>Invoice</Text>
                        <Text style={styles.invoiceDate}>{data.metadata.invoiceDate}</Text>
                    </View>
                    <View style={styles.logoArea}>
                        <View style={styles.logoWrapper}>
                            <DiamondLogo />
                        </View>
                        <Text style={styles.brandName}>WHITE MANTIS</Text>
                    </View>
                </View>

                {/* ── INFO GRID ── */}
                <View style={styles.infoGrid}>
                    <View style={{ flex: 1, flexDirection: "column", gap: 2 }}>
                        <Text style={styles.label}>Recipient</Text>
                        <Text style={styles.infoNameBold}>
                            {data.billTo.first_name} {data.billTo.last_name}
                        </Text>
                        <Text style={styles.infoText}>{data.billTo.email || "N/A"}</Text>
                        <Text style={styles.infoText}>{data.billTo.phone || "N/A"}</Text>
                    </View>

                    <View style={styles.infoCol}>
                        <Text style={styles.label}>Order Id</Text>
                        <Text style={styles.infoText}>#{data.metadata.subscriptionNumber}</Text>
                        <Text style={{ ...styles.label, marginTop: 10 }}>Invoice no.</Text>
                        <Text style={styles.infoTextBold}>{data.metadata.invoiceNumber}</Text>
                    </View>

                    <View style={styles.infoColLast}>
                        <Text style={{ ...styles.label, textAlign: "right" }}>Order Date</Text>
                        <Text style={{ ...styles.infoText, textAlign: "right" }}>{data.metadata.invoiceDate}</Text>
                        You said
                        {data.metadata.pickup && (
                            <>
                                <Text style={{ ...styles.label, marginTop: 10, textAlign: "right" }}>Pickup Time</Text>
                                <Text style={{ ...styles.infoTextBold, textAlign: "right" }}>{data.metadata.pickup}</Text>
                            </>

                        )}
                    </View>
                </View>

                {/* ── LINE ITEMS TABLE ── */}
                <View style={styles.table}>
                    <View style={{ ...styles.tableRow, ...styles.tableHead }}>
                        <Text style={{ ...styles.th, flex: 2 }}>Description</Text>
                        <Text style={{ ...styles.th, flex: 3, textAlign: "center" }}>Customization / Add Ons</Text>
                        <Text style={{ ...styles.th, flex: 0.8, textAlign: "center" }}>Qty</Text>
                        <Text style={{ ...styles.th, flex: 2, textAlign: "right" }}>Unit Price</Text>
                        <Text style={{ ...styles.th, flex: 2, textAlign: "right" }}>Amount</Text>
                    </View>

                    {data.lineItems.map((item) => (
                        <View key={item.id} style={{ ...styles.tableRow, ...styles.tableBodyRow, alignItems: "flex-start" }}>
                            <View style={{ ...styles.td, flex: 2, flexDirection: "column" }}>
                                <Text>{item.name}</Text>

                            </View>

                            <Text style={{ ...styles.td, flex: 3, textAlign: "center" }}>
                                {item.customization || "—"}
                            </Text>

                            <Text style={{ ...styles.td, flex: 0.8, textAlign: "center" }}>{item.quantity}</Text>
                            <Text style={{ ...styles.td, flex: 2, textAlign: "right" }}>AED {item.price.toFixed(0)}</Text>
                            <Text style={{ ...styles.td, flex: 2, textAlign: "right" }}>AED {(item.price * item.quantity).toFixed(0)}</Text>
                        </View>
                    ))}
                </View>

                {/* ── TOTALS ── */}
                <View style={styles.totalsWrapper}>
                    <View style={styles.totalsBlock}>
                        <TotalRow label="Subtotal :" value={`AED ${data.subtotal.toFixed(0)}`} />
                        <TotalRow label="Coupon Discount:" value={`AED ${data.subtotal.toFixed(0)}`} />
                        <TotalRow label="Beans Discount:" value={`AED ${data.subtotal.toFixed(0)}`} />
                        {/* <TotalRow label="Shipping :" value={`AED ${data.shipping.toFixed(0)}`} /> */}
                        <TotalRow label={`${data.taxLabel} :`} value={`AED ${data.tax.toFixed(0)}`} />
                        <View style={styles.totalDivider} />
                        <View style={styles.totalFinalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>AED {Math.round(data.total)}</Text>
                        </View>
                    </View>
                </View>

                {/* ── FOOTER ── */}
                <View style={styles.footer}>
                    <View style={styles.footerTop}>
                        <Text style={styles.thankYou}>Thank you for your subscription</Text>
                        <Text style={styles.paidVia}>Paid via <Text style={{ color: C.dark, fontWeight: "bold" }}>Stripe</Text></Text>
                    </View>
                    <View style={styles.footerBottom}>
                        <Text style={{ color: C.dark, fontWeight: "bold" }}>
                            {data.company.taxId.split(":")[0]}:{" "}
                            <Text style={styles.trn}>{data.company.taxId.split(":")[1]?.trim()}</Text>
                        </Text>
                        <View style={{ textAlign: "right" }}>
                            <Text style={styles.companyFooter}>White Mantis Coffee LLC — Dubai, UAE</Text>
                            <Link src="http://localhost:3000/terms-and-conditions" style={styles.terms}>
                                <Text>Terms and Conditions</Text>
                            </Link>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};