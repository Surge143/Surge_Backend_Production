import { CollectionBeforeChangeHook } from 'payload';

export const beforeCartChange: CollectionBeforeChangeHook = async ({
    data,
    req,
    originalDoc,
    operation,
}) => {
    const { payload, user } = req;

    // 1. Automatically set owner if creating
    if (operation === 'create' && !data.user && user) {
        data.user = user.id;
    }

    // 2. Exclusivity & Integrity Logic
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        // Helper to get relationTo and productId from an item
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getInfo = (item: any) => {
            const product = item.product;
            const relationTo = typeof product === 'object' ? (product.relationTo || product.collection) : 'shop-menu';
            const productId = typeof product === 'object' ? (product.id || product.value) : product;
            return { relationTo, productId };
        };

        const incomingRelations = new Set(data.items.map(item => getInfo(item).relationTo));

        // -- TYPE EXCLUSIVITY (Website vs Shop) --
        if (operation === 'update' && originalDoc?.items?.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const existingRelations = new Set(originalDoc.items.map((item: any) => getInfo(item).relationTo));

            if (existingRelations.has('shop-menu') && incomingRelations.has('web-products')) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data.items = data.items.filter((item: any) => getInfo(item).relationTo === 'web-products');
                data.shop = null; // Clear shop if it's now a website-only cart
            } else if (existingRelations.has('web-products') && incomingRelations.has('shop-menu')) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data.items = data.items.filter((item: any) => getInfo(item).relationTo === 'shop-menu');
            }
        }

        // -- SHOP EXCLUSIVITY (Shop A vs Shop B) --
        // We only care if there are shop-menu items
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const shopItems = data.items.filter((item: any) => getInfo(item).relationTo === 'shop-menu');
        if (shopItems.length > 0) {
            // Get the shop of the "newest" item (last in array) to determine the winner
            const lastShopItem = shopItems[shopItems.length - 1];
            const { productId: lastShopItemId } = getInfo(lastShopItem);

            const lastItemDoc = await payload.findByID({
                collection: 'shop-menu',
                id: lastShopItemId,
                depth: 0,
            });

            const targetShopId = lastItemDoc?.shop;

            if (targetShopId) {
                const currentShopId = data.shop || (originalDoc?.shop ? (typeof originalDoc.shop === 'object' ? originalDoc.shop.id : originalDoc.shop) : null);

                // If the shop of the new item is different from the cart's current shop
                if (currentShopId && currentShopId !== targetShopId) {
                    // WIPE: Keep only items belonging to the new shop
                    // First, we need to fetch all incoming shop items to check their shops
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const itemsWithShops = await Promise.all(shopItems.map(async (item: any) => {
                        const { productId } = getInfo(item);
                        const doc = await payload.findByID({ collection: 'shop-menu', id: productId, depth: 0 });
                        return { item, shop: doc?.shop };
                    }));

                    data.items = itemsWithShops
                        .filter(pkg => pkg.shop === targetShopId)
                        .map(pkg => pkg.item);

                    data.shop = targetShopId;
                } else if (!data.shop) {
                    // If shop was not set, set it now
                    data.shop = targetShopId;
                }
            }
        }
    }

    // 3. Consolidate items
    if (data.items && Array.isArray(data.items)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const itemMap = new Map<string, { product: any; quantity: number }>();

        for (const item of data.items) {
            const product = item.product;
            const relationTo = typeof product === 'object' ? (product.relationTo || product.collection) : 'shop-menu';
            const productId = typeof product === 'object' ? (product.id || product.value) : product;

            const key = `${relationTo}:${productId}`;

            if (itemMap.has(key)) {
                const existing = itemMap.get(key)!;
                existing.quantity += (item.quantity || 1);
            } else {
                itemMap.set(key, {
                    product: item.product,
                    quantity: item.quantity || 1,
                });
            }
        }

        data.items = Array.from(itemMap.values()).map(val => ({
            product: val.product,
            quantity: val.quantity,
        }));
    }

    // 4. Final Shop Validation (Ensuring no stray items from other shops remain)
    if (data.shop && data.items && data.items.length > 0) {
        const shopId = typeof data.shop === 'object' ? data.shop.id : data.shop;

        for (const item of data.items) {
            const product = item.product;
            const relationTo = typeof product === 'object' ? (product.relationTo || product.collection) : 'shop-menu';
            const productId = typeof product === 'object' ? (product.id || product.value) : product;

            if (relationTo === 'shop-menu') {
                const shopMenuItem = await payload.findByID({
                    collection: 'shop-menu',
                    id: productId,
                    depth: 0,
                });

                if (shopMenuItem && shopMenuItem.shop !== shopId) {
                    throw new Error(`Item ${shopMenuItem.name} does not belong to the selected shop.`);
                }
            }
        }
    }

    return data;
};


