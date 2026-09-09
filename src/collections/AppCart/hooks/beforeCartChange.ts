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
        const itemMap = new Map<string, { id?: string | number; product: any; vId?: string; quantity: number; customizations: any; productHighlights?: any }>();

        for (const item of data.items) {
            const { relationTo, productId } = getInfo(item);

            const custKey = item.customizations ? JSON.stringify(item.customizations) : '{}';
            const vIdKey = item.vId || '';
            const hlKey = Array.isArray(item.productHighlights) && item.productHighlights.length > 0
                ? [...item.productHighlights]
                    .map((h: any) => `${h.sectionTitle ?? ''}:${Array.isArray(h.items) && h.items[0] ? h.items[0].point ?? '' : ''}`)
                    .sort()
                    .join('|')
                : '';
            const key = `${relationTo}:${productId}:${vIdKey}:${custKey}:${hlKey}`;

            if (itemMap.has(key)) {
                const existing = itemMap.get(key)!;
                existing.quantity += (item.quantity || 1);
            } else {
                itemMap.set(key, {
                    id: item.id,
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
                //
                // Round 1 bug: this used to key/match on `sel.sectionTitle` +
                // `sel.label`, which the app never sends — always failed,
                // silently dropping every customization.
                //
                // Round 2 bug: fixed the matching, but rewrote the *saved
                // shape* to {sectionTitle, label, price} — a shape nothing
                // else in the app actually reads. Everywhere else
                // (apiCafeOrders.ts, the order-results screen, this same
                // reference pattern in the other Surge app) expects the
                // original {sectionId, selectedOptionId, selectedOptionLabel,
                // price} shape buildPricedPayload() (CafeMain.tsx) sends —
                // so the previous fix still ended up invisible everywhere it
                // was actually displayed.
                //
                // Fixed properly now: preserve the original field names, and
                // try matching by the option's own id first, falling back to
                // matching by label text (mirrors how the option lookup
                // already degrades on the frontend). If a selection still
                // can't be matched against the current menu definition at
                // all, keep the client's label so nothing silently
                // disappears, but zero out its price — the actual charged
                // price only ever comes from a verified menu option, never
                // from whatever the client sent.
                if (item.customizations && Array.isArray(item.customizations)) {
                    const incomingSelections = item.customizations;
                    const snapshot: Array<{ sectionId: string, sectionTitle: string, selectedOptionId: string, selectedOptionLabel: string, price: number }> = [];
                    const byId = new Map<string, { sectionId: string, sectionTitle: string, label: string, price: number }>();
                    const byLabel = new Map<string, { sectionId: string, sectionTitle: string, label: string, price: number }>();

                    if (shopMenuItem?.customizations && Array.isArray(shopMenuItem.customizations)) {
                        shopMenuItem.customizations.forEach((panel: any) => {
                            if (panel.sections && Array.isArray(panel.sections)) {
                                panel.sections.forEach((section: any) => {
                                    const sectionId = String(section.id ?? section.title ?? "");
                                    const sectionTitle = String(section.title ?? "");
                                    const addOption = (opt: any) => {
                                        if (!opt?.label) return;
                                        const meta = { sectionId, sectionTitle, label: String(opt.label), price: opt.price || 0 };
                                        if (opt.id != null) byId.set(String(opt.id), meta);
                                        byLabel.set(String(opt.label).trim().toLowerCase(), meta);
                                    };
                                    if (section.groups && Array.isArray(section.groups)) {
                                        section.groups.forEach((group: any) => {
                                            if (group.options && Array.isArray(group.options)) {
                                                group.options.forEach(addOption);
                                            }
                                        });
                                    }
                                    if (section.options && Array.isArray(section.options)) {
                                        section.options.forEach(addOption);
                                    }
                                });
                            }
                        });
                    }

                    for (const sel of incomingSelections) {
                        if (!sel) continue;
                        const selectedOptionId = String(sel.selectedOptionId ?? sel.optionId ?? "");
                        const selectedOptionLabel = String(sel.selectedOptionLabel ?? sel.label ?? "");

                        // Price is ALWAYS taken from the menu's own customization
                        // definition, never from whatever the client sends —
                        // previously a client-supplied numeric price (e.g. 0) was
                        // trusted outright, letting a paid add-on be added for free.
                        const meta =
                            (selectedOptionId && byId.get(selectedOptionId)) ||
                            (selectedOptionLabel && byLabel.get(selectedOptionLabel.trim().toLowerCase())) ||
                            null;

                        if (!selectedOptionId && !selectedOptionLabel) continue;

                        snapshot.push({
                            sectionId: meta?.sectionId ?? String(sel.sectionId ?? ""),
                            sectionTitle: meta?.sectionTitle ?? String(sel.sectionTitle ?? ""),
                            selectedOptionId,
                            selectedOptionLabel: meta?.label ?? selectedOptionLabel,
                            price: meta?.price ?? 0,
                        });
                    }

                    item.customizations = snapshot;
                } else {
                    item.customizations = [];
                }
            }
        }
    }

    return data;
};


