export function tagsToInputValue(tags) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return ''
  }
  return tags.map((tag) => tag.name).join(', ')
}

export function inputValueToTagNames(value) {
  if (!value || !value.trim()) {
    return []
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}
