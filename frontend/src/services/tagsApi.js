import { request } from './api'

export function getTags() {
  return request('/api/tags')
}

export function createTag(payload) {
  return request('/api/tags', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateTag(id, payload) {
  return request(`/api/tags/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteTag(id) {
  return request(`/api/tags/${id}`, {
    method: 'DELETE',
  })
}
