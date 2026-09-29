import { createContext } from 'react'

// On the server, SeoHead writes the page's tags here so they can be put
// into the HTML <head>. In the browser this context is empty.
export const HeadContext = createContext(null)

export function buildHead(
  settings,
  { title, description, path = '/', image, type = 'website' } = {},
) {
  const siteName = settings?.site_name || 'BlogSite'
  const siteUrl = (settings?.public_site_url || 'http://localhost:5173').replace(
    /\/$/,
    '',
  )
  const pageTitle = title
    ? `${title} — ${siteName}`
    : settings?.default_seo_title || siteName
  const pageDescription = description || settings?.default_seo_description || ''
  const canonical = `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
  const shareImage = image || settings?.default_share_image || ''

  return {
    title: pageTitle,
    canonical,
    meta: [
      ['name', 'description', pageDescription],
      [
        'name',
        'google-site-verification',
        settings?.google_search_console_verification || '',
      ],
      ['property', 'og:site_name', siteName],
      ['property', 'og:type', type],
      ['property', 'og:title', title || siteName],
      ['property', 'og:description', pageDescription],
      ['property', 'og:url', canonical],
      ['property', 'og:image', shareImage],
      ['name', 'twitter:card', shareImage ? 'summary_large_image' : 'summary'],
      ['name', 'twitter:title', title || siteName],
      ['name', 'twitter:description', pageDescription],
      ['name', 'twitter:image', shareImage],
    ],
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function renderHeadTags(head) {
  const tags = [`<title>${escapeHtml(head.title)}</title>`]
  head.meta.forEach(([attr, key, content]) => {
    if (content) {
      tags.push(`<meta ${attr}="${key}" content="${escapeHtml(content)}" />`)
    }
  })
  tags.push(`<link rel="canonical" href="${escapeHtml(head.canonical)}" />`)
  return tags.join('\n    ')
}
