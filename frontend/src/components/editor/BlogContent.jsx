import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect } from 'react'
import { createEditorExtensions } from '../../editor/extensions'
import { parseStoredContent } from '../../editor/content'
import './BlogEditor.css'

function BlogContent({ value }) {
  const editor = useEditor({
    editable: false,
    extensions: createEditorExtensions(),
    content: parseStoredContent(value),
  })

  useEffect(() => {
    if (!editor) {
      return
    }
    editor.commands.setContent(parseStoredContent(value), false)
  }, [editor, value])

  if (!editor) {
    return null
  }

  if (!value) {
    return <p className="page-intro">No content yet.</p>
  }

  return (
    <div className="blog-content">
      <EditorContent editor={editor} />
    </div>
  )
}

export default BlogContent
