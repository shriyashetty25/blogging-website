import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { recordView } from '../services/analyticsApi'

function PageViewTracker() {
  const location = useLocation()

  useEffect(() => {
    const path = `${location.pathname}${location.search}`
    if (path.startsWith('/admin') || path.startsWith('/blog/')) {
      return
    }
    recordView({ path })
  }, [location.pathname, location.search])

  return null
}

export default PageViewTracker
