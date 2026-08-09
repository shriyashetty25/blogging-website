import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './CategoriesPage.css'

function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/admin'

  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  if (!loading && isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await login(email.trim(), password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to log in.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-shell categories-admin">
      <p className="page-kicker">Admin</p>
      <h1>Login</h1>
      <p className="page-intro">
        Sign in with the admin account to manage categories, tags, and blogs.
      </p>

      <Link className="text-link admin-back" to="/">
        Back to site
      </Link>

      {error && <p className="admin-alert admin-alert-error">{error}</p>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="username"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        <div className="admin-form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default LoginPage
