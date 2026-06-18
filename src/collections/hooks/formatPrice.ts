import { FieldHook, Validate } from 'payload'

export const formatPriceHook: FieldHook = ({ value }) => {
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return `${value}.00`
    }
    return value.toString()
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const trimmed = value.trim()
    const num = Number(trimmed)

    if (!isNaN(num) && !trimmed.includes('.')) {
      return `${trimmed}.00`
    }
  }

  return value
}

export const priceValidator: Validate = (val) => {
  if (val === undefined || val === null || val === '') return true

  const num = Number(val)
  if (!isNaN(num)) {
    if (num < 0) {
      return 'Price cannot be negative'
    }
  }

  return true
}
