import { request } from './api'

export function login(email, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function getMe() {
  return request('/api/auth/me')
}

export function logoutRequest() {
  return request('/api/auth/logout', {
    method: 'POST',
  })
}
