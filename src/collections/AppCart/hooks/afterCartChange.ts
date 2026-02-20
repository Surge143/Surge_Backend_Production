import type { CollectionAfterChangeHook } from 'payload';

export const afterCartChange: CollectionAfterChangeHook = async ({ doc, req }) => {
    const { payload } = req;

    // Resolve user ID — fallback to req.user if doc.user is missing (e.g. due to select clause)
    const userId: string | number | null =
        typeof doc.user === 'object' && doc.user !== null
            ? (doc.user as any).id
            : (doc.user ?? (req.user ? (req.user as any).id : null));

    if (!userId) {
        console.log('[afterCartChange] No user ID found in doc or req, skipping preference save.');
        return doc;
    }

    // Only process cafe (shop-menu) items — skip web-products
    const cafeItems: any[] = (doc.items || []).filter((item: any) => {
        const rel =
            typeof item.product === 'object' && item.product !== null
                ? item.product.relationTo
                : null;
        return rel === 'shop-menu';
    });

    console.log(`[afterCartChange] Found ${cafeItems.length} cafe items in cart for user ${userId}.`);

    if (cafeItems.length === 0) return doc;

    // Build the list of new preference entries from this cart save
    const newPrefs: Array<{ productId: string; customizations: any[]; savedAt: string }> = [];

    for (const item of cafeItems) {
        // Resolve the raw product ID from the polymorphic wrapper
        const productWrapper = item.product;
        let productId: string | null = null;

        if (typeof productWrapper === 'object' && productWrapper !== null) {
            const val = productWrapper.value;
            // If val is an object, it's the product document; get its ID. Otherwise, it's the ID string.
            productId = typeof val === 'object' && val !== null ? String(val.id) : String(val);
        } else if (productWrapper) {
            // Fallback for simple ID strings (though unlikely for polymorphic at depth 0)
            productId = String(productWrapper);
        }

        if (!productId) {
            console.log('[afterCartChange] Could not resolve productId for item:', item);
            continue;
        }

        // Only save if there are actual customizations
        const customizations: any[] = Array.isArray(item.customizations)
            ? item.customizations
            : [];

        newPrefs.push({
            productId,
            customizations,
            savedAt: new Date().toISOString(),
        });
    }

    if (newPrefs.length === 0) {
        console.log('[afterCartChange] No valid preference entries built, skipping.');
        return doc;
    }

    try {
        console.log(`[afterCartChange] Attempting to save ${newPrefs.length} preferences for user ${userId}...`);

        // Fetch existing preferences document for this user
        const existing = await (payload as any).find({
            collection: 'user-preferences',
            where: { user: { equals: userId } },
            limit: 1,
            overrideAccess: true,
        });

        const existingDoc = existing.docs[0];
        const existingPrefs: any[] = existingDoc?.cafeProductPreferences ?? [];

        // Merge: new entries override existing ones for the same productId
        const merged = [...existingPrefs];
        for (const pref of newPrefs) {
            const idx = merged.findIndex((p: any) => String(p.productId) === String(pref.productId));
            if (idx >= 0) {
                merged[idx] = pref;
            } else {
                merged.push(pref);
            }
        }

        if (existingDoc) {
            await (payload as any).update({
                collection: 'user-preferences',
                id: existingDoc.id,
                data: { cafeProductPreferences: merged },
                overrideAccess: true,
            });
            console.log(`[afterCartChange] Updated preferences for user ${userId}. Total preferences: ${merged.length}`);
        } else {
            await (payload as any).create({
                collection: 'user-preferences',
                data: {
                    user: userId,
                    cafeProductPreferences: merged,
                },
                overrideAccess: true,
            });
            console.log(`[afterCartChange] Created new preferences document for user ${userId}. Total preferences: ${merged.length}`);
        }
    } catch (err) {
        // Log but never throw — preferences are non-critical
        console.error('[afterCartChange] Failed to save user preferences:', err);
    }

    return doc;
};
