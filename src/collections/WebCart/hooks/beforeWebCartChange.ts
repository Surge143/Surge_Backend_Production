import { CollectionBeforeChangeHook } from 'payload'

export const beforeWebCartChange: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  const { user } = req

  // 1. Automatically set user if creating
  if (operation === 'create' && !data.user && user) {
    data.user = user.id
  }

  // 2. Consolidate items
  if (data.items && Array.isArray(data.items)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemMap = new Map<string, { product: any; quantity: number; vId?: string; productHighlights?: any[] }>()

    for (const item of data.items) {
      const productId = typeof item.product === 'object' ? item.product.id : item.product
      if (!productId) continue

      const vId = item.vId || ''
      const highlightsKey = item.productHighlights ? JSON.stringify(item.productHighlights) : ''
      const key = `${productId}:${vId}:${highlightsKey}`

      if (itemMap.has(key)) {
        const existing = itemMap.get(key)!
        if (existing.quantity + (item.quantity || 1) > 10) {
          throw new Error(`Maximum quantity of 10 units allowed for this item.`)
        }
        existing.quantity += item.quantity || 1
      } else {
        if ((item.quantity || 1) > 10) {
          throw new Error(`Maximum quantity of 10 units allowed for this item.`)
        }
        itemMap.set(key, {
          product: productId,
          quantity: item.quantity || 1,
          vId: item.vId,
          productHighlights: item.productHighlights || [],
        })
      }
    }

    const consolidatedItems = Array.from(itemMap.values())

    // 3. Stock Validation
    for (const item of consolidatedItems) {
      const productDoc: any = await req.payload.findByID({
        collection: 'web-products',
        id: item.product,
        depth: 0,
      })

      if (productDoc) {
        const hasVariants = Boolean(productDoc.hasVariantOptions)

        if (hasVariants) {
          // If product has variants, vId is mandatory
          if (!item.vId) {
            throw new Error(`Please select a variant for ${productDoc.name}.`)
          }

          const variant = productDoc.variants?.find((v: any) => v.id === item.vId)

          if (!variant) {
            throw new Error(`Variant selection for ${productDoc.name} is no longer available.`)
          }

          // Validate variant stock
          if (!variant.variantInStock) {
            throw new Error(`${productDoc.name} (${variant.variantName}) is out of stock.`)
          }

          if (
            typeof variant.variantStockQuantity === 'number' &&
            variant.variantStockQuantity < item.quantity
          ) {
            throw new Error(`Only ${variant.variantStockQuantity} units are available.`)
          }
        } else {
          // No variants - validate base product stock
          if (!productDoc.inStock) {
            throw new Error(`${productDoc.name} is out of stock.`)
          }

          if (
            typeof productDoc.stockQuantity === 'number' &&
            productDoc.stockQuantity < item.quantity
          ) {
            throw new Error(
              `Only ${productDoc.stockQuantity} units are available.`,
            )
          }
        }
      }
    }

    data.items = consolidatedItems
  }

  return data
}
