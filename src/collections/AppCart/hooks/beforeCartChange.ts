import { CollectionBeforeChangeHook } from 'payload';

const getInfo = (item: any) => {
    const p = item.product;
    if (typeof p !== 'object' || !p) return { relationTo: null, productId: p };

    const relationTo = p.relationTo || null;
    const val = p.value;
    const productId = typeof val === 'object' ? val.id : val;
    return { relationTo, productId };
};

export const beforeCartChange: CollectionBeforeChangeHook = async ({
    data,
    req,
    originalDoc,
    operation,
}) => {
    const { payload, user } = req;

    // 0. AUTO-DISCOVER RELATIONTO if missing
    if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
            // eslint-disable-next-line prefer-const
            let { relationTo, productId } = getInfo(item);

            if (!relationTo && productId) {
                // Discovery logic
                // 1. Try shop-menu
                const shopDoc = await payload.findByID({
                    collection: 'shop-menu',
                    id: productId,
                    depth: 0,
                    disableErrors: true,
                }).catch(() => null);

                if (shopDoc) {
                    relationTo = 'shop-menu';
                } else {
                    // 2. Try web-products
                    const webDoc = await payload.findByID({
                        collection: 'web-products',
                        id: productId,
                        depth: 0,
                        disableErrors: true,
                    }).catch(() => null);

                    if (webDoc) {
                        relationTo = 'web-products';
                    }
                }

                // If found, update the item structure to polymorphic
                if (relationTo) {
                    item.product = {
                        relationTo,
                        value: productId,
                    };
                }
            }
        }
    }

    // 1. Automatically set owner if creating
    if (operation === 'create' && !data.user && user) {
        data.user = user.id;
    }

    // 2. Exclusivity & Integrity Logic
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
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

        // 2.1 Set Origin based on items
        const finalRelations = new Set(data.items.map((item: any) => getInfo(item).relationTo));
        if (finalRelations.has('web-products')) {
            data.origin = 'store';
        } else if (finalRelations.has('shop-menu')) {
            data.origin = 'cafe';
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
                if (currentShopId && String(currentShopId) !== String(targetShopId)) {
                    // WIPE: Keep only items belonging to the new shop
                    // First, we need to fetch all incoming shop items to check their shops
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const itemsWithShops = await Promise.all(shopItems.map(async (item: any) => {
                        const { productId } = getInfo(item);
                        const doc = await payload.findByID({ collection: 'shop-menu', id: productId, depth: 0 });
                        return { item, shop: doc?.shop };
                    }));

                    data.items = itemsWithShops
                        .filter(pkg => String(pkg.shop) === String(targetShopId))
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
        const itemMap = new Map<string, { id?: string | number; product: any; vId?: string; quantity: number; customizations: any; productHighlights?: any }>();

        for (const item of data.items) {
            const { relationTo, productId } = getInfo(item);

            // Use stable stringification for customizations to include in the key
          const custKey

            if (itemMap.has(key)) {
                const existing = itemMap.get(key)!;
                existing.quantity += (item.quantity || 1);
            } else {
                itemMap.set(key, {
                    id: item.id, // Preserve the original ID if it exists
                    product: item.product,
                    vId: item.vId,
                    quantity: item.quantity || 1,
                    customizations: item.customizations,
                    productHighlights: item.productHighlights,
                });
            }
        }

        data.items = Array.from(itemMap.values()).map(val => ({
            id: val.id,
            product: val.product,
            vId: val.vId,
            quantity: val.quantity,
            customizations: val.customizations,
            productHighlights: val.productHighlights,
        }));
    }

    // 4. Integrity Validation (Shop Consistency & Customization Snapshotting)
    if (data.items && Array.isArray(data.items)) {
        const shopId = data.shop || (originalDoc?.shop ? (typeof originalDoc.shop === 'object' ? originalDoc.shop.id : originalDoc.shop) : null);

        for (const item of data.items) {
            const { relationTo, productId } = getInfo(item);
            if (!relationTo || !productId) continue;

            // --- 4.1 CASE: CAFE ITEMS ---
            if (relationTo === 'shop-menu') {
                const shopMenuItem = await payload.findByID({
                    collection: 'shop-menu',
                    id: productId,
                    depth: 0,
                    disableErrors: true,
                }).catch(() => null);

                if (!shopMenuItem) continue;

                // Shop consistency check — normalize both sides to string to avoid number/string type mismatch
                const itemShopId = typeof shopMenuItem.shop === 'object' && shopMenuItem.shop !== null
                    ? String(shopMenuItem.shop.id)
                    : String(shopMenuItem.shop ?? '');
                const cartShopId = String(shopId ?? '');
                if (cartShopId && itemShopId && itemShopId !== cartShopId) {
                    throw new Error(`Item ${shopMenuItem.name} does not belong to the selected shop.`);
                }

                // Customization Snapshotting
                if (item.customizations && Array.isArray(item.customizations)) {
                    const incomingSelections = item.customizations;
                    const snapshot: Array<{ sectionTitle: string, label: string, price: number }> = [];
                    const availableOptions = new Map<string, number>();

                    if (shopMenuItem?.customizations && Array.isArray(shopMenuItem.customizations)) {
                        shopMenuItem.customizations.forEach((panel: any) => {
                            if (panel.sections && Array.isArray(panel.sections)) {
                                panel.sections.forEach((section: any) => {
                                    const sectionTitle = section.title;
                                    if (section.options && Array.isArray(section.options)) {
                                        section.options.forEach((opt: any) => {
                                            availableOptions.set(`${sectionTitle}:${opt.label}`, opt.price || 0);
                                        });
                                    }
                                });
                            }
                        });
                    }

                    for (const sel of incomingSelections) {
                        if (sel.sectionTitle && sel.label && typeof sel.price === 'number') {
                            snapshot.push({ sectionTitle: sel.sectionTitle, label: sel.label, price: sel.price });
                            continue;
                        }
                        if (sel.sectionTitle && sel.label) {
                            const key = `${sel.sectionTitle}:${sel.label}`;
                            if (availableOptions.has(key)) {
                                snapshot.push({ sectionTitle: sel.sectionTitle, label: sel.label, price: availableOptions.get(key)! });
                            }
                        }
                    }

                    item.customizations = snapshot.sort((a, b) =>
                        `${a.sectionTitle}:${a.label}`.localeCompare(`${b.sectionTitle}:${b.label}`)
                    );
                } else {
                    item.customizations = [];
                }
            }
        }
    }

    return data;
};


