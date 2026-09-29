import { useContext, useEffect } from 'react'
import { useSettings } from '../context/SettingsContext'
import { HeadContext, buildHead } from '../seo/head'

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

function SeoHead({ title, description, path = '/', image, type = 'website' }) {
  const { settings } = useSettings()
  const head = buildHead(settings, { title, description, path, image, type })
  const collector = useContext(HeadContext)
  if (collector) {
    collector.head = head
  }

  const headKey = JSON.stringify(head)

  useEffect(() => {
    document.title = head.title
    head.meta.forEach(([attr, key, content]) => upsertMeta(attr, key, content))
    upsertCanonical(head.canonical)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headKey])

  return null
}

export default SeoHead
