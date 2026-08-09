import { clearAuth, getToken } from '../utils/authStorage'

// Shared API base URL for the FastAPI backend.
export const API_URL = 'http://localhost:8000'

async function handleResponse(response) {
  // 204 No Content has no JSON body (used by DELETE).
  if (response.status === 204) {
    return null
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (response.status === 401) {
    clearAuth()
    if (
      window.location.pathname.startsWith('/admin') &&
      window.location.pathname !== '/admin/login'
    ) {
      window.location.assign('/admin/login')
    }
  }

  if (!response.ok) {
    const message =
      (data && data.detail) || 'Something went wrong. Please try again.'
    throw new Error(
      typeof message === 'string' ? message : JSON.stringify(message),
    )
  }

  return data
}

export async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  return handleResponse(response)
}

// For multipart uploads — do not set Content-Type manually.
export async function uploadRequest(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  }

  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  return handleResponse(response)
}
