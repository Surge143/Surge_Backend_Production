export const normalizeHighlights = (highlights: any): string => {
  if (!highlights) return '[]'

  let highlightsArray = highlights
  if (typeof highlights === 'string') {
    try {
      highlightsArray = JSON.parse(highlights)
    } catch (e) {
      return highlights
    }
  }

  if (!Array.isArray(highlightsArray)) return '[]'

  const normalized = highlightsArray
    .map((section: any) => ({
      sectionTitle: section.sectionTitle || '',
      items: (Array.isArray(section.items) ? section.items : [])
        .map((item: any) => ({
          point: typeof item === 'string' ? item : (item.point || ''),
        }))
        .filter((item: any) => item.point)
        .sort((a: any, b: any) => a.point.localeCompare(b.point)),
    }))
    .filter((section: any) => section.sectionTitle || section.items.length > 0)
    .sort((a: any, b: any) => a.sectionTitle.localeCompare(b.sectionTitle))

  return JSON.stringify(normalized)
}
