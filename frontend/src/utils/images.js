/**
 * If the image is one of our UUID uploads, derive the sibling WebP thumb path.
 * Example: /uploads/abc123.png → /uploads/abc123_thumb.webp
 */
export function deriveUploadThumbUrl(fullUrl) {
  if (!fullUrl) {
    return ''
  }

  const match = String(fullUrl).match(
    /^(.*\/uploads\/)([a-f0-9]+)(\.[a-zA-Z0-9]+)(\?.*)?$/i,
  )
  if (!match) {
    return ''
  }

  return `${match[1]}${match[2]}_thumb.webp${match[4] || ''}`
}

/**
 * Prefer a small thumbnail for list grids; fall back to the full image.
 */
export function getListImageSrc(fullUrl, thumbUrl, fallback = '') {
  return thumbUrl || deriveUploadThumbUrl(fullUrl) || fullUrl || fallback
}
