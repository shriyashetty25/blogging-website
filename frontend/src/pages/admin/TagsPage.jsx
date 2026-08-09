import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createTag,
  deleteTag,
  getTags,
  updateTag,
} from '../../services/tagsApi'
import { slugify } from '../../utils/slugify'
import './CategoriesPage.css'

const emptyForm = {
  name: '',
  slug: '',
}

function TagsPage() {
  const [tags, setTags] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [slugManual, setSlugManual] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  async function loadTags() {
    setLoading(true)
    setError(null)

    try {
      const data = await getTags()
      setTags(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTags()
  }, [])

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setSlugManual(false)
  }

  function startEdit(tag) {
    setEditingId(tag.id)
    setSlugManual(true)
    setForm({
      name: tag.name,
      slug: tag.slug,
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
      slug: form.slug.trim().toLowerCase() || slugify(form.name),
    }

    try {
      if (editingId) {
        await updateTag(editingId, payload)
        setMessage('Tag updated.')
      } else {
        await createTag(payload)
        setMessage('Tag created.')
      }
      resetForm()
      await loadTags()
    } catch (err) {
      setError(err.message || 'Unable to save tag.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(tag) {
    const confirmed = window.confirm(
      `Delete tag "${tag.name}"? It will be removed from all blogs.`,
    )
    if (!confirmed) {
      return
    }

    setError(null)
    setMessage(null)

    try {
      await deleteTag(tag.id)
      if (editingId === tag.id) {
        resetForm()
      }
      setMessage(`"${tag.name}" deleted.`)
      await loadTags()
    } catch (err) {
      setError(err.message || 'Unable to delete tag.')
    }
  }

  return (
    <section className="page-shell categories-admin">
      <p className="page-kicker">Admin</p>
      <h1>Tags</h1>
      <p className="page-intro">
        Manage reusable tags. Blogs can also create tags automatically when you
        type them in the blog form.
      </p>

      <Link className="text-link admin-back" to="/admin">
        Back to admin
      </Link>

      {error && <p className="admin-alert admin-alert-error">{error}</p>}
      {message && <p className="admin-alert admin-alert-success">{message}</p>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Edit tag' : 'Add tag'}</h2>

        <label>
          Name
          <input
            type="text"
            value={form.name}
            onChange={(event) => {
              const name = event.target.value
              setForm((current) => ({
                ...current,
                name,
                slug: slugManual ? current.slug : slugify(name),
              }))
            }}
            required
            maxLength={100}
            placeholder="cricket"
          />
        </label>

        <label>
          Slug
          <input
            type="text"
            value={form.slug}
            onChange={(event) => {
              setSlugManual(true)
              setForm((current) => ({ ...current, slug: event.target.value }))
            }}
            required
            maxLength={120}
            placeholder="cricket"
          />
        </label>

        <div className="admin-form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update tag' : 'Save tag'}
          </button>
          {editingId && (
            <button type="button" className="button-secondary" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="admin-table-wrap">
        <h2>All tags</h2>
        {loading && <p>Loading tags...</p>}
        {!loading && tags.length === 0 && (
          <p className="admin-empty">No tags yet.</p>
        )}
        {!loading && tags.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td>
                    <strong>{tag.name}</strong>
                  </td>
                  <td>{tag.slug}</td>
                  <td className="admin-actions">
                    <button type="button" onClick={() => startEdit(tag)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="button-danger"
                      onClick={() => handleDelete(tag)}
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

export default TagsPage
