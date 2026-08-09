import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCategories } from '../../services/categoriesApi'
import {
  createSubcategory,
  deleteSubcategory,
  getSubcategories,
  updateSubcategory,
} from '../../services/subcategoriesApi'
import { slugify } from '../../utils/slugify'
import './CategoriesPage.css'

const emptyForm = {
  category_id: '',
  name: '',
  slug: '',
  description: '',
  status: 'active',
}

function SubcategoriesPage() {
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [slugManual, setSlugManual] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  function getCategoryName(categoryId) {
    const category = categories.find((item) => item.id === categoryId)
    return category ? category.name : `Category #${categoryId}`
  }

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const [categoryData, subcategoryData] = await Promise.all([
        getCategories(),
        getSubcategories(),
      ])
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

  function startEdit(subcategory) {
    setEditingId(subcategory.id)
    setSlugManual(true)
    setForm({
      category_id: String(subcategory.category_id),
      name: subcategory.name,
      slug: subcategory.slug,
      description: subcategory.description || '',
      status: subcategory.status,
    })
    setMessage(null)
    setError(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    if (!form.category_id) {
      setError('Please select a category.')
      setSaving(false)
      return
    }

    const payload = {
      category_id: Number(form.category_id),
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
      description: form.description.trim() || null,
      status: form.status,
    }

    try {
      if (editingId) {
        await updateSubcategory(editingId, payload)
        setMessage('Subcategory updated.')
      } else {
        await createSubcategory(payload)
        setMessage('Subcategory created.')
      }

      resetForm()
      await loadData()
    } catch (err) {
      setError(err.message || 'Unable to save subcategory. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(subcategory) {
    const nextStatus = subcategory.status === 'active' ? 'disabled' : 'active'
    setError(null)
    setMessage(null)

    try {
      await updateSubcategory(subcategory.id, { status: nextStatus })
      setMessage(
        nextStatus === 'disabled'
          ? `"${subcategory.name}" disabled.`
          : `"${subcategory.name}" enabled.`,
      )
      await loadData()
    } catch (err) {
      setError(err.message || 'Unable to update subcategory status.')
    }
  }

  async function handleDelete(subcategory) {
    const confirmed = window.confirm(
      `Delete subcategory "${subcategory.name}"? This cannot be undone.`,
    )
    if (!confirmed) {
      return
    }

    setError(null)
    setMessage(null)

    try {
      await deleteSubcategory(subcategory.id)
      if (editingId === subcategory.id) {
        resetForm()
      }
      setMessage(`"${subcategory.name}" deleted.`)
      await loadData()
    } catch (err) {
      setError(err.message || 'Unable to delete subcategory.')
    }
  }

  return (
    <section className="page-shell categories-admin">
      <p className="page-kicker">Admin</p>
      <h1>Subcategories</h1>
      <p className="page-intro">
        Subcategories belong to a parent category. Choose the category first,
        then add the subcategory.
      </p>

      <Link className="text-link admin-back" to="/admin">
        Back to admin
      </Link>

      {error && <p className="admin-alert admin-alert-error">{error}</p>}
      {message && <p className="admin-alert admin-alert-success">{message}</p>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Edit subcategory' : 'Add subcategory'}</h2>

        <label>
          Category
          <select
            value={form.category_id}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                category_id: event.target.value,
              }))
            }
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.status === 'disabled' ? ' (disabled)' : ''}
              </option>
            ))}
          </select>
        </label>

        <label>
          Subcategory
          <input
            type="text"
            value={form.name}
            onChange={handleNameChange}
            required
            maxLength={100}
            placeholder="Cricket"
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
            placeholder="cricket"
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
            placeholder="Cricket related articles"
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
          <button type="submit" disabled={saving || categories.length === 0}>
            {saving
              ? 'Saving...'
              : editingId
                ? 'Update subcategory'
                : 'Save subcategory'}
          </button>
          {editingId && (
            <button type="button" className="button-secondary" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>

        {categories.length === 0 && (
          <p className="admin-empty">
            Create a category first before adding subcategories.
          </p>
        )}
      </form>

      <div className="admin-table-wrap">
        <h2>All subcategories</h2>

        {loading && <p>Loading subcategories...</p>}

        {!loading && subcategories.length === 0 && (
          <p className="admin-empty">No subcategories yet. Add one above.</p>
        )}

        {!loading && subcategories.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subcategories.map((subcategory) => (
                <tr key={subcategory.id}>
                  <td>{getCategoryName(subcategory.category_id)}</td>
                  <td>
                    <strong>{subcategory.name}</strong>
                    {subcategory.description && (
                      <p className="admin-table-desc">{subcategory.description}</p>
                    )}
                  </td>
                  <td>{subcategory.slug}</td>
                  <td>
                    <span className={`status-pill status-${subcategory.status}`}>
                      {subcategory.status}
                    </span>
                  </td>
                  <td className="admin-actions">
                    <button type="button" onClick={() => startEdit(subcategory)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(subcategory)}
                    >
                      {subcategory.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      className="button-danger"
                      onClick={() => handleDelete(subcategory)}
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

export default SubcategoriesPage
