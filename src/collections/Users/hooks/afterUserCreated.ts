import { CollectionAfterChangeHook } from 'payload';

/**
 * Fires after a new user account is created.
 * Finds all guest orders (web-orders, app-orders, web-subscription) that share
 * the new user's email and back-fills the user relationship on each one.
 */
export const afterUserCreated: CollectionAfterChangeHook = async ({
    doc,
    operation,
    req: { payload },
}) => {
    if (operation !== 'create') return;

    const email: string = doc.email;
    if (!email) return;

    const userId = doc.id;

    console.log(`[afterUserCreated] New user (id=${userId}) registered with email: ${email}. Back-filling guest orders...`);

    const collections: Array<{ slug: string; hasCustomerType: boolean }> = [
        { slug: 'web-orders', hasCustomerType: true },
        { slug: 'app-orders', hasCustomerType: false },
        { slug: 'web-subscription', hasCustomerType: true },
    ];

    for (const { slug, hasCustomerType } of collections) {
        try {
            // Find all orders for this email that have no user linked yet
            const guestOrders = await payload.find({
                collection: slug as any,
                where: {
                    and: [
                        { email: { equals: email } },
                        { user: { exists: false } },
                    ],
                },
                limit: 100,
                depth: 0,
                overrideAccess: true,
                select: { id: true } as any,
            });

            for (const order of guestOrders.docs) {
                const updateData: any = { user: userId };
                if (hasCustomerType) {
                    updateData.customerType = 'user';
                }

                await payload.update({
                    collection: slug as any,
                    id: order.id,
                    data: updateData,
                    overrideAccess: true,
                    depth: 0,
                });

                console.log(`✅ [afterUserCreated] Linked ${slug} order ${order.id} to new user ${userId}`);
            }

            if (guestOrders.docs.length > 0) {
                console.log(`[afterUserCreated] Linked ${guestOrders.docs.length} ${slug} order(s) to user ${userId}`);
            }
        } catch (error) {
            console.error(`[afterUserCreated] Error linking ${slug} orders for user ${userId}:`, error);
        }
    }
};
