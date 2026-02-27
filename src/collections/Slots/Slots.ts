import type { CollectionConfig } from "payload";
import { APIError } from 'payload'

export const Slots: CollectionConfig = {
    slug: "slots",
    labels: {
        singular: "Slot",
        plural: "Slots",
    },
    admin: {
        defaultColumns: ["timeSelection", "slot", "isActive", "currentLoad", "maxCapacity", "shop"],
        group: "Cafe",
        useAsTitle: "slot",
        description:
            "Define time slots for customer order bookings. Control availability and capacity per slot.",
    },
    hooks: {
        beforeChange: [
            async ({ data, req, operation }) => {
                const { user, payload } = req;

                // 1. AUTO-ASSIGN SHOP AND MANAGER (Existing Logic)
                if (operation === "create" && user) {
                    data.shopManager = user.id;
                    const managedShop = await payload.find({
                        collection: "shop",
                        where: { shopManager: { equals: user.id } },
                        limit: 1,
                    });
                    if (managedShop.docs.length > 0) {
                        data.shop = managedShop.docs[0].id;
                    }
                }

                // 2. ENFORCE SINGLE "NOW" SLOT ACROSS COLLECTION
                if (data.timeSelection === "now") {
                    const existingNow = await payload.find({
                        collection: "slots",
                        where: {
                            and: [
                                { timeSelection: { equals: "now" } },
                                // If updating, don't count the current record itself
                                { id: { not_equals: data.id || '' } }
                            ]
                        },
                        limit: 1,
                    });

                    if (existingNow.totalDocs > 0) {
                        throw new APIError(
                            'A "Now" slot already exists. You must change the existing one to "Specific Time" before creating a new one.',
                            400 // Bad Request status code
                        );
                    }
                }

                return data;
            },
        ],
    },
    fields: [
        // ── Availability & Time Mode ──────────────────────────────────
        {
            type: "row",
            fields: [
                {
                    name: "isActive",
                    type: "checkbox",
                    label: "Accepting Bookings",
                    defaultValue: true,
                    admin: {
                        width: "50%",
                        style: { marginTop: "35px" },
                        description: "Uncheck to temporarily pause bookings for this slot.",
                    },
                },
                {
                    name: "timeSelection",
                    type: "radio",
                    label: "Slot Time Mode",
                    defaultValue: "now",
                    options: [
                        { label: "Set to Now", value: "now" },
                        { label: "Specific Time", value: "custom" },
                    ],
                    admin: {
                        width: "50%",
                        layout: "horizontal",
                        description:
                            '"Now" is auto-set to the current time on save. Only one slot collection-wide can use this mode.',
                    },
                },
            ],
        },

        // ── Custom Time Picker (conditional) ─────────────────────────
        {
            name: "slot",
            type: "date",
            label: "Slot Time",
            unique: true,
            admin: {
                date: {
                    pickerAppearance: "timeOnly",
                    displayFormat: "HH:mm",
                    timeIntervals: 30,
                },
                description: "Select a fixed time in 30-minute increments.",
                condition: (data) => data?.timeSelection === "custom",
            },
        },

        // ── Capacity ──────────────────────────────────────────────────
        {
            type: "collapsible",
            label: "Capacity Settings",
            admin: {
                initCollapsed: false,
                description: "Set the order limits for this slot.",
            },
            fields: [
                {
                    type: "row",
                    fields: [
                        {
                            name: "maxCapacity",
                            type: "number",
                            label: "Maximum Orders",
                            required: true,
                            defaultValue: 20,
                            admin: {
                                width: "50%",
                                description:
                                    "Total number of orders this slot can accept.",
                            },
                        },
                        {
                            name: "currentLoad",
                            type: "number",
                            label: "Current Orders",
                            defaultValue: 0,
                            admin: {
                                width: "50%",
                                readOnly: true,
                                description:
                                    "Live count of accepted orders. Updated automatically.",
                            },
                        },
                    ],
                },
            ],
        },

        // ── Sidebar: Auto-assigned Context ────────────────────────────
        {
            name: "shop",
            type: "relationship",
            relationTo: "shop",
            label: "Shop",
            admin: {
                position: "sidebar",
                description: "Auto-assigned based on your manager account.",
            },
        },
        {
            name: "shopManager",
            type: "relationship",
            relationTo: "admins",
            label: "Created By",
            admin: {
                position: "sidebar",
                readOnly: true,
                description: "The manager who created this slot.",
            },
        },
    ],
};