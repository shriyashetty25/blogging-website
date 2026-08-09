import { Link } from 'react-router-dom'

function AdminPage() {
  return (
    <section className="page-shell">
      <p className="page-kicker">Studio</p>
      <h1>Admin</h1>
      <p className="page-intro">
        Manage the content structure for your blogging site.
      </p>

      <ul className="admin-nav-list">
        <li>
          <Link to="/admin/categories">Categories</Link>
          <p>View, add, edit, disable, and delete categories.</p>
        </li>
        <li>
          <span>Subcategories</span>
          <p>Coming in Phase 5</p>
        </li>
        <li>
          <span>Blogs</span>
          <p>Coming in Phase 7</p>
        </li>
      </ul>
    </section>
  )
}

export default AdminPage
