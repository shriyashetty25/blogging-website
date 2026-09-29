import { useMemo } from 'react'
import { generateHTML } from '@tiptap/html'
import { createRenderExtensions } from '../../editor/extensions'
import { parseStoredContent } from '../../editor/content'
import './BlogEditor.css'

const renderExtensions = createRenderExtensions()

function toHtml(value) {
  try {
    return generateHTML(parseStoredContent(value), renderExtensions)
  } catch {
    return ''
  }
}

function BlogContent({ value }) {
  const html = useMemo(() => (value ? toHtml(value) : ''), [value])

  if (!html) {
    return <p className="page-intro">No content yet.</p>
  }

  return <div className="blog-content" dangerouslySetInnerHTML={{ __html: html }} />
}

export default BlogContent
