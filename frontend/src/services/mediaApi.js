import { API_URL, request, uploadRequest } from './api'

export function getMediaUrl(urlPath) {
  if (!urlPath) {
    return ''
  }
  if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
    return urlPath
  }
  return `${API_URL}${urlPath}`
}

/** Prefer thumbnail for grids/lists; fall back to original. */
export function getMediaThumbUrl(media) {
  if (!media) {
    return ''
  }
  return getMediaUrl(media.thumb_url_path || media.url_path)
}

export function getMedia() {
  return request('/api/media')
}

export function uploadMedia(file) {
  const formData = new FormData()
  formData.append('file', file)
  return uploadRequest('/api/media/upload', {
    method: 'POST',
    body: formData,
  })
}

export function deleteMedia(id) {
  return request(`/api/media/${id}`, {
    method: 'DELETE',
  })
}
