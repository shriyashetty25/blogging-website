import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import BlogContent from '../components/editor/BlogContent'
import SeoHead from '../components/SeoHead'
import { getBlogBySlug, getPublishedBlogs } from '../services/blogsApi'
import { recordView } from '../services/analyticsApi'
import RelatedBlogs from '../components/RelatedBlogs'
import AuthorCard from '../components/AuthorCard'
import { getCategories } from '../services/categoriesApi'
import { getSubcategories } from '../services/subcategoriesApi'
import { formatDate } from '../utils/formatDate'
import { toIdMap } from '../utils/lookupMaps'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80'

function BlogDetailsPage() {
  const { slug } = useParams()
  const [blog, setBlog] = useState(null)
  const [category, setCategory] = useState(null)
  const [subcategory, setSubcategory] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      setRelated([])

      try {
        const [blogData, categories, subcategories] = await Promise.all([
          getBlogBySlug(slug),
          getCategories(),
          getSubcategories(),
        ])

        if (cancelled) {
          return
        }

        if (blogData.status !== 'PUBLISHED') {
          setBlog(null)
          setError('This story is not published.')
          return
        }

        const categoriesById = toIdMap(categories)
        const subcategoriesById = toIdMap(subcategories)
        setBlog(blogData)
        setCategory(categoriesById[blogData.category_id] || null)
        setSubcategory(subcategoriesById[blogData.subcategory_id] || null)
        recordView({ path: `/blog/${blogData.slug}`, blog_id: blogData.id })

        const published = await getPublishedBlogs({
          category_id: blogData.category_id,
        })
        if (cancelled) {
          return
        }
        const others = published.filter((item) => item.id !== blogData.id)
        const sameSub = others.filter(
          (item) => item.subcategory_id === blogData.subcategory_id,
        )
        const sameCategory = others.filter(
          (item) => item.subcategory_id !== blogData.subcategory_id,
        )
        setRelated([...sameSub, ...sameCategory].slice(0, 3))
      } catch (err) {
        if (cancelled) {
          return
        }
        setBlog(null)
        setError(err.message || 'Story not found')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <section className="page-shell">
        <p className="page-intro">Loading story...</p>
      </section>
    )
  }

  if (!blog) {
    return (
      <section className="page-shell">
        <SeoHead title="Story not found" path={`/blog/${slug}`} />
        <p className="page-kicker">Missing page</p>
        <h1>Story not found</h1>
        <p className="page-intro">{error || `No article matches “${slug}”.`}</p>
        <Link className="text-link" to="/blogs">
          Back to stories
        </Link>
      </section>
    )
  }

  return (
    <article className="page-shell">
      <SeoHead
        title={blog.seo_title || blog.title}
        description={blog.seo_description || blog.excerpt}
        path={`/blog/${blog.slug}`}
        image={blog.featured_image}
        type="article"
      />
      <p className="article-meta">
        {category ? (
          <Link to={`/${category.slug}`}>{category.name}</Link>
        ) : (
          'Category'
        )}
        {' / '}
        {category && subcategory ? (
          <Link to={`/${category.slug}/${subcategory.slug}`}>
            {subcategory.name}
          </Link>
        ) : (
          'Subcategory'
        )}
        {blog.published_at ? ` · ${formatDate(blog.published_at)}` : ''}
        {blog.author ? ` · By ${blog.author}` : ''}
      </p>
      <h1 className="article-title">{blog.title}</h1>
      {blog.excerpt && <p className="page-intro">{blog.excerpt}</p>}
      <img
        className="article-hero"
        src={blog.featured_image || FALLBACK_IMAGE}
        alt=""
        width={1200}
        height={700}
        fetchPriority="high"
        decoding="async"
      />
      <BlogContent value={blog.content} />

      {blog.tags?.length > 0 && (
        <p className="article-tags">
          Tags:{' '}
          {blog.tags.map((tag, index) => (
            <span key={tag.id}>
              {index > 0 ? ', ' : ''}
              <Link to={`/blogs?q=${encodeURIComponent(tag.name)}`}>
                {tag.name}
              </Link>
            </span>
          ))}
        </p>
      )}
      <AuthorCard authorName={blog.author} />
      <RelatedBlogs blogs={related} />
      <Link className="text-link" to="/blogs">
        Back to stories
      </Link>
    </article>
  )
}

export default BlogDetailsPage
