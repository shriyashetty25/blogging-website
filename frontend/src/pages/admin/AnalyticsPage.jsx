import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAnalyticsOverview } from '../../services/analyticsApi'
import './CategoriesPage.css'

function AnalyticsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const overview = await getAnalyticsOverview()
        setData(overview)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <section className="page-shell categories-admin">
      <p className="page-kicker">Studio</p>
      <h1>Analytics</h1>
      <p className="page-intro">
        Page views recorded by this site. Countries, devices, and traffic
        sources come from Google Analytics after you paste a Measurement ID
        in SEO settings.
      </p>

      <Link className="text-link admin-back" to="/admin">
        Back to admin
      </Link>

      {loading && <p className="page-intro">Loading analytics...</p>}
      {error && <p className="admin-alert admin-alert-error">{error}</p>}

      {data && (
        <>
          <ul className="analytics-stats">
            <li>
              <strong>{data.page_views}</strong>
              <span>Page views</span>
            </li>
            <li>
              <strong>{data.blog_views}</strong>
              <span>Blog views</span>
            </li>
            <li>
              <strong>{data.views_today}</strong>
              <span>Today</span>
            </li>
            <li>
              <strong>{data.views_week}</strong>
              <span>Last 7 days</span>
            </li>
            <li>
              <strong>{data.views_month}</strong>
              <span>Last 30 days</span>
            </li>
          </ul>

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
        </>
      )}
    </section>
  )
}

export default AnalyticsPage
