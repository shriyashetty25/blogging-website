import { request } from './api'

const DEDUPE_MS = 8000
const STORAGE_PREFIX = 'blog_view:'

function viewKey(path, blog_id) {
  return `${STORAGE_PREFIX}${path}|${blog_id || ''}`
}

function wasJustRecorded(key) {
  try {
    const lastSent = Number(sessionStorage.getItem(key) || 0)
    return Boolean(lastSent && Date.now() - lastSent < DEDUPE_MS)
  } catch {
    return false
  }
}

function markRecorded(key) {
  try {
    sessionStorage.setItem(key, String(Date.now()))
  } catch {
    // Ignore private-mode storage failures.
  }
}

export function getAnalyticsOverview() {
  return request('/api/analytics/overview')
}

export function getDashboardOverview() {
  return request('/api/analytics/dashboard')
}

export function recordView({ path, blog_id }) {
  const key = viewKey(path, blog_id)
  if (wasJustRecorded(key)) {
    return Promise.resolve(null)
  }
  markRecorded(key)

  return request('/api/analytics/views', {
    method: 'POST',
    body: JSON.stringify({
      path,
      blog_id: blog_id || null,
    }),
  }).catch(() => null)
}
