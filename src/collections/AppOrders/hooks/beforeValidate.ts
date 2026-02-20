import { CollectionBeforeValidateHook } from 'payload';

export const beforeValidateHook: CollectionBeforeValidateHook = async ({ data, req: { payload } }) => {
    if (data?.items && Array.isArray(data.items) && data.shop) {
        const shopId = typeof data.shop === 'object' ? data.shop.id : data.shop;
        const itemIds = data.items.map((item: any) => {
            const product = item.product;
            if (typeof product === 'object' && product !== null) {
                return product.value || product.id;
            }
            return product;
        });

        const menuItems = await payload.find({
            collection: 'shop-menu',
            where: {
                id: { in: itemIds },
            },
            depth: 0,
        });

        const invalidItems = menuItems.docs.filter((item: any) => {
            const productShopId = typeof item.shop === 'object' ? item.shop.id : item.shop;
            return String(productShopId) !== String(shopId);
        });

        if (invalidItems.length > 0) {
            throw new Error(`All items in the order must belong to the selected shop. Invalid items found.`);
        }
    }
    return data;
};
