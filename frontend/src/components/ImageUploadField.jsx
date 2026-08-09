import { useRef, useState } from 'react'
import { getMediaThumbUrl, getMediaUrl, uploadMedia } from '../services/mediaApi'

function ImageUploadField({ label, value, thumbValue, onChange }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setUploading(true)
    setError(null)

    try {
      const media = await uploadMedia(file)
      onChange({
        url: getMediaUrl(media.url_path),
        thumbUrl: getMediaThumbUrl(media) || null,
      })
    } catch (err) {
      setError(err.message || 'Unable to upload image.')
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  function handleUrlChange(event) {
    // Manual URL paste — no generated thumbnail available.
    onChange({
      url: event.target.value,
      thumbUrl: null,
    })
  }

  const previewSrc = thumbValue || value

  return (
    <div className="image-upload-field">
      <label>
        {label}
        <input
          type="url"
          value={value}
          onChange={handleUrlChange}
          placeholder="https://... or upload below"
        />
      </label>

      <div className="image-upload-actions">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          disabled={uploading}
        />
        {uploading && <span>Uploading...</span>}
      </div>

      {error && <p className="admin-alert admin-alert-error">{error}</p>}

      {previewSrc && (
        <img
          className="image-upload-preview"
          src={previewSrc}
          alt="Selected preview"
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  )
}

export default ImageUploadField
