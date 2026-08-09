// Shared API base URL for the FastAPI backend.
export const API_URL = 'http://localhost:8000'

export async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

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

  if (!response.ok) {
    const message =
      (data && data.detail) || 'Something went wrong. Please try again.'
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
  }

  return data
}
