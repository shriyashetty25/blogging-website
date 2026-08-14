import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'

function GoogleAnalytics() {
  const { settings } = useSettings()
  const location = useLocation()
  const measurementId = (settings?.google_analytics_id || '').trim()
  const loadedId = useRef('')

  useEffect(() => {
    if (!measurementId || loadedId.current === measurementId) {
      return
    }

    if (!document.getElementById('ga-src')) {
      const script = document.createElement('script')
      script.id = 'ga-src'
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
        measurementId,
      )}`
      document.head.appendChild(script)
    }

    window.dataLayer = window.dataLayer || []
    window.gtag =
      window.gtag ||
      function gtag() {
        window.dataLayer.push(arguments)
      }
    window.gtag('js', new Date())
    window.gtag('config', measurementId)
    loadedId.current = measurementId
  }, [measurementId])

  useEffect(() => {
    if (!measurementId || typeof window.gtag !== 'function') {
      return
    }
    window.gtag('config', measurementId, {
      page_path: location.pathname + location.search,
    })
  }, [measurementId, location.pathname, location.search])

  return null
}

export default GoogleAnalytics
