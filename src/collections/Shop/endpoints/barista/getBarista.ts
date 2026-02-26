import { PayloadHandler } from "payload";

export const getBaristaHandler: PayloadHandler = async (req) => {
    const { payload, user } = req
    const { shopId } = (req.routeParams || {}) as any

    // 1. Verify Authentication
    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!shopId) {
        return Response.json({ error: 'Shop ID is required' }, { status: 400 })
    }

    try {
        // 2. Verify Shop exists
        const shop = await payload.findByID({
            collection: 'shop',
            id: shopId,
        }).catch(() => null)

        if (!shop) {
            return Response.json({ error: 'Shop not found' }, { status: 404 })
        }

        // 3. Find baristas associated with this shop
        // In Admins collection, baristas have a 'shop' relationship field
        const baristas = await payload.find({
            collection: 'admins',
            where: {
                and: [
                    {
                        role: {
                            equals: 'barista',
                        },
                    },
                    {
                        shop: {
                            equals: shopId,
                        },
                    },
                ],
            },
            depth: 1, // To populate profile image if needed
        })

        // 4. Map and return relevant info
        const baristasData = baristas.docs.map(barista => ({
            id: barista.id,
            name: barista.name,
            speciality: barista.speciality,
            profileImage: barista.profileImage,
        }))

        return Response.json({
            success: true,
            baristas: baristasData,
        }, { status: 200 })

    } catch (error: any) {
        console.error('Error fetching baristas:', error)
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
}
