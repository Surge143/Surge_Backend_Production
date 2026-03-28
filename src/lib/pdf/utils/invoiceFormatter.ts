import { InvoiceData, InvoiceLineItem, InvoiceAddress, InvoiceType } from '../types/invoice.types'

/**
 * Format currency value with symbol
 */
export function formatCurrency(amount: number, currencySymbol: string = 'AED'): string {
  return `${currencySymbol} ${amount.toFixed(2)}`
}

/**
 * Format date to readable string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Get currency symbol from currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const symbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'AED',
    SAR: 'SAR',
    INR: '₹',
  }
  return symbols[currencyCode.toUpperCase()] || currencyCode
}

/**
 * Format WooCommerce address to InvoiceAddress
 */
export function formatAddress(wcAddress: any): InvoiceAddress {
  return {
    first_name: wcAddress.first_name || '',
    last_name: wcAddress.last_name || '',
    company: wcAddress.company || '',
    address_1: wcAddress.address_1 || '',
    address_2: wcAddress.address_2 || '',
    city: wcAddress.city || '',
    state: wcAddress.state || '',
    postcode: wcAddress.postcode || '',
    country: wcAddress.country || '',
    email: wcAddress.email || '',
    phone: wcAddress.phone || '',
  }
}

/**
 * Format WooCommerce line items to InvoiceLineItem
 */
export function formatLineItems(wcLineItems: any[]): InvoiceLineItem[] {
  return wcLineItems.map((item, index) => ({
    id: item.id || index,
    name: item.name || 'Unknown Item',
    quantity: parseInt(item.quantity) || 1,
    price: parseFloat(item.price) || 0,
    subtotal: parseFloat(item.subtotal) || 0,
    total: parseFloat(item.total) || 0,
    tax: parseFloat(item.total_tax) || 0,
    sku: item.sku || '',
  }))
}

/**
 * Convert WooCommerce order to InvoiceData
 */
export function formatOrderToInvoice(order: any, paymentDetails?: any): InvoiceData {
  const currencySymbol = getCurrencySymbol(order.currency || 'AED')

  return {
    metadata: {
      invoiceNumber: `INV-${order.id}`,
      invoiceDate: formatDate(order.date_created || new Date().toISOString()),
      orderNumber: order.number || order.id,
      paymentMethod: order.payment_method_title || 'Stripe',
      transactionId: paymentDetails?.id || order.transaction_id || '',
    },
    company: {
      name: 'White Mantis',
      logo: '/logo.png',
      address: 'Your Company Address',
      city: 'Dubai',
      state: 'Dubai',
      postcode: '00000',
      country: 'UAE',
      email: 'info@whitemantis.com',
      phone: '+971-XXX-XXXX',
      website: 'www.whitemantis.com',
      taxId: 'TRN: XXXXXXXXX',
    },
    billTo: formatAddress(order.billing),
    shipTo: order.shipping ? formatAddress(order.shipping) : undefined,
    lineItems: formatLineItems(order.line_items || []),
    subtotal:
      parseFloat(order.total) - parseFloat(order.total_tax) - parseFloat(order.shipping_total),
    tax: parseFloat(order.total_tax) || 0,
    taxLabel: order.tax_lines?.[0]?.label || 'VAT',
    shipping: parseFloat(order.shipping_total) || 0,
    shippingMethod: order.shipping_lines?.[0]?.method_title || '',
    discount: parseFloat(order.discount_total) || 0,
    discountLabel: order.coupon_lines?.[0]?.code || '',
    total: parseFloat(order.total) || 0,
    currency: order.currency || 'AED',
    currencySymbol,
    notes: order.customer_note || '',
    terms: 'Thank you for your business!',
  }
}

/**
 * Convert WooCommerce subscription to InvoiceData
 */
