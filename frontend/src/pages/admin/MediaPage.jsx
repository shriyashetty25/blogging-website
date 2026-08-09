import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  deleteMedia,
  getMedia,
  getMediaThumbUrl,
  getMediaUrl,
  uploadMedia,
} from '../../services/mediaApi'
import './CategoriesPage.css'

function formatBytes(size) {
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function MediaPage() {
  const inputRef = useRef(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  async function loadMedia() {
    setLoading(true)
    setError(null)

    try {
      const data = await getMedia()
      setItems(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMedia()
  }, [])

  async function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setUploading(true)
    setError(null)
    setMessage(null)

    try {
      await uploadMedia(file)
      setMessage(`Uploaded "${file.name}".`)
      await loadMedia()
    } catch (err) {
      setError(err.message || 'Unable to upload image.')
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Delete image "${item.original_name}"? This cannot be undone.`,
    )
    if (!confirmed) {
      return
    }

    setError(null)
    setMessage(null)

    try {
      await deleteMedia(item.id)
      setMessage(`Deleted "${item.original_name}".`)
      await loadMedia()
    } catch (err) {
      setError(err.message || 'Unable to delete image.')
    }
  }

  async function copyUrl(item) {
    const url = getMediaUrl(item.url_path)
    try {
      await navigator.clipboard.writeText(url)
      setMessage('Image URL copied.')
    } catch {
      setError('Unable to copy URL. Copy it manually from the table.')
    }
  }

  return (
    <section className="page-shell categories-admin">
      <p className="page-kicker">Admin</p>
      <h1>Media</h1>
      <p className="page-intro">
        Upload images for featured images and blog content. Files are stored on
        the server disk, not in PostgreSQL.
      </p>

      <Link className="text-link admin-back" to="/admin">
        Back to admin
      </Link>

      {error && <p className="admin-alert admin-alert-error">{error}</p>}
      {message && <p className="admin-alert admin-alert-success">{message}</p>}

      <div className="admin-form">
        <h2>Upload image</h2>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleUpload}
          disabled={uploading}
        />
        <p className="admin-field-hint">
          JPEG, PNG, WebP, or GIF. Max 5 MB.
          {uploading ? ' Uploading...' : ''}
        </p>
      </div>

      <div className="admin-table-wrap">
        <h2>Uploaded images</h2>
        {loading && <p>Loading media...</p>}
        {!loading && items.length === 0 && (
          <p className="admin-empty">No images uploaded yet.</p>
        )}
        {!loading && items.length > 0 && (
          <div className="media-grid">
            {items.map((item) => (
              <article key={item.id} className="media-card">
                <img
                  src={getMediaThumbUrl(item)}
                  alt={item.original_name}
                  loading="lazy"
                  decoding="async"
                />
                <p>
                  <strong>{item.original_name}</strong>
                </p>
                <p className="admin-table-desc">
                  {formatBytes(item.size_bytes)} · {item.content_type}
                </p>
                <div className="admin-actions">
                  <button type="button" onClick={() => copyUrl(item)}>
                    Copy URL
                  </button>
                  <button
                    type="button"
                    className="button-danger"
                    onClick={() => handleDelete(item)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default MediaPage
