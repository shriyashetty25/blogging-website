const TOKEN_KEY = 'blog_admin_token'
const USER_KEY = 'blog_admin_user'

const isBrowser = typeof window !== 'undefined'

export function getToken() {
  return isBrowser ? localStorage.getItem(TOKEN_KEY) : null
}

export function getStoredUser() {
  const raw = isBrowser ? localStorage.getItem(USER_KEY) : null
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
