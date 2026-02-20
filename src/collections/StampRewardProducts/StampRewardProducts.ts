import type { GlobalConfig } from "payload";

export const StampRewardProducts: GlobalConfig = {
    slug: "stamp-reward-products",
    admin: {

    },
    access: {
        read: () => true,
        update: () => true,
    },
    fields: [
        {
            name: 'stampProducts',
            type: 'relationship',
            relationTo: 'shop-menu',
            hasMany: true,
            required: true,
        },
    ],
}