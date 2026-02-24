import type { CollectionBeforeDeleteHook } from 'payload'

export const beforeUserDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
    const { payload } = req

    // List of collections where the user has a required/unique relationship
    // these must be deleted BEFORE the user is deleted to avoid constraint violations.
    const collectionsToClean = [
        'web-cart',
        'app-cart',
        'wishlist',
        'user-wt-coins',
        'user-preferences',
    ]

    console.log(`🗑️ Starting cleanup for user ${id} across related collections...`)

    for (const slug of collectionsToClean) {
        try {
            const result = await payload.delete({
                collection: slug as any,
                where: {
                    user: {
                        equals: id,
                    },
                },
            })

            if (result.errors && result.errors.length > 0) {
                console.warn(`⚠️ Potential partial failure deleting ${slug} for user ${id}:`, result.errors)
            } else {
                console.log(`✅ Cleaned up ${slug} for user ${id}`)
            }
        } catch (error) {
            console.error(`❌ Failed to clean up ${slug} for user ${id}:`, error)
            // We log the error but allow the hook to continue so the user deletion isn't blocked 
            // by a non-existent related record or other minor issues.
        }
    }
}
