import { CollectionBeforeChangeHook } from 'payload';

export const beforeWebCartChange: CollectionBeforeChangeHook = async ({
    data,
    req,
    operation,
}) => {
    const { user } = req;

    // 1. Automatically set user if creating
    if (operation === 'create' && !data.user && user) {
        data.user = user.id;
    }

    // 2. Consolidate items
    if (data.items && Array.isArray(data.items)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const itemMap = new Map<string, { product: any; quantity: number; vId?: string }>();

        for (const item of data.items) {
            const productId = typeof item.product === 'object' ? item.product.id : item.product;
            if (!productId) continue;

            const vId = item.vId || '';
            const key = `${productId}:${vId}`;

            if (itemMap.has(key)) {
                const existing = itemMap.get(key)!;
                if (existing.quantity + (item.quantity || 1) > 5) {
                    throw new Error(`Maximum quantity of 5 units allowed for this item.`);
                }
                existing.quantity += (item.quantity || 1);
            } else {
                if ((item.quantity || 1) > 5) {
                    throw new Error(`Maximum quantity of 5 units allowed for this item.`);
                }
                itemMap.set(key, {
                    product: productId,
                    quantity: item.quantity || 1,
                    vId: item.vId,
                });
            }
        }

        const consolidatedItems = Array.from(itemMap.values());

        // 3. Stock validation
        for (const item of consolidatedItems) {
            const productDoc = await req.payload.findByID({
                collection: 'web-products',
                id: item.product,
                depth: 0,
            });

            if (productDoc) {
                if (item.vId) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const variant = ((productDoc as any).variants as any[])?.find((v: any) => v.id === item.vId);
                    if (variant) {
                        if (!variant.variantInStock) {
                            throw new Error(`${productDoc.name} (${variant.variantName}) is out of stock.`);
                        }
                        if (typeof variant.variantStockQuantity === 'number' && variant.variantStockQuantity < item.quantity) {
                            throw new Error(`Only ${variant.variantStockQuantity} units of ${productDoc.name} (${variant.variantName}) are available.`);
                        }
                    } else {
                        throw new Error(`Variant ${item.vId} not found for product ${productDoc.name}.`);
                    }
                } else {
                    if (!productDoc.inStock) {
                        throw new Error(`${productDoc.name} is out of stock.`);
                    }
                    if (typeof productDoc.stockQuantity === 'number' && productDoc.stockQuantity < item.quantity) {
                        throw new Error(`Only ${productDoc.stockQuantity} units of ${productDoc.name} are available.`);
                    }
                }
            }
        }

        data.items = consolidatedItems;
    }

    return data;
};
