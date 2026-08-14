import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createBlog, getBlog, updateBlog } from '../../services/blogsApi'
import { getCategories } from '../../services/categoriesApi'
import { getSubcategories } from '../../services/subcategoriesApi'
import ImageUploadField from '../../components/ImageUploadField'
import BlogEditor from '../../components/editor/BlogEditor'
import { isContentEmpty, parseStoredContent } from '../../editor/content'
import { slugify } from '../../utils/slugify'
import { inputValueToTagNames, tagsToInputValue } from '../../utils/tags'
import './CategoriesPage.css'

const emptyForm = {
  category_id: '',
  subcategory_id: '',
  title: '',
  slug: '',
  author: 'Editor',
  excerpt: '',
  featured_image: '',
  featured_image_thumb: '',
  content: '',
  tags: '',
  seo_title: '',
  seo_description: '',
  status: 'DRAFT',
}

function AdminBlogFormPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [slugManual, setSlugManual] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const filteredSubcategories = useMemo(() => {
    if (!form.category_id) {
      return []
    }
    return subcategories.filter(
      (item) => String(item.category_id) === String(form.category_id),
    )
  }, [form.category_id, subcategories])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [categoryData, subcategoryData] = await Promise.all([
          getCategories(),
          getSubcategories(),
        ])
        setCategories(categoryData)
        setSubcategories(subcategoryData)

        if (isEditing) {
          const blog = await getBlog(id)
          setForm({
            category_id: String(blog.category_id),
            subcategory_id: String(blog.subcategory_id),
            title: blog.title || '',
            slug: blog.slug || '',
            author: blog.author || 'Editor',
            excerpt: blog.excerpt || '',
            featured_image: blog.featured_image || '',
            featured_image_thumb: blog.featured_image_thumb || '',
            content: blog.content || '',
            tags: tagsToInputValue(blog.tags),
            seo_title: blog.seo_title || '',
            seo_description: blog.seo_description || '',
            status: blog.status || 'DRAFT',
          })
          setSlugManual(true)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id, isEditing])

  function handleTitleChange(event) {
    const title = event.target.value
    setForm((current) => ({
      ...current,
      title,
      slug: slugManual ? current.slug : slugify(title),
    }))
  }

  function handleCategoryChange(event) {
    const categoryId = event.target.value
    setForm((current) => ({
      ...current,
      category_id: categoryId,
      subcategory_id: '',
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    if (!form.category_id || !form.subcategory_id) {
      setError('Please select both a category and a subcategory.')
      setSaving(false)
      return
    }

    const payload = {
      category_id: Number(form.category_id),
      subcategory_id: Number(form.subcategory_id),
      title: form.title.trim(),
      slug: form.slug.trim().toLowerCase(),
      author: form.author.trim() || 'Editor',
      excerpt: form.excerpt.trim() || null,
      featured_image: form.featured_image.trim() || null,
      featured_image_thumb: form.featured_image_thumb.trim() || null,
      content: isContentEmpty(parseStoredContent(form.content))
        ? null
        : form.content,
      tag_names: inputValueToTagNames(form.tags),
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      status: form.status,
    }

    try {
      if (isEditing) {
        await updateBlog(id, payload)
      } else {
        await createBlog(payload)
      }
      navigate('/admin/blogs')
    } catch (err) {
      setError(err.message || 'Unable to save blog. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="page-shell categories-admin">
        <p>Loading blog form...</p>
      </section>
    )
  }

  return (
    <section className="page-shell categories-admin">
      <p className="page-kicker">Admin</p>
      <h1>{isEditing ? 'Edit Blog' : 'Create Blog'}</h1>
      <p className="page-intro">
        Write with TipTap. Content is stored as structured JSON so you can
        extend the editor later.
      </p>

      <Link className="text-link admin-back" to="/admin/blogs">
        Back to blogs
      </Link>

      {error && <p className="admin-alert admin-alert-error">{error}</p>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          Title
          <input
            type="text"
            value={form.title}
            onChange={handleTitleChange}
            required
            maxLength={200}
            placeholder="How to Improve Cricket Batting"
          />
        </label>

        <label>
          Author
          <input
            type="text"
            value={form.author}
            onChange={(event) =>
              setForm((current) => ({ ...current, author: event.target.value }))
            }
            maxLength={120}
            placeholder="Editor"
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
            maxLength={220}
            placeholder="how-to-improve-cricket-batting"
          />
        </label>

        <label>
          Category
          <select
            value={form.category_id}
            onChange={handleCategoryChange}
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Subcategory
          <select
            value={form.subcategory_id}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                subcategory_id: event.target.value,
              }))
            }
            required
            disabled={!form.category_id}
          >
            <option value="">
              {form.category_id
                ? 'Select a subcategory'
                : 'Select a category first'}
            </option>
            {filteredSubcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Excerpt
          <textarea
            value={form.excerpt}
            onChange={(event) =>
              setForm((current) => ({ ...current, excerpt: event.target.value }))
            }
            rows={3}
            placeholder="A short summary for listings."
          />
        </label>

        <ImageUploadField
          label="Featured Image"
          value={form.featured_image}
          thumbValue={form.featured_image_thumb}
          onChange={({ url, thumbUrl }) =>
            setForm((current) => ({
              ...current,
              featured_image: url,
              featured_image_thumb: thumbUrl || '',
            }))
          }
        />


        <div className="admin-editor-field">
          <span className="admin-editor-label">Content</span>
          <BlogEditor
            value={form.content}
            onChange={(nextContent) =>
              setForm((current) => ({ ...current, content: nextContent }))
            }
          />
        </div>

        <label>
          Tags
          <input
            type="text"
            value={form.tags}
            onChange={(event) =>
              setForm((current) => ({ ...current, tags: event.target.value }))
            }
            placeholder="cricket, batting, training"
          />
        </label>
        <p className="admin-field-hint">
          Comma-separated names. New tags are created automatically.
        </p>

        <div className="seo-form-panel">
          <h2>SEO for this post</h2>
          <p className="admin-field-hint">
            Used in the browser tab, search snippets, and link previews. The
            owner still submits the sitemap in Search Console.
          </p>

          <label>
            SEO Title
            <input
              type="text"
              value={form.seo_title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  seo_title: event.target.value,
                }))
              }
              maxLength={200}
              placeholder={form.title || 'Optional search title'}
            />
          </label>
          <p className="admin-field-hint">
            Aim for about 50–60 characters. {(form.seo_title || '').length} / 60
          </p>

          <label>
            SEO Description
            <textarea
              value={form.seo_description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  seo_description: event.target.value,
                }))
              }
              rows={3}
              placeholder={form.excerpt || 'Optional search description'}
            />
          </label>
          <p className="admin-field-hint">
            Aim for about 150–160 characters.{' '}
            {(form.seo_description || '').length} / 160
          </p>

          <div className="seo-preview" aria-label="Search result preview">
            <p className="seo-preview-kicker">Search preview</p>
            <p className="seo-preview-url">
              /blog/{form.slug || 'your-post-slug'}
            </p>
            <p className="seo-preview-title">
              {form.seo_title || form.title || 'Post title'}
            </p>
            <p className="seo-preview-desc">
              {form.seo_description ||
                form.excerpt ||
                'Add an SEO description or excerpt.'}
            </p>
          </div>
        </div>

        <label>
          Status
          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({ ...current, status: event.target.value }))
            }
          >
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </label>

        <div className="admin-form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : isEditing ? 'Update blog' : 'Save blog'}
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => navigate('/admin/blogs')}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}

export default AdminBlogFormPage
