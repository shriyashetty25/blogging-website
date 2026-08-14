import { request } from './api'

function toQueryString(params = {}) {
  const search = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  })

  const query = search.toString()
  return query ? `?${query}` : ''
}

export function getBlogs(params = {}) {
  return request(`/api/blogs${toQueryString(params)}`)
}

export function getPublishedBlogs(params = {}) {
  return getBlogs({ status: 'PUBLISHED', ...params })
}

export function getPopularBlogs(limit = 5) {
  return request(`/api/blogs/popular?limit=${limit}`)
}

export function getBlog(id) {
  return request(`/api/blogs/${id}`)
}

export function getBlogBySlug(slug) {
  return request(`/api/blogs/by-slug/${slug}`)
}

export function createBlog(payload) {
  return request('/api/blogs', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateBlog(id, payload) {
  return request(`/api/blogs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteBlog(id) {
  return request(`/api/blogs/${id}`, {
    method: 'DELETE',
  })
}