export function formatSubscriptionToInvoice(
  subscription: any,
  stripeSubscription?: any,
  latestInvoice?: any,
): InvoiceData {
  const currencySymbol = getCurrencySymbol(subscription.currency || 'AED')

  // Use latest invoice data if available from Stripe
  const invoiceDate = latestInvoice?.created
    ? new Date(latestInvoice.created * 1000).toISOString()
    : subscription.date_created

  return {
    metadata: {
      invoiceNumber: latestInvoice?.number || `INV-SUB-${subscription.id}`,
      invoiceDate: formatDate(invoiceDate),
      subscriptionNumber: subscription.id,
      paymentMethod: subscription.payment_method_title || 'Stripe',
      transactionId: latestInvoice?.payment_intent || stripeSubscription?.latest_invoice || '',
    },
    company: {
      name: 'White Mantis',
      logo: '/logo.png',
      address: 'Your Company Address',
      city: 'Dubai',
      state: 'Dubai',
      postcode: '00000',
      country: 'UAE',
      email: 'info@whitemantis.com',
      phone: '+971-XXX-XXXX',
      website: 'www.whitemantis.com',
      taxId: 'TRN: XXXXXXXXX',
    },
    billTo: formatAddress(subscription.billing),
    shipTo: subscription.shipping ? formatAddress(subscription.shipping) : undefined,
    lineItems: formatLineItems(subscription.line_items || []),
    subtotal:
      parseFloat(subscription.total) -
      parseFloat(subscription.total_tax) -
      parseFloat(subscription.shipping_total || 0),
    tax: parseFloat(subscription.total_tax) || 0,
    taxLabel: subscription.tax_lines?.[0]?.label || 'VAT',
    shipping: parseFloat(subscription.shipping_total) || 0,
    shippingMethod: subscription.shipping_lines?.[0]?.method_title || '',
    discount: parseFloat(subscription.discount_total) || 0,
    discountLabel: subscription.coupon_lines?.[0]?.code || '',
    total: parseFloat(subscription.total) || 0,
    currency: subscription.currency || 'AED',
    currencySymbol,
    notes: subscription.customer_note || '',
    terms: 'This is a recurring subscription. Thank you for your business!',
  }
}
/**
 * Format Payload address to InvoiceAddress
 */
export function formatPayloadAddress(address: any, email?: string): InvoiceAddress {
  if (!address) {
    return {
      first_name: 'N/A',
      last_name: '',
      address_1: 'N/A',
      city: 'N/A',
      state: 'N/A',
      postcode: 'N/A',
      country: 'N/A',
      email: email || '',
    }
  }
  return {
    first_name: address.addressFirstName || '',
    last_name: address.addressLastName || '',
    address_1: address.addressLine1 || '',
    address_2: address.addressLine2 || '',
    city: address.city || '',
    state: address.emirates || address.state || '',
    postcode: address.postcode || '00000',
    country: address.addressCountry || 'United Arab Emirates',
    email: email || address.email || '',
    phone: address.phoneNumber
      ? address.phoneNumber.startsWith('+')
        ? address.phoneNumber
        : '+971 ' + address.phoneNumber.replace(/^0/, '')
      : '',
  }
}

/**
 * Format Payload line items to InvoiceLineItem
 */
export function formatPayloadLineItems(items: any[]): InvoiceLineItem[] {
  return items.map((item, index) => {
    const product = item.product || {}
    const price = parseFloat(item.price) || 0
    const quantity = parseInt(item.quantity) || 1
    const total = price * quantity

    let rawWeight =
      item.variantName || (typeof item.customizations === 'string' ? item.customizations : '') || ''
    if (rawWeight && !rawWeight.toLowerCase().endsWith('g')) {
      rawWeight += 'g'
    }

    return {
      id: item.id || index,
      name: item.productName || product.name || product.productTitle || 'Product',
      quantity: quantity,
      price: price,
      subtotal: total,
      total: total,
      tax: 0, // Tax is often handled at the order level in Payload
      sku: product.sku || '',
      weight: rawWeight,
      frequency: item.frequencyName || '',
    }
  })
}

/**
 * Convert Payload order to InvoiceData
 */
export function formatPayloadOrderToInvoice(order: any, paymentDetails?: any): InvoiceData {
  const currencySymbol = 'AED' // Default for White Mantis

  return {
    metadata: {
      invoiceNumber: order.invoiceId || `INV-ORD-${order.id}`,
      invoiceDate: formatDate(order.invoiceDate || order.createdAt || new Date().toISOString()),
      orderNumber: order.id,
      paymentMethod: order.paymentMethod || 'Credit Card',
      transactionId: order.stripeData?.chargeId || order.stripeOrderId || '',
    },
    company: {
      name: 'White Mantis',
      logo: '/logo.png',
      address: 'Shop 12, Al Wasl Road, Jumeirah 1',
      city: 'Dubai',
      state: 'Dubai',
      postcode: 'UAE — P.O. Box 73401',
      country: 'UAE',
      email: 'billing@whitemantis.ae',
      phone: '+971 4 000 0000',
      website: 'www.whitemantis.ae',
      taxId: 'TRN: 100123456700003',
    },
    billTo: formatPayloadAddress(
      order.billingAddress || order.shippingAddress,
      order.email || order.user?.email,
    ),
    shipTo: order.shippingAddress
      ? formatPayloadAddress(order.shippingAddress, order.email || order.user?.email)
      : undefined,
    lineItems: formatPayloadLineItems(order.items || []),
    subtotal: parseFloat(order.financials?.subtotal || 0),
    tax: parseFloat(order.financials?.taxAmount || 0),
    taxLabel: 'VAT tax',
    shipping: parseFloat(order.financials?.shippingCharge || 0),
    shippingMethod: order.deliveryOption || '',
    discount:
      parseFloat(order.financials?.couponDiscount || 0) +
      parseFloat(order.financials?.wtCoinsDiscount || 0),
    couponDiscount: parseFloat(order.financials?.couponDiscount || 0),
    beansDiscount: parseFloat(order.financials?.wtCoinsDiscount || 0),
    discountLabel: 'Discounts',
    total: parseFloat(order.financials?.total || 0),
    currency: 'AED',
    currencySymbol,
    notes: '',
    terms: 'White Mantis Coffee LLC — Dubai, UAE\nTerms & Condition',
    type: 'order',
  }
}

