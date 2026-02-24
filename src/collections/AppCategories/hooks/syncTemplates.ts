import { CollectionAfterChangeHook } from 'payload'

/**
 * Propagates structural and price changes from CustomizationTemplate to all referencing Menu and ShopMenu entries.
 */
export const syncTemplates: CollectionAfterChangeHook = async ({
    doc, // The updated template
    operation,
    req: { payload },
}) => {
    // Only run on updates to prevent recursion during initial creation or other unrelated events
    if (operation !== 'update') return

    const templateId = doc.id
    const templateTitle = doc.title
    const templateSections = doc.sections || []

    const syncCustomization = (existingCustomization: any) => {
        const existingSections = existingCustomization.sections || []

        const newSections = templateSections.map((tSection: any) => {
            const eSection = existingSections.find((es: any) => es.title === tSection.title)

            // Sync Groups
            const tGroups = tSection.groups || []
            const newGroups = tGroups.map((tGroup: any) => {
                const eGroup = eSection?.groups?.find((eg: any) => eg.groupTitle === tGroup.groupTitle)

                // Sync Options in Group
                const tOptionsInGroup = tGroup.options || []
                const newOptionsInGroup = tOptionsInGroup.map((tOpt: any) => {
                    const eOpt = eGroup?.options?.find((eo: any) => eo.label === tOpt.label)
                    return {
                        ...tOpt,
                        id: eOpt?.id || tOpt.id, // Preserve ID if matching for UI stability
                        price: tOpt.price || 0, // Overwrite with template price
                    }
                })

                return {
                    ...tGroup,
                    options: newOptionsInGroup,
                }
            })

            // Sync Direct Options (used if no groups)
            const tOptionsDirect = tSection.options || []
            const newOptionsDirect = tOptionsDirect.map((tOpt: any) => {
                const eOpt = eSection?.options?.find((eo: any) => eo.label === tOpt.label)
                return {
                    ...tOpt,
                    id: eOpt?.id || tOpt.id,
                    price: tOpt.price || 0,
                }
            })

            return {
                ...tSection, // Includes selectionType, title, etc.
                groups: newGroups,
                options: newOptionsDirect,
            }
        })

        return {
            ...existingCustomization,
            title: templateTitle, // Update title if template name changed
            sections: newSections,
        }
    }

    try {
        // 1. Update Menu collection
        const menus = await payload.find({
            collection: 'menu',
            where: {
                'customizations.template': {
                    equals: templateId,
                },
            },
            limit: 0, // Get all
        })

        for (const menu of menus.docs) {
            const updatedCustomizations = (menu.customizations || []).map((c: any) => {
                if (c.template === templateId || c.template?.id === templateId) {
                    return syncCustomization(c)
                }
                return c
            })

            await payload.update({
                collection: 'menu',
                id: menu.id,
                data: {
                    customizations: updatedCustomizations,
                },
                // Use autosave or trigger hooks? Default is fine. 
                // We might want to disable hooks if we don't want cascading effects.
            })
        }

        // 2. Update ShopMenu collection
        const shopMenus = await payload.find({
            collection: 'shop-menu',
            where: {
                'customizations.template': {
                    equals: templateId,
                },
            },
            limit: 0,
        })

        for (const shopMenu of shopMenus.docs) {
            const updatedCustomizations = (shopMenu.customizations || []).map((c: any) => {
                if (c.template === templateId || c.template?.id === templateId) {
                    return syncCustomization(c)
                }
                return c
            })

            await payload.update({
                collection: 'shop-menu',
                id: shopMenu.id,
                data: {
                    customizations: updatedCustomizations,
                },
            })
        }
    } catch (error) {
        console.error('Error syncing templates:', error)
    }
}
