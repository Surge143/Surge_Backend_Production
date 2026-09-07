// Shared helper for displaying a WebProducts variant name (invoices, order emails,
// the shop-manager dashboard).
//
// Coffee variants store a plain number of grams (e.g. "250") and have always relied
// on the caller appending "g". Merchandise variants store a free-form label instead
// (e.g. "M", "White - L", "500ml") which must NOT get "g" appended.
//
// Rather than threading `productType` through every call site, we derive it from the
// value itself: a variant name that is purely numeric is a weight in grams and gets
// "g" appended; anything else (letters, units already included, combined names) is
// shown exactly as the admin typed it. This preserves the existing display for every
// coffee product unchanged, while doing the right thing for merchandise.
export function withUnit(variantName?: string | null): string {
  if (!variantName) return ''
  const trimmed = String(variantName).trim()
  if (!trimmed) return ''
  return /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}g` : trimmed
}
