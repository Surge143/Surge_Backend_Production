import { CollectionAfterChangeHook } from 'payload'

/**
 * Propagates structural and price changes from CustomizationTemplate to all referencing Menu and ShopMenu entries.
 * Loop prevention: this hook lives on 'customization-template'. The downstream payload.update calls on
 * 'menu' and 'shop-menu' will NOT re-trigger this hook — no infinite loop possible.
 */
export const syncTemplates: CollectionAfterChangeHook = async ({
    doc,
    operation,
    req,
}) => {
    const { payload } = req;

    // Only run on updates — prevents firing on initial template creation.
    if (operation !== 'update') return

    const templateId = doc.id
    const templateTitle = doc.title
    const templateSections: any[] = doc.sections || []

    /**
     * Merges template sections into an existing customization panel entry,
     * preserving existing Payload array IDs for UI stability.
     */
    const syncCustomization = (existingCustomization: any) => {
        const existingSections: any[] = existingCustomization.sections || []

        const newSections = templateSections.map((tSection: any) => {
            const eSection = existingSections.find((es: any) => es.title === tSection.title)

            // --- Sync Groups ---
            const tGroups: any[] = tSection.groups || []
            const newGroups = tGroups.map((tGroup: any) => {
                const eGroup = eSection?.groups?.find((eg: any) => eg.groupTitle === tGroup.groupTitle)

                const newOptionsInGroup = (tGroup.options || []).map((tOpt: any) => {
                    const eOpt = eGroup?.options?.find((eo: any) => eo.label === tOpt.label)
                    return {
                        ...tOpt,
                        id: eOpt?.id,
                        price: tOpt.price ?? 0,
                    }
                })

                return {
                    ...tGroup,
                    id: eGroup?.id,
                    options: newOptionsInGroup,
                }
            })

            // --- Sync Flat Options (used when no groups) ---
            const newOptionsDirect = (tSection.options || []).map((tOpt: any) => {
                const eOpt = eSection?.options?.find((eo: any) => eo.label === tOpt.label)
                return {
                    ...tOpt,
                    id: eOpt?.id,
                    price: tOpt.price ?? 0,
                }
            })

            return {
                ...tSection,
                id: eSection?.id,
                groups: newGroups,
                options: newOptionsDirect,
            }
        })

        return {
            ...existingCustomization,
            title: templateTitle,
            sections: newSections,
        }
    }

    try {
        // --- 1. Update Menu collection ---
        const menus = await payload.find({
            collection: 'menu',
            where: { 'customizations.template': { equals: templateId } },
            depth: 0,
            req,
            overrideAccess: true,
            limit: 0,
        })

        if (menus.docs.length > 0) {
            await Promise.all(menus.docs.map(async (menu) => {
                const updatedCustomizations = (menu.customizations || []).map((c: any) => {
                    const cId = typeof c.template === 'object' ? c.template.id : c.template;
                    return cId === templateId ? syncCustomization(c) : c
                })

                await payload.update({
                    collection: 'menu',
                    id: menu.id,
                    data: { customizations: updatedCustomizations },
                    // This context flag tells Menu.afterChange to also propagate
                    // customizations to linked ShopMenu items (completing the full chain).
                    context: { fromTemplateSync: true },
                    req,
                    depth: 0,
                    overrideAccess: true,
                })
            }));
        }

        // --- 2. Update ShopMenu collection (only standalone items not linked to a Menu) ---
        // Items linked via menuRelation are already handled above through Menu's afterChange cascade.
        // menuRelation is hasMany:true so it defaults to [] — Payload's exists/null operators don't
        // match an empty array, so we fetch all and filter client-side instead.
        const shopMenus = await payload.find({
            collection: 'shop-menu',
            where: { 'customizations.template': { equals: templateId } },
            depth: 0,
            req,
            overrideAccess: true,
            limit: 0,
        })

        const standaloneShopMenus = shopMenus.docs.filter(
            (sm: any) => !Array.isArray(sm.menuRelation) || sm.menuRelation.length === 0
        )

        if (standaloneShopMenus.length > 0) {
            await Promise.all(standaloneShopMenus.map(async (shopMenu: any) => {
                const updatedCustomizations = (shopMenu.customizations || []).map((c: any) => {
                    const cId = typeof c.template === 'object' ? c.template.id : c.template
                    return cId === templateId ? syncCustomization(c) : c
                })

                await payload.update({
                    collection: 'shop-menu',
                    id: shopMenu.id,
                    data: { customizations: updatedCustomizations },
                    req,
                    depth: 0,
                    overrideAccess: true,
                })
            }))
        }
    } catch (error) {
        console.error('Error syncing templates:', error)
    }
}
