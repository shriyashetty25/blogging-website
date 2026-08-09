const EMPTY_DOC = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
}

export function getEmptyDoc() {
  return EMPTY_DOC
}

export function parseStoredContent(value) {
  if (!value || !String(value).trim()) {
    return getEmptyDoc()
  }

  const text = String(value)

  try {
    const parsed = JSON.parse(text)
    if (parsed && parsed.type === 'doc') {
      return parsed
    }
  } catch {
    // Older plain-text content falls through and becomes paragraphs.
  }

  const paragraphs = text.split(/\n+/).filter((line) => line.trim().length > 0)

  if (!paragraphs.length) {
    return getEmptyDoc()
  }

  return {
    type: 'doc',
    content: paragraphs.map((line) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: line }],
    })),
  }
}

export function serializeContent(doc) {
  if (!doc) {
    return null
  }

  return JSON.stringify(doc)
}

export function isContentEmpty(doc) {
  if (!doc || !Array.isArray(doc.content) || doc.content.length === 0) {
    return true
  }

  return doc.content.every((node) => {
    if (node.type === 'paragraph') {
      return !node.content || node.content.length === 0
    }
    return false
  })
}
