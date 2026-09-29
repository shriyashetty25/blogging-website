import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import BlogContent from '../components/editor/BlogContent'
import SeoHead from '../components/SeoHead'
import { recordView } from '../services/analyticsApi'
import RelatedBlogs from '../components/RelatedBlogs'
import AuthorCard from '../components/AuthorCard'
import { formatDate } from '../utils/formatDate'
import { useInitialData } from '../ssr/InitialDataContext'
import { loadBlogPage } from '../ssr/loaders'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80'

function trackView(blog) {
  if (blog) {
    recordView({ path: `/blog/${blog.slug}`, blog_id: blog.id })
  }
}

function BlogDetailsPage() {
  const { slug } = useParams()
  const initial = useInitialData().blogPage
  const preloaded = initial && initial.slug === slug ? initial : null
  const [page, setPage] = useState(preloaded)
  const [loading, setLoading] = useState(!preloaded)
  const loadedSlug = useRef(preloaded ? slug : null)

  useEffect(() => {
    if (loadedSlug.current === slug) {
      setLoading(false)
      trackView(page?.blog)
      return undefined
    }

    let cancelled = false
    setLoading(true)
    loadBlogPage(slug).then((result) => {
      if (cancelled) {
        return
      }
      loadedSlug.current = slug
      setPage(result)
      setLoading(false)
      trackView(result.blog)
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const blog = page?.blog
  const category = page?.category
  const subcategory = page?.subcategory
  const related = page?.related || []
  const error = page?.error

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
      <p className="article-meta" suppressHydrationWarning>
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
