import type { GlobalConfig } from "payload";

export const StampRewardProducts: GlobalConfig = {
    slug: "stamp-reward-products",
    admin: {
        group: 'Loyalty Program',
        description: 'Set the stamp reward products for the loyalty program.',
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