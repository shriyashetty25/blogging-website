export function toIdMap(items) {
  const map = {}
  items.forEach((item) => {
    map[item.id] = item
  })
  return map
}
