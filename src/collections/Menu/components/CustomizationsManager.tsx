'use client'

import {
    Button,
    CheckboxInput,
    FieldLabel,
    ReactSelect,
    TextInput,
    useField,
    useForm
} from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

// --- Types ---
interface Option {
    id?: string
    label: string
    price: number
    enabled: boolean
}

interface Section {
    id?: string
    title: string
    selectionType: 'single' | 'multiple'
    options: Option[]
}

interface Customization {
    id?: string
    template: string | { id: string }
    sections: Section[]
}

const generateId = () => Math.random().toString(36).substring(2, 9)

export const CustomizationsManager: React.FC<{ path: string; label: string }> = ({ path, label }) => {
    const { value, showError, errorMessage, setValue } = useField<Customization[]>({ path })
    const { dispatchFields } = useForm()

    const [templates, setTemplates] = useState<{ label: string; value: string }[]>([])
    const [loadingTemplates, setLoadingTemplates] = useState(false)
    const [panelLoading, setPanelLoading] = useState<Record<number, boolean>>({})

    // Local state to manage the UI before pushing to useField
    const customizations = value || []

    // Fetch templates on mount
    useEffect(() => {
        const fetchTemplates = async () => {
            setLoadingTemplates(true)
            try {
                const response = await fetch('/api/customization-template?limit=100')
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
                const data = await response.json()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setTemplates(data.docs.map((t: any) => ({ label: t.title, value: t.id })))
            } catch (err) {
                console.error('Failed to fetch templates:', err)
            } finally {
                setLoadingTemplates(false)
            }
        }
        fetchTemplates()
    }, [])

    const handleTemplateChange = async (panelIdx: number, templateId: string) => {
        if (!templateId) return

        setPanelLoading(prev => ({ ...prev, [panelIdx]: true }))
        try {
            const res = await fetch(`/api/customization-template/${templateId}`)
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
            const template = await res.json()

            const newCustomizations = [...customizations]
            newCustomizations[panelIdx] = {
                ...newCustomizations[panelIdx],
                template: templateId,
                sections: template.sections.map((s: any) => {
                    // Combine direct options and options from groups
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const directOptions = (s.options || []).map((o: any) => ({
                        id: generateId(),
                        label: o.label,
                        price: o.price || 0,
                        enabled: true
                    }))

                    const groupedOptions = (s.groups || []).flatMap((g: any) =>
                        (g.options || []).map((o: any) => ({
                            id: generateId(),
                            label: `${g.groupTitle} - ${o.label}`,
                            price: o.price || 0,
                            enabled: true
                        }))
                    )

                    return {
                        id: generateId(),
                        title: s.title,
                        selectionType: s.selectionType,
                        options: [...directOptions, ...groupedOptions]
                    }
                })
            }
            setValue(newCustomizations)
        } catch (err) {
            console.error('Error fetching template details:', err)
        } finally {
            setPanelLoading(prev => ({ ...prev, [panelIdx]: false }))
        }
    }

    const addPanel = () => {
        setValue([...customizations, { id: generateId(), template: '', sections: [] }])
    }

    const removePanel = (idx: number) => {
        const newItems = [...customizations]
        newItems.splice(idx, 1)
        setValue(newItems)
    }

    const updateOption = (pIdx: number, sIdx: number, oIdx: number, updates: Partial<Option>) => {
        const newCustoms = [...customizations]
        newCustoms[pIdx].sections[sIdx].options[oIdx] = {
            ...newCustoms[pIdx].sections[sIdx].options[oIdx],
            ...updates
        }
        setValue(newCustoms)
    }

    return (
        <div className="field-type customizations-manager" style={{ marginBottom: '2rem' }}>
            <FieldLabel label={label} />

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                padding: '1.25rem',
                border: '1px solid var(--theme-elevation-150)',
                borderRadius: 'var(--style-radius-m)',
            }}>

                {customizations.length === 0 && (
                    <p style={{ margin: '0', opacity: 0.6, fontSize: '0.9rem' }}>
                        No customizations added yet. Click the button below to start.
                    </p>
                )}

                {customizations.map((panel, pIdx) => (
                    <div
                        key={panel.id || pIdx}
                        style={{
                            padding: '1.5rem',
                            borderRadius: 'var(--style-radius-s)',
                            position: 'relative'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ margin: 0, fontSize: '1rem' }}>Panel {pIdx + 1}</h4>
                            <Button buttonStyle="secondary" size="small" onClick={() => removePanel(pIdx)}>
                                Remove Panel
                            </Button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', opacity: 0.7 }}>
                                Source Template
                            </label>
                            <ReactSelect
                                options={templates}
                                value={templates.find(t => t.value === (typeof panel.template === 'string' ? panel.template : (panel.template as any)?.id))}
                                onChange={(opt: any) => handleTemplateChange(pIdx, opt?.value || '')}
                                disabled={loadingTemplates || panelLoading[pIdx]}
                            />
                        </div>

                        {/* Sections Mapping */}
                        {panel.sections?.map((section, sIdx) => (
                            <div key={section.id || sIdx} style={{ marginTop: '1.5rem', borderTop: '1px solid var(--theme-elevation-250)', paddingTop: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <strong style={{ fontSize: '0.9rem' }}>{section.title}</strong>
                                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', backgroundColor: 'var(--theme-elevation-200)', borderRadius: '4px' }}>
                                        {section.selectionType === 'single' ? 'Single' : 'Multiple'}
                                    </span>
                                </div>

                                {/* Options Table-like Header */}
                                <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 120px', gap: '1rem', marginBottom: '0.5rem', opacity: 0.5, fontSize: '0.7rem', fontWeight: 'bold' }}>
                                    <span>USE</span>
                                    <span>LABEL</span>
                                    <span>PRICE ADD-ON</span>
                                </div>

                                {/* Options List */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {section.options.map((opt, oIdx) => (
                                        <div key={opt.id || oIdx} style={{
                                            display: 'grid',
                                            gridTemplateColumns: '40px 1fr 120px',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '0.4rem 0',
                                            borderBottom: '1px solid var(--theme-elevation-150)'
                                        }}>
                                            <CheckboxInput
                                                checked={opt.enabled}
                                                // Change the parameter to the event and extract 'checked'
                                                onToggle={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                    updateOption(pIdx, sIdx, oIdx, { enabled: e.target.checked })
                                                }
                                            />
                                            <span style={{ fontSize: '0.9rem' }}>{opt.label}</span>
                                            <TextInput
                                                path={`${path}.${pIdx}.sections.${sIdx}.options.${oIdx}.price`}
                                                value={String(opt.price)}
                                                onChange={(e: any) => updateOption(pIdx, sIdx, oIdx, { price: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}

                {customizations.length === 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                        <Button onClick={addPanel} buttonStyle="primary" icon="plus" size="small">
                            Add Customization Panel
                        </Button>
                    </div>
                )}
            </div>

            {showError && (
                <div style={{ color: 'var(--theme-error-500)', marginTop: '0.75rem', fontSize: '0.85rem', fontWeight: '500' }}>
                    {errorMessage}
                </div>
            )}
        </div>
    )
}