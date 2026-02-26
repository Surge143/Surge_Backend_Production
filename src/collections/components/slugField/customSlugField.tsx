'use client'
import React, { useEffect } from 'react'
import { TextInput, FieldLabel, useField, useFormFields } from '@payloadcms/ui'

const SlugField: React.FC<{ path: string; label: string; required?: boolean }> = ({
    path,
    label,
    required
}) => {
    const { value, setValue } = useField<string>({ path })
    const nameValue = useFormFields(([fields]) => fields.name?.value as string)
    const taglineValue = useFormFields(([fields]) => fields.tagline?.value as string)

    useEffect(() => {
        const base = `${nameValue || ''} ${taglineValue || ''}`.trim()
        if (base) {
            const generatedSlug = base
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '')

            if (value !== generatedSlug) {
                setValue(generatedSlug)
            }
        }
    }, [nameValue, taglineValue, value, setValue])

    return (
        <div className="field-type text">
            <FieldLabel
                label={label || 'Slug'}
                path={path}
                required={required}
            />
            <TextInput
                path={path}
                value={value || ''}
                readOnly={true}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
            />
        </div>
    )
}

export { SlugField }