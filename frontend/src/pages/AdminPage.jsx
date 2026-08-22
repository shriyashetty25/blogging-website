import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDashboardOverview } from '../services/analyticsApi'
import './admin/CategoriesPage.css'
import './AdminPage.css'

const CHART_RANGES = [
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' },
]

const ADMIN_LINKS = [
  { to: '/admin/blogs', label: 'Blogs', hint: 'Write and publish' },
  { to: '/admin/categories', label: 'Categories', hint: 'Top-level topics' },
  { to: '/admin/subcategories', label: 'Subcategories', hint: 'Nested topics' },
  { to: '/admin/tags', label: 'Tags', hint: 'Reusable labels' },
  { to: '/admin/media', label: 'Media', hint: 'Images on disk' },
  { to: '/admin/seo', label: 'SEO', hint: 'Titles and Google IDs' },
  { to: '/admin/analytics', label: 'Analytics', hint: 'View counts' },
]

function formatChartLabel(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function AdminPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chartDays, setChartDays] = useState(14)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const overview = await getDashboardOverview()
        setData(overview)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  async function handleLogout() {
    await logout()
    navigate('/admin/login')
  }

  const visibleTraffic = useMemo(() => {
    if (!data) {
      return []
    }
    return data.daily_traffic.slice(-chartDays)
  }, [data, chartDays])

  const peakViews = Math.max(1, ...visibleTraffic.map((item) => item.views))

  return (
    <section className="page-shell categories-admin dashboard-page">
      <p className="page-kicker">Studio</p>
      <h1>Dashboard</h1>
      <p className="page-intro">
        Signed in as {user?.email}. These numbers come from FastAPI, not dummy
        data.
      </p>

      <button type="button" className="admin-logout" onClick={handleLogout}>
        Log out
      </button>

      {loading && <p className="page-intro">Loading dashboard...</p>}
      {error && <p className="admin-alert admin-alert-error">{error}</p>}

      {data && (
        <>
          <ul className="analytics-stats">
            <li>
              <Link to="/admin/blogs">
                <strong>{data.total_blogs}</strong>
                <span>Total blogs</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/blogs?status=PUBLISHED">
                <strong>{data.published_blogs}</strong>
                <span>Published</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/blogs?status=DRAFT">
                <strong>{data.draft_blogs}</strong>
                <span>Drafts</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/blogs?status=ARCHIVED">
                <strong>{data.archived_blogs}</strong>
                <span>Archived</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/categories">
                <strong>{data.categories}</strong>
                <span>Categories</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/subcategories">
                <strong>{data.subcategories}</strong>
                <span>Subcategories</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/analytics">
                <strong>{data.total_views}</strong>
                <span>Total views</span>
              </Link>
            </li>
          </ul>

          <div className="dashboard-chart-card">
            <div className="dashboard-section-head">
              <h2>Traffic</h2>
              <div className="admin-filter-tabs" role="tablist" aria-label="Traffic range">
                {CHART_RANGES.map((range) => (
                  <button
                    key={range.days}
                    type="button"
                    role="tab"
                    aria-selected={chartDays === range.days}
                    className={chartDays === range.days ? 'active' : ''}
                    onClick={() => setChartDays(range.days)}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="admin-field-hint">
              Today {data.views_today} · last 7 days {data.views_week} · last 30
              days {data.views_month}
            </p>
            <div
              className="traffic-chart"
              style={{ '--chart-cols': visibleTraffic.length }}
              role="img"
              aria-label={`Page views for the last ${chartDays} days`}
            >
              {visibleTraffic.map((item) => (
                <div key={item.date} className="traffic-chart-col">
                  <div
                    className="traffic-chart-bar"
                    style={{
                      height: `${Math.max(6, (item.views / peakViews) * 100)}%`,
                    }}
                    title={`${item.views} views on ${item.date}`}
                  />
                  <span>{formatChartLabel(item.date)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-table-wrap dashboard-navbar-slots">
            <h2>Navbar Top 3</h2>
            <p className="admin-field-hint">
              These posts put their category on the public navbar after Home and
              Blogs.
            </p>
            {data.navbar_slots.length === 0 ? (
              <p className="admin-empty">
                No navbar slots yet. Edit a published blog and set Top 1, 2, or
                3.
              </p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Slot</th>
                    <th>Category</th>
                    <th>Post</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.navbar_slots.map((slot) => (
                    <tr key={slot.rank}>
                      <td>Top {slot.rank}</td>
                      <td>
                        <Link to={`/${slot.category_slug}`}>
                          {slot.category_name}
                        </Link>
                      </td>
                      <td>
                        <Link to={`/admin/blogs/${slot.blog_id}/edit`}>
                          {slot.title}
                        </Link>
                      </td>
                      <td>
                        <span
                          className={`status-pill status-${slot.status.toLowerCase()}`}
                        >
                          {slot.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="dashboard-columns">
            <div className="admin-table-wrap">
              <h2>Popular blogs</h2>
              {data.popular_blogs.length === 0 ? (
                <p className="admin-empty">
                  No blog views yet. Open a published story on the public site.
                </p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.popular_blogs.map((blog) => (
                      <tr key={blog.id}>
                        <td>
                          <Link to={`/blog/${blog.slug}`}>{blog.title}</Link>
                        </td>
                        <td>{blog.views}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="admin-table-wrap">
              <h2>Recent blogs</h2>
              {data.recent_blogs.length === 0 ? (
                <p className="admin-empty">No blogs yet.</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_blogs.map((blog) => (
                      <tr key={blog.id}>
                        <td>
                          <Link to={`/admin/blogs/${blog.id}/edit`}>
                            {blog.title}
                          </Link>
                        </td>
                        <td>
                          <span
                            className={`status-pill status-${blog.status.toLowerCase()}`}
                          >
                            {blog.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      <nav className="dashboard-shortcuts" aria-label="Admin sections">
        {ADMIN_LINKS.map((item) => (
          <Link key={item.to} to={item.to}>
            <strong>{item.label}</strong>
            <span>{item.hint}</span>
          </Link>
        ))}
      </nav>
    </section>
  )
}

export default AdminPage
