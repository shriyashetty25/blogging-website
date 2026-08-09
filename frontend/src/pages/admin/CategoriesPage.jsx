import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '../../services/categoriesApi'
import { slugify } from '../../utils/slugify'
import './CategoriesPage.css'

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  status: 'active',
}

function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [slugManual, setSlugManual] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  async function loadCategories() {
    setLoading(true)
    setError(null)

    try {
      const data = await getCategories()
      setCategories(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  function handleNameChange(event) {
    const name = event.target.value
    setForm((current) => ({
      ...current,
      name,
      slug: slugManual ? current.slug : slugify(name),
    }))
  }

  function handleSlugChange(event) {
    setSlugManual(true)
    setForm((current) => ({ ...current, slug: event.target.value }))
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setSlugManual(false)
  }

  function startEdit(category) {
    setEditingId(category.id)
    setSlugManual(true)
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      status: category.status,
    })
    setMessage(null)
    setError(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
      description: form.description.trim() || null,
      status: form.status,
    }

    try {
      if (editingId) {
        await updateCategory(editingId, payload)
        setMessage('Category updated.')
      } else {
        await createCategory(payload)
        setMessage('Category created.')
      }

      resetForm()
      await loadCategories()
    } catch (err) {
      setError(err.message || 'Unable to save category. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(category) {
    const nextStatus = category.status === 'active' ? 'disabled' : 'active'
    setError(null)
    setMessage(null)

    try {
      await updateCategory(category.id, { status: nextStatus })
      setMessage(
        nextStatus === 'disabled'
          ? `"${category.name}" disabled.`
          : `"${category.name}" enabled.`,
      )
      await loadCategories()
    } catch (err) {
      setError(err.message || 'Unable to update category status.')
    }
  }

  async function handleDelete(category) {
    const confirmed = window.confirm(
      `Delete category "${category.name}"? This cannot be undone.`,
    )
    if (!confirmed) {
      return
    }

    setError(null)
    setMessage(null)

    try {
      await deleteCategory(category.id)
      if (editingId === category.id) {
        resetForm()
      }
      setMessage(`"${category.name}" deleted.`)
      await loadCategories()
    } catch (err) {
      setError(err.message || 'Unable to delete category.')
    }
  }

  return (
    <section className="page-shell categories-admin">
      <p className="page-kicker">Admin</p>
      <h1>Categories</h1>
      <p className="page-intro">
        Create and manage top-level topics for your blog. Data comes from
        FastAPI — not dummy data.
      </p>

      <Link className="text-link admin-back" to="/admin">
        Back to admin
      </Link>

      {error && <p className="admin-alert admin-alert-error">{error}</p>}
      {message && <p className="admin-alert admin-alert-success">{message}</p>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Edit category' : 'Add category'}</h2>

        <label>
          Name
          <input
            type="text"
            value={form.name}
            onChange={handleNameChange}
            required
            maxLength={100}
            placeholder="Sports"
          />
        </label>

        <label>
          Slug
          <input
            type="text"
            value={form.slug}
            onChange={handleSlugChange}
            required
            maxLength={120}
            placeholder="sports"
          />
        </label>

        <label>
          Description
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            rows={3}
            placeholder="Sports related articles"
          />
        </label>

        <label>
          Status
          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
          >
            <option value="active">active</option>
            <option value="disabled">disabled</option>
          </select>
        </label>

        <div className="admin-form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update category' : 'Save category'}
          </button>
          {editingId && (
            <button type="button" className="button-secondary" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="admin-table-wrap">
        <h2>All categories</h2>

        {loading && <p>Loading categories...</p>}

        {!loading && categories.length === 0 && (
          <p className="admin-empty">No categories yet. Add one above.</p>
        )}

        {!loading && categories.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <strong>{category.name}</strong>
                    {category.description && (
                      <p className="admin-table-desc">{category.description}</p>
                    )}
                  </td>
                  <td>{category.slug}</td>
                  <td>
                    <span className={`status-pill status-${category.status}`}>
                      {category.status}
                    </span>
                  </td>
                  <td className="admin-actions">
                    <button type="button" onClick={() => startEdit(category)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(category)}
                    >
                      {category.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      className="button-danger"
                      onClick={() => handleDelete(category)}
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

export default CategoriesPage
