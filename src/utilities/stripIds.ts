export function stripIds(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => stripIds(item))
  }

  if (obj !== null && typeof obj === 'object') {
    const newObj: any = {}
    for (const key in obj) {
      if (key === 'id' || key === '_id') continue
      newObj[key] = stripIds(obj[key])
    }
    return newObj
  }

  return obj
}
