import { request } from './api'

export function getCategories() {
  return request('/api/categories')
}

export function createCategory(payload) {
  return request('/api/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateCategory(id, payload) {
  return request(`/api/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteCategory(id) {
  return request(`/api/categories/${id}`, {
    method: 'DELETE',
  })
}
