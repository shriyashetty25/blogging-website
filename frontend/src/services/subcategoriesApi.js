import { request } from './api'

export function getSubcategories() {
  return request('/api/subcategories')
}

export function createSubcategory(payload) {
  return request('/api/subcategories', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateSubcategory(id, payload) {
  return request(`/api/subcategories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteSubcategory(id) {
  return request(`/api/subcategories/${id}`, {
    method: 'DELETE',
  })
}
