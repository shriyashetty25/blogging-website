import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'
import { createEditorExtensions } from '../../editor/extensions'
import { parseStoredContent, serializeContent } from '../../editor/content'
import { getMediaUrl, uploadMedia } from '../../services/mediaApi'
import './BlogEditor.css'

function BlogEditor({ value, onChange }) {
  const imageInputRef = useRef(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const editor = useEditor({
    extensions: createEditorExtensions({
      placeholder:
        'Write your article. Use the toolbar for headings, lists, media, and more.',
    }),
    content: parseStoredContent(value),
    onUpdate: ({ editor: currentEditor }) => {
      onChange(serializeContent(currentEditor.getJSON()))
    },
  })

  useEffect(() => {
    if (!editor) {
      return
    }

    const nextDoc = parseStoredContent(value)
    const current = JSON.stringify(editor.getJSON())
    const next = JSON.stringify(nextDoc)

    if (current !== next) {
      editor.commands.setContent(nextDoc, false)
    }
  }, [editor, value])

  if (!editor) {
    return <p>Loading editor...</p>
  }

  function askUrl(message) {
    const url = window.prompt(message)
    if (!url) {
      return null
    }
    return url.trim()
  }

  function setLink() {
    const previous = editor.getAttributes('link').href || ''
    const url = window.prompt('Enter link URL (leave empty to remove)', previous)

    if (url === null) {
      return
    }

    const trimmed = url.trim()
    if (!trimmed) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run()
  }

  function addImageFromUrl() {
    const url = askUrl('Enter image URL (or cancel and use Upload Image)')
    if (!url) {
      return
    }
    editor.chain().focus().setImage({ src: url }).run()
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setUploadingImage(true)
    try {
      const media = await uploadMedia(file)
      editor.chain().focus().setImage({ src: getMediaUrl(media.url_path) }).run()
    } catch (err) {
      window.alert(err.message || 'Unable to upload image.')
    } finally {
      setUploadingImage(false)
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }
  }

  function addYoutube() {
    const url = askUrl('Enter YouTube URL')
    if (!url) {
      return
    }
    editor.commands.setYoutubeVideo({ src: url })
  }

  return (
    <div className="blog-editor">
      <div className="blog-editor-toolbar" role="toolbar" aria-label="Formatting">
        <button
          type="button"
          className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </button>
        <button
          type="button"
          className={editor.isActive('heading', { level: 3 }) ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </button>
        <button
          type="button"
          className={editor.isActive('bold') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          type="button"
          className={editor.isActive('italic') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
        <button
          type="button"
          className={editor.isActive('bulletList') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          List
        </button>
        <button
          type="button"
          className={editor.isActive('orderedList') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          Numbered
        </button>
        <button
          type="button"
          className={editor.isActive('blockquote') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          Quote
        </button>
        <button
          type="button"
          className={editor.isActive('link') ? 'active' : ''}
          onClick={setLink}
        >
          Link
        </button>
        <button type="button" onClick={addImageFromUrl}>
          Image URL
        </button>
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={uploadingImage}
        >
          {uploadingImage ? 'Uploading...' : 'Upload Image'}
        </button>
        <button type="button" onClick={addYoutube}>
          YouTube
        </button>
        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          Table
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          disabled={!editor.can().addColumnAfter()}
        >
          +Col
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().addRowAfter().run()}
          disabled={!editor.can().addRowAfter()}
        >
          +Row
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().deleteTable().run()}
          disabled={!editor.can().deleteTable()}
        >
          Del Table
        </button>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleImageUpload}
        hidden
      />

      <EditorContent editor={editor} className="blog-editor-content" />
    </div>
  )
}

export default BlogEditor
