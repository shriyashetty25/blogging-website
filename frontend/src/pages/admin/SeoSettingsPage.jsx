import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ImageUploadField from '../../components/ImageUploadField'
import { useSettings } from '../../context/SettingsContext'
import { updateSettings } from '../../services/settingsApi'
import './CategoriesPage.css'

const emptyForm = {
  site_name: '',
  default_seo_title: '',
  default_seo_description: '',
  public_site_url: '',
  default_share_image: '',
  google_analytics_id: '',
  google_search_console_verification: '',
  robots_txt: '',
  author_name: '',
  author_role: '',
  author_bio: '',
  author_image: '',
}

function SeoSettingsPage() {
  const { settings, refresh } = useSettings()
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (!settings) {
      return
    }
    setForm({
      site_name: settings.site_name || '',
      default_seo_title: settings.default_seo_title || '',
      default_seo_description: settings.default_seo_description || '',
      public_site_url: settings.public_site_url || '',
      default_share_image: settings.default_share_image || '',
      google_analytics_id: settings.google_analytics_id || '',
      google_search_console_verification:
        settings.google_search_console_verification || '',
      robots_txt: settings.robots_txt || '',
      author_name: settings.author_name || '',
      author_role: settings.author_role || '',
      author_bio: settings.author_bio || '',
      author_image: settings.author_image || '',
    })
  }, [settings])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const saved = await updateSettings({
        site_name: form.site_name.trim() || 'BlogSite',
        default_seo_title: form.default_seo_title.trim() || null,
        default_seo_description: form.default_seo_description.trim() || null,
        public_site_url: form.public_site_url.trim() || null,
        default_share_image: form.default_share_image.trim() || null,
        google_analytics_id: form.google_analytics_id.trim() || null,
        google_search_console_verification:
          form.google_search_console_verification.trim() || null,
        robots_txt: form.robots_txt.trim() || null,
        author_name: form.author_name.trim() || null,
        author_role: form.author_role.trim() || null,
        author_bio: form.author_bio.trim() || null,
        author_image: form.author_image.trim() || null,
      })
      await refresh()
      setForm({
        site_name: saved.site_name || '',
        default_seo_title: saved.default_seo_title || '',
        default_seo_description: saved.default_seo_description || '',
        public_site_url: saved.public_site_url || '',
        default_share_image: saved.default_share_image || '',
        google_analytics_id: saved.google_analytics_id || '',
        google_search_console_verification:
          saved.google_search_console_verification || '',
        robots_txt: saved.robots_txt || '',
        author_name: saved.author_name || '',
        author_role: saved.author_role || '',
        author_bio: saved.author_bio || '',
        author_image: saved.author_image || '',
      })
      setMessage('SEO settings saved. Connect Google with the IDs you pasted.')
    } catch (err) {
      setError(err.message || 'Unable to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const siteUrl = (form.public_site_url || 'http://localhost:5173').replace(
    /\/$/,
    '',
  )
  const previewTitle = form.default_seo_title || form.site_name || 'BlogSite'
  const previewDescription =
    form.default_seo_description || 'Add a default description for search results.'

  return (
    <section className="page-shell categories-admin">
      <p className="page-kicker">Studio</p>
      <h1>SEO settings</h1>
      <p className="page-intro">
        Fill these fields so the owner can connect Search Console, Analytics,
        and sharing previews. This site does not log into Google for you.
      </p>

      <Link className="text-link admin-back" to="/admin">
        Back to admin
      </Link>

      {error && <p className="admin-alert admin-alert-error">{error}</p>}
      {message && <p className="admin-alert admin-alert-success">{message}</p>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <h2>Site identity</h2>
        <label>
          Site name
          <input
            name="site_name"
            value={form.site_name}
            onChange={handleChange}
            maxLength={120}
            required
          />
        </label>
        <label>
          Default SEO title
          <input
            name="default_seo_title"
            value={form.default_seo_title}
            onChange={handleChange}
            maxLength={200}
            placeholder="Used when a page has no SEO title"
          />
        </label>
        <p className="admin-field-hint">
          Aim for about 50–60 characters. {form.default_seo_title.length} / 60
        </p>
        <label>
          Default SEO description
          <textarea
            name="default_seo_description"
            value={form.default_seo_description}
            onChange={handleChange}
            rows={3}
            placeholder="One or two sentences for search results and link previews"
          />
        </label>
        <p className="admin-field-hint">
          Aim for about 150–160 characters.{' '}
          {form.default_seo_description.length} / 160
        </p>
        <label>
          Public site URL
          <input
            name="public_site_url"
            type="url"
            value={form.public_site_url}
            onChange={handleChange}
            placeholder="https://your-domain.com"
          />
        </label>
        <p className="admin-field-hint">
          Used to build canonical URLs and the sitemap. Change this to your
          real domain when the site is live.
        </p>

        <ImageUploadField
          label="Default share image"
          value={form.default_share_image}
          onChange={({ url }) =>
            setForm((current) => ({ ...current, default_share_image: url }))
          }
        />
        <p className="admin-field-hint">
          Shown when a post has no featured image. Used for Open Graph previews.
        </p>

        <h2>Author details</h2>
        <p className="admin-field-hint">
          Shown at the end of every article. The name on a post can still be
          changed in the blog form.
        </p>
        <label>
          Author name
          <input
            name="author_name"
            value={form.author_name}
            onChange={handleChange}
            maxLength={120}
            placeholder="Editor"
          />
        </label>
        <label>
          Role
          <input
            name="author_role"
            value={form.author_role}
            onChange={handleChange}
            maxLength={80}
            placeholder="Writer"
          />
        </label>
        <label>
          Bio
          <textarea
            name="author_bio"
            value={form.author_bio}
            onChange={handleChange}
            rows={4}
            placeholder="A short note about the writer."
          />
        </label>
        <ImageUploadField
          label="Author photo"
          value={form.author_image}
          onChange={({ url }) =>
            setForm((current) => ({ ...current, author_image: url }))
          }
        />

        <div className="seo-preview" aria-label="Search result preview">
          <p className="seo-preview-kicker">Search preview</p>
          <p className="seo-preview-url">{siteUrl}</p>
          <p className="seo-preview-title">{previewTitle}</p>
          <p className="seo-preview-desc">{previewDescription}</p>
        </div>

        <h2>Connect later (paste IDs here)</h2>
        <p className="admin-field-hint">
          Create the properties in Google yourself, then paste the values.
        </p>
        <label>
          Google Analytics Measurement ID
          <input
            name="google_analytics_id"
            value={form.google_analytics_id}
            onChange={handleChange}
            maxLength={40}
            placeholder="G-XXXXXXXXXX"
          />
        </label>
        <p className="admin-field-hint">
          From Google Analytics → Admin → Data streams. The site will load
          gtag.js only after you paste an ID.
        </p>
        <label>
          Google Search Console verification
          <input
            name="google_search_console_verification"
            value={form.google_search_console_verification}
            onChange={handleChange}
            maxLength={120}
            placeholder="Meta tag content value only"
          />
        </label>
        <p className="admin-field-hint">
          Use the HTML-tag method in Search Console. Paste only the{' '}
          <code>content</code> value, not the whole tag.
        </p>

        <h2>Files to submit yourself</h2>
        <p className="admin-field-hint">
          Sitemap:{' '}
          <a href="http://localhost:8000/sitemap.xml" target="_blank" rel="noreferrer">
            /sitemap.xml
          </a>
          {' · '}
          Robots:{' '}
          <a href="http://localhost:8000/robots.txt" target="_blank" rel="noreferrer">
            /robots.txt
          </a>
          . In Search Console, add those URLs for your live domain.
        </p>
        <label>
          Custom robots.txt (optional)
          <textarea
            name="robots_txt"
            value={form.robots_txt}
            onChange={handleChange}
            rows={6}
            placeholder={`User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${siteUrl}/sitemap.xml`}
          />
        </label>
        <p className="admin-field-hint">
          Leave blank to use the generated default. Edit this if you know what
          you want crawlers to skip.
        </p>

        <div className="admin-form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save SEO settings'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default SeoSettingsPage
