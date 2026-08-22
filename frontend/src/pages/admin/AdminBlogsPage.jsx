import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { deleteBlog, getBlogs } from '../../services/blogsApi'
import { getCategories } from '../../services/categoriesApi'
import { getSubcategories } from '../../services/subcategoriesApi'
import './CategoriesPage.css'

const FILTERS = [
  { key: 'all', label: 'All Blogs' },
  { key: 'DRAFT', label: 'Drafts' },
  { key: 'PUBLISHED', label: 'Published' },
  { key: 'ARCHIVED', label: 'Archived' },
]

function AdminBlogsPage() {
  const [searchParams] = useSearchParams()
  const statusFromUrl = searchParams.get('status')
  const initialFilter = FILTERS.some((item) => item.key === statusFromUrl)
    ? statusFromUrl
    : 'all'

  const [blogs, setBlogs] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [filter, setFilter] = useState(initialFilter)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  function getCategoryName(id) {
    return categories.find((item) => item.id === id)?.name || `#${id}`
  }

  function getSubcategoryName(id) {
    return subcategories.find((item) => item.id === id)?.name || `#${id}`
  }

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const [blogData, categoryData, subcategoryData] = await Promise.all([
        getBlogs(),
        getCategories(),
        getSubcategories(),
      ])
      setBlogs(blogData)
      setCategories(categoryData)
      setSubcategories(subcategoryData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    setFilter(initialFilter)
  }, [initialFilter])

  const visibleBlogs = useMemo(() => {
    if (filter === 'all') {
      return blogs
    }
    return blogs.filter((blog) => blog.status === filter)
  }, [blogs, filter])

  async function handleDelete(blog) {
    const confirmed = window.confirm(
      `Delete blog "${blog.title}"? This cannot be undone.`,
    )
    if (!confirmed) {
      return
    }

    setError(null)
    setMessage(null)

    try {
      await deleteBlog(blog.id)
      setMessage(`"${blog.title}" deleted.`)
      await loadData()
    } catch (err) {
      setError(err.message || 'Unable to delete blog.')
    }
  }

  return (
    <section className="page-shell categories-admin">
      <p className="page-kicker">Admin</p>
      <h1>Blogs</h1>
      <p className="page-intro">
        Create drafts, publish stories, and keep the archive organized.
      </p>

      <div className="admin-toolbar">
        <Link className="text-link admin-back" to="/admin">
          Back to admin
        </Link>
        <Link className="admin-primary-link" to="/admin/blogs/new">
          Create Blog
        </Link>
      </div>

      {error && <p className="admin-alert admin-alert-error">{error}</p>}
      {message && <p className="admin-alert admin-alert-success">{message}</p>}

      <div className="admin-filter-tabs" role="tablist" aria-label="Blog filters">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={filter === item.key}
            className={filter === item.key ? 'active' : ''}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="admin-table-wrap">
        {loading && <p>Loading blogs...</p>}

        {!loading && visibleBlogs.length === 0 && (
          <p className="admin-empty">No blogs in this view yet.</p>
        )}

        {!loading && visibleBlogs.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Navbar</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleBlogs.map((blog) => (
                <tr key={blog.id}>
                  <td>
                    <strong>{blog.title}</strong>
                    <p className="admin-table-desc">/{blog.slug}</p>
                    {blog.excerpt && (
                      <p className="admin-table-desc">{blog.excerpt}</p>
                    )}
                  </td>
                  <td>
                    {getCategoryName(blog.category_id)} /{' '}
                    {getSubcategoryName(blog.subcategory_id)}
                  </td>
                  <td>{blog.navbar_rank ? `Top ${blog.navbar_rank}` : '—'}</td>
                  <td>
                    <span className={`status-pill status-${blog.status.toLowerCase()}`}>
                      {blog.status}
                    </span>
                  </td>
                  <td className="admin-actions">
                    <Link to={`/admin/blogs/${blog.id}/edit`}>Edit</Link>
                    <button
                      type="button"
                      className="button-danger"
                      onClick={() => handleDelete(blog)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

export default AdminBlogsPage
