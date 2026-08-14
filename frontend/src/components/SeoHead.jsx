import { useEffect } from 'react'
import { useSettings } from '../context/SettingsContext'

function upsertMeta(attr, key, content) {
  const selector = `meta[${attr}="${key}"]`
  let element = document.head.querySelector(selector)
  if (!content) {
    if (element) {
      element.remove()
    }
    return
  }
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attr, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function upsertCanonical(href) {
  let element = document.head.querySelector('link[rel="canonical"]')
  if (!href) {
    if (element) {
      element.remove()
    }
    return
  }
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

function SeoHead({
  title,
  description,
  path = '/',
  image,
  type = 'website',
}) {
  const { settings } = useSettings()
  const siteName = settings?.site_name || 'BlogSite'
  const siteUrl = (settings?.public_site_url || 'http://localhost:5173').replace(
    /\/$/,
    '',
  )
  const pageTitle = title ? `${title} — ${siteName}` : siteName
  const pageDescription =
    description || settings?.default_seo_description || ''
  const canonical = `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
  const shareImage = image || settings?.default_share_image || ''

  useEffect(() => {
    document.title = pageTitle
    upsertMeta('name', 'description', pageDescription)
    upsertMeta(
      'name',
      'google-site-verification',
      settings?.google_search_console_verification || '',
    )
    upsertCanonical(canonical)
    upsertMeta('property', 'og:site_name', siteName)
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:title', title || siteName)
    upsertMeta('property', 'og:description', pageDescription)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:image', shareImage)
    upsertMeta('name', 'twitter:card', shareImage ? 'summary_large_image' : 'summary')
    upsertMeta('name', 'twitter:title', title || siteName)
    upsertMeta('name', 'twitter:description', pageDescription)
  }, [
    pageTitle,
    pageDescription,
    canonical,
    shareImage,
    siteName,
    title,
    type,
    settings?.google_search_console_verification,
  ])

  return null
}

export default SeoHead