/**
 * Convert Payload subscription to InvoiceData
 */
export function formatPayloadSubscriptionToInvoice(subscription: any): InvoiceData {
  const currencySymbol = 'AED'

  return {
    metadata: {
      invoiceNumber: `INV-SUB-${subscription.id}`,
      invoiceDate: formatDate(subscription.createdAt || new Date().toISOString()),
      subscriptionNumber: subscription.id,
      paymentMethod: 'Credit Card',
      transactionId: subscription.stripeSubscriptionId || '',
    },
    company: {
      name: 'White Mantis',
      logo: '/logo.png',
      address: 'Dubai Coffee Roastery',
      city: 'Dubai',
      state: 'Dubai',
      postcode: '00000',
      country: 'UAE',
      email: 'info@whitemantis.ae',
      phone: '+971-XXX-XXXX',
      website: 'www.whitemantis.ae',
      taxId: 'TRN: XXXXXXXXX',
    },
    billTo: formatPayloadAddress(
      subscription.billingAddress || subscription.shippingAddress,
      subscription.email || subscription.user?.email,
    ),
    shipTo: subscription.shippingAddress
      ? formatPayloadAddress(
          subscription.shippingAddress,
          subscription.email || subscription.user?.email,
        )
      : undefined,
    lineItems: formatPayloadLineItems(subscription.items || []),
    subtotal: parseFloat(subscription.financials?.subtotal || 0),
    tax: parseFloat(subscription.financials?.taxAmount || 0),
    taxLabel: 'VAT (5%)',
    shipping: parseFloat(subscription.financials?.shippingCharge || 0),
    shippingMethod: subscription.deliveryOption || '',
    discount:
      parseFloat(subscription.financials?.couponDiscount || 0) +
      parseFloat(subscription.financials?.wtCoinsDiscount || 0),
    discountLabel: 'Discounts',
    total: parseFloat(subscription.financials?.total || 0),
    currency: 'AED',
    currencySymbol,
    notes: '',
    terms: 'This is a recurring subscription receipt from White Mantis.',
  }
}

/**
 * Convert Payload AppOrder to InvoiceData
 */
export function formatAppOrderToInvoice(order: any): InvoiceData {
  const currencySymbol = 'AED'

  // App orders use first name / last name from the user if available
  const user = typeof order.user === 'object' ? order.user : null
  const firstName = user?.firstName || 'Guest'
  const lastName = user?.lastName || ''
  const email = order.email || user?.email || ''

  return {
    metadata: {
      invoiceNumber: order.invoiceId || `INV-APP-${order.id}`,
      invoiceDate: formatDate(order.invoiceDate || order.createdAt || new Date().toISOString()),
      orderNumber: order.id,
      paymentMethod: order.paymentMethod || 'Credit Card',
      transactionId: order.stripeData?.chargeId || order.stripeOrderId || '',
    },
    company: {
      name: 'White Mantis',
      logo: '/logo.png',
      address: 'Shop 12, Al Wasl Road, Jumeirah 1',
      city: 'Dubai',
      state: 'Dubai',
      postcode: 'UAE — P.O. Box 73401',
      country: 'UAE',
      email: 'billing@whitemantis.ae',
      phone: '+971 4 000 0000',
      website: 'www.whitemantis.ae',
      taxId: 'TRN: 100123456700003',
    },
    billTo: {
      first_name: firstName,
      last_name: lastName,
      address_1: 'In-Store / Takeaway',
      city: 'Dubai',
      state: 'Dubai',
      postcode: '00000',
      country: 'United Arab Emirates',
      email: email,
    },
    lineItems: formatPayloadLineItems(order.items || []),
    subtotal: parseFloat(order.financials?.subtotal || 0),
    tax: parseFloat(order.financials?.taxAmount || 0),
    taxLabel: 'VAT',
    shipping: 0,
    discount:
      parseFloat(order.financials?.couponDiscount || 0) +
      parseFloat(order.financials?.wtCoinsDiscount || 0),
    couponDiscount: parseFloat(order.financials?.couponDiscount || 0),
    beansDiscount: parseFloat(order.financials?.wtCoinsDiscount || 0),
    discountLabel: 'Discounts',
    total: parseFloat(order.financials?.total || 0),
    currency: 'AED',
    currencySymbol,
    notes: order.specialInstructions || '',
    terms: 'White Mantis Coffee LLC — Dubai, UAE',
    type: order.orderType === 'take-away' ? 'takeAway' : 'dineIn',
  }
}
