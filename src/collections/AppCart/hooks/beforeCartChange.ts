import { CollectionBeforeChangeHook } from 'payload';

const getInfo = (item: any) => {
    const p = item.product;
    if (typeof p !== 'object' || !p) return { relationTo: 'shop-menu', productId: p };

    const relationTo = p.relationTo || 'shop-menu';
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
        const itemMap = new Map<string, { id?: string | number; product: any; quantity: number; customizations: any }>();

        for (const item of data.items) {
            const { relationTo, productId } = getInfo(item);

            // Use stable stringification for customizations to include in the key
            const custKey = item.customizations ? JSON.stringify(item.customizations) : '{}';
            const key = `${relationTo}:${productId}:${custKey}`;

            if (itemMap.has(key)) {
                const existing = itemMap.get(key)!;
                existing.quantity += (item.quantity || 1);
            } else {
                itemMap.set(key, {
                    id: item.id, // Preserve the original ID if it exists
                    product: item.product,
                    quantity: item.quantity || 1,
                    customizations: item.customizations,
                });
            }
        }

        data.items = Array.from(itemMap.values()).map(val => ({
            id: val.id,
            product: val.product,
            quantity: val.quantity,
            customizations: val.customizations,
        }));
    }

    // 4. Final Shop Validation (Ensuring no stray items from other shops remain)
    if (data.shop && data.items && data.items.length > 0) {
        const shopId = typeof data.shop === 'object' ? data.shop.id : data.shop;

        for (const item of data.items) {
            const { relationTo, productId } = getInfo(item);

            if (relationTo === 'shop-menu') {
                const shopMenuItem = await payload.findByID({
                    collection: 'shop-menu',
                    id: productId,
                    depth: 0,
                });

                if (shopMenuItem && shopMenuItem.shop !== shopId) {
                    throw new Error(`Item ${shopMenuItem.name} does not belong to the selected shop.`);
                }

                // --- BASE PRICE SNAPSHOTTING ---
                // If price is not set (e.g. new item from frontend), snapshot it from the menu
                if (typeof item.price !== 'number' && shopMenuItem) {
                    item.price = shopMenuItem.salePrice || shopMenuItem.regularPrice || 0;
                }

                // --- CUSTOMIZATION SNAPSHOTTING ---
                if (item.customizations && Array.isArray(item.customizations)) {
                    const incomingSelections = item.customizations;
                    const snapshot: Array<{ sectionTitle: string, label: string, price: number }> = [];

                    // 1. Build a lookup map of available options from the product data
                    // Map key: "sectionTitle:label" -> price
                    const availableOptions = new Map<string, number>();

                    if (shopMenuItem?.customizations && Array.isArray(shopMenuItem.customizations)) {
                        shopMenuItem.customizations.forEach((panel: any) => {
                            if (panel.sections && Array.isArray(panel.sections)) {
                                panel.sections.forEach((section: any) => {
                                    const sectionTitle = section.title;

                                    // Direct options
                                    if (section.options && Array.isArray(section.options)) {
                                        section.options.forEach((opt: any) => {
                                            availableOptions.set(`${sectionTitle}:${opt.label}`, opt.price || 0);
                                        });
                                    }

                                    // Grouped options
                                    if (section.groups && Array.isArray(section.groups)) {
                                        section.groups.forEach((group: any) => {
                                            if (group.options && Array.isArray(group.options)) {
                                                group.options.forEach((opt: any) => {
                                                    // Use the group title + label or just label depending on how the frontend sends it
                                                    // CustomizationsManager uses `${group.groupTitle} - ${opt.label}`
                                                    const fullLabel = `${group.groupTitle} - ${opt.label}`;
                                                    availableOptions.set(`${sectionTitle}:${fullLabel}`, opt.price || 0);
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }

                    // 2. Resolve selections into snapshot
                    for (const sel of incomingSelections) {
                        // If it's already a full snapshot (has price), preserve it
                        if (sel.sectionTitle && sel.label && typeof sel.price === 'number') {
                            snapshot.push({
                                sectionTitle: sel.sectionTitle,
                                label: sel.label,
                                price: sel.price
                            });
                            continue;
                        }

                        // If it's a new selection from frontend (might only have sectionTitle and label)
                        if (sel.sectionTitle && sel.label) {
                            const key = `${sel.sectionTitle}:${sel.label}`;
                            if (availableOptions.has(key)) {
                                snapshot.push({
                                    sectionTitle: sel.sectionTitle,
                                    label: sel.label,
                                    price: availableOptions.get(key)!
                                });
                            } else {
                                console.warn(`Customization not found in product: ${key}`);
                            }
                        }
                    }

                    // Sort for stable consolidation key
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


