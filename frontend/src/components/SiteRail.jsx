import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { getPopularBlogs, getPublishedBlogs } from '../services/blogsApi'
import './SiteRail.css'

function currentSlug(pathname) {
  const match = pathname.match(/^\/blog\/([^/]+)/)
  return match ? match[1] : null
}

function RailList({ title, blogs }) {
  if (!blogs.length) {
    return null
  }

  return (
    <section className="site-rail-block">
      <h2>{title}</h2>
      <ol>
        {blogs.map((blog) => (
          <li key={blog.id}>
            <Link to={`/blog/${blog.slug}`}>{blog.title}</Link>
            {blog.author && <span>{blog.author}</span>}
          </li>
        ))}
      </ol>
    </section>
  )
}

function SiteRail() {
  const location = useLocation()
  const { settings } = useSettings()
  const [latest, setLatest] = useState([])
  const [popular, setPopular] = useState([])
  const slug = currentSlug(location.pathname)

  useEffect(() => {
    async function load() {
      try {
        const [published, popularData] = await Promise.all([
          getPublishedBlogs(),
          getPopularBlogs(6),
        ])
        setLatest(published)
        setPopular(popularData)
      } catch {
        setLatest([])
        setPopular([])
      }
    }

    load()
  }, [])

  const latestList = useMemo(
    () => latest.filter((blog) => blog.slug !== slug).slice(0, 5),
    [latest, slug],
  )

  const popularList = useMemo(() => {
    const latestIds = new Set(latestList.map((blog) => blog.id))
    return popular
      .filter((blog) => blog.slug !== slug && !latestIds.has(blog.id))
      .slice(0, 4)
  }, [popular, latestList, slug])

  return (
    <aside className="site-rail" aria-label="Latest and popular stories">
      <section className="site-rail-block">
        <h2>The magazine</h2>
        <p>
          {settings?.default_seo_description ||
            'Culture, focus, sport, and everyday life.'}
        </p>
      </section>

      <RailList title="Latest" blogs={latestList} />
      <RailList title="Most read" blogs={popularList} />

      <Link className="site-rail-all" to="/blogs">
        All stories
      </Link>
    </aside>
  )
}

export default SiteRail
