import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import BlogList from '../components/BlogList'
import { getPublishedBlogs } from '../services/blogsApi'
import { getCategories } from '../services/categoriesApi'
import { getSubcategories } from '../services/subcategoriesApi'
import { toIdMap } from '../utils/lookupMaps'

function BlogsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q') || ''

  const [searchInput, setSearchInput] = useState(query)
  const [blogs, setBlogs] = useState([])
  const [categoriesById, setCategoriesById] = useState({})
  const [subcategoriesById, setSubcategoriesById] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setSearchInput(query)
  }, [query])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [blogData, categories, subcategories] = await Promise.all([
          getPublishedBlogs({ q: query || undefined }),
          getCategories(),
          getSubcategories(),
        ])
        setBlogs(blogData)
        setCategoriesById(toIdMap(categories))
        setSubcategoriesById(toIdMap(subcategories))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [query])

  function handleSearch(event) {
    event.preventDefault()
    const nextQuery = searchInput.trim()
    navigate(nextQuery ? `/blogs?q=${encodeURIComponent(nextQuery)}` : '/blogs')
  }

  return (
    <section className="page-shell">
      <p className="page-kicker">The archive</p>
      <h1>{query ? 'Search results' : 'All Stories'}</h1>
      <p className="page-intro">
        {query
          ? `Showing published stories matching “${query}”.`
          : 'Every published story on BlogSite, pulled live from FastAPI.'}
      </p>

      <form className="public-search" onSubmit={handleSearch}>
        <label>
          Search
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search title, excerpt, content, tags"
          />
        </label>
        <button type="submit">Search</button>
      </form>

      {loading && <p className="page-intro">Loading stories...</p>}
      {error && <p className="page-intro">Unable to load stories. {error}</p>}
      {!loading && !error && (
        <BlogList
          blogs={blogs}
          categoriesById={categoriesById}
          subcategoriesById={subcategoriesById}
          emptyMessage={
            query
              ? 'No published stories matched your search.'
              : 'No published stories yet.'
          }
        />
      )}
    </section>
  )
}

export default BlogsPage
