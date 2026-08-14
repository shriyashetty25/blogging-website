import { request } from './api'

export function getSettings() {
  return request('/api/settings')
}

export function updateSettings(payload) {
  return request('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
