import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function AdminPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/admin/login')
  }

  return (
    <section className="page-shell">
      <p className="page-kicker">Studio</p>
      <h1>Admin</h1>
      <p className="page-intro">
        Signed in as {user?.email}. Manage the content structure for your
        blogging site.
      </p>

      <button type="button" className="admin-logout" onClick={handleLogout}>
        Log out
      </button>

      <ul className="admin-nav-list">
        <li>
          <Link to="/admin/seo">SEO settings</Link>
          <p>Titles, descriptions, and IDs the owner pastes into Google.</p>
        </li>
        <li>
          <Link to="/admin/analytics">Analytics</Link>
          <p>Page views recorded here. Full traffic reports stay in Google Analytics.</p>
        </li>
        <li>
          <Link to="/admin/categories">Categories</Link>
          <p>View, add, edit, disable, and delete categories.</p>
        </li>
        <li>
          <Link to="/admin/subcategories">Subcategories</Link>
          <p>Attach subtopics to a parent category.</p>
        </li>
        <li>
          <Link to="/admin/tags">Tags</Link>
          <p>Manage reusable tags used across blog posts.</p>
        </li>
        <li>
          <Link to="/admin/media">Media</Link>
          <p>Upload and manage images stored on local disk.</p>
        </li>
        <li>
          <Link to="/admin/blogs">Blogs</Link>
          <p>Create drafts, publish posts, and edit existing stories.</p>
        </li>
      </ul>
    </section>
  )
}

export default AdminPage
