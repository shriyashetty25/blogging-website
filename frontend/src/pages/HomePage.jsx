import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BlogList from '../components/BlogList'
import SeoHead from '../components/SeoHead'
import { getPublishedBlogs } from '../services/blogsApi'
import { getCategories } from '../services/categoriesApi'
import { getSubcategories } from '../services/subcategoriesApi'
import { toIdMap } from '../utils/lookupMaps'
import './HomePage.css'

function HomePage() {
  const [blogs, setBlogs] = useState([])
  const [categoriesById, setCategoriesById] = useState({})
  const [subcategoriesById, setSubcategoriesById] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [blogData, categories, subcategories] = await Promise.all([
          getPublishedBlogs(),
          getCategories(),
          getSubcategories(),
        ])
        setBlogs(blogData.slice(0, 3))
        setCategoriesById(toIdMap(categories))
        setSubcategoriesById(toIdMap(subcategories))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <section className="home">
      <SeoHead
        title=""
        description="A personal magazine for culture, focus, sport, and everyday life."
        path="/"
      />
      <header className="home-header">
        <h1 className="home-masthead">BlogSite</h1>
        <p className="home-tagline">
          A personal magazine for culture, focus, sport, and everyday life.
        </p>
      </header>

      <div className="home-latest-header">
        <h2>Latest</h2>
        <Link to="/blogs">View all</Link>
      </div>

      {loading && <p className="page-intro">Loading stories...</p>}
      {error && <p className="page-intro">Unable to load stories. {error}</p>}
      {!loading && !error && (
        <BlogList
          blogs={blogs}
          categoriesById={categoriesById}
          subcategoriesById={subcategoriesById}
        />
      )}
    </section>
  )
}

export default HomePage
