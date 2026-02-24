'use client'

import {
    Button,
    FieldLabel,
    ReactSelect,
    useField,
    useForm,
} from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

const generateId = () => Math.random().toString(36).substring(2, 9)

export const TemplateInjector: React.FC<{ path: string; label: string }> = ({ path, label }) => {
    const { value: customizations, setValue: setCustomizations } = useField<any[]>({ path: 'customizations' })
    const [templates, setTemplates] = useState<{ label: string; value: string }[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

    useEffect(() => {
        const fetchTemplates = async () => {
            setLoading(true)
            try {
                const response = await fetch('/api/customization-template?limit=100')
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
                const data = await response.json()
                setTemplates(data.docs.map((t: any) => ({ label: t.title, value: t.id })))
            } catch (err) {
                console.error('Failed to fetch templates:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchTemplates()
    }, [])

    const injectTemplate = async () => {
        if (!selectedTemplate) return

        setLoading(true)
        console.log('Injecting template:', selectedTemplate)
        try {
            const res = await fetch(`/api/customization-template/${selectedTemplate}`)
            if (!res.ok) {
                console.error(`Failed to fetch template detail. Status: ${res.status}`)
                throw new Error(`HTTP error! status: ${res.status}`)
            }
            const template = await res.json()
            console.log('Template data received:', template)

            // Prepare the new panel
            const newPanel = {
                id: generateId(),
                title: template.title, // Include title for RowLabel
                template: template.id,
                sections: template.sections.map((s: any) => ({
                    id: generateId(),
                    title: s.title,
                    selectionType: s.selectionType,
                    // Preserve groups if they exist
                    groups: (s.groups || []).map((g: any) => ({
                        id: generateId(),
                        groupTitle: g.groupTitle,
                        options: (g.options || []).map((o: any) => ({
                            id: generateId(),
                            label: o.label,
                            price: o.price || 0,
                        })),
                    })),
                    // Preserve direct options if they exist (only used if no groups)
                    options: (s.options || []).map((o: any) => ({
                        id: generateId(),
                        label: o.label,
                        price: o.price || 0,
                    })),
                })),
            }

            console.log('Generated new panel:', newPanel)

            // Force update by resetting first
            setCustomizations([])
            setTimeout(() => {
                setCustomizations([newPanel])
                console.log('Customizations updated')
            }, 50)

            setSelectedTemplate(null)
        } catch (err) {
            console.error('Error in injectTemplate:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="field-type" style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: 'var(--style-radius-m)' }}>
            <span style={{ fontSize: '15px', fontWeight: "bold", display: 'block', marginBottom: '8px' }}>
                <FieldLabel label="Select Customization Template" />
            </span>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                    <ReactSelect
                        options={templates}
                        value={templates.find(t => t.value === selectedTemplate)}
                        onChange={(opt: any) => setSelectedTemplate(opt?.value || null)}
                        disabled={loading}
                        placeholder={loading ? 'Loading templates...' : 'Choose a template to apply...'}
                    />
                </div>
                <Button
                    buttonStyle="primary"
                    onClick={injectTemplate}
                    disabled={!selectedTemplate || loading}
                    size="large"
                >
                    {loading ? 'Applying...' : 'Apply Template'}
                </Button>
            </div>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', opacity: 0.6 }}>
                Note: Selecting a template will replace any existing customizations for this product.
            </p>
        </div>
    )
}
