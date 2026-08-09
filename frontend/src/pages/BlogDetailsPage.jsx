import { Link, useParams } from 'react-router-dom'
import { getBlogBySlug } from '../data/dummyBlogs'

function BlogDetailsPage() {
  const { slug } = useParams()
  const blog = getBlogBySlug(slug)

  if (!blog) {
    return (
      <section className="page-shell">
        <p className="page-kicker">Missing page</p>
        <h1>Story not found</h1>
        <p className="page-intro">
          No article matches the slug <strong>{slug}</strong>.
        </p>
        <Link className="text-link" to="/blogs">
          Back to stories
        </Link>
      </section>
    )
  }

  return (
    <article className="page-shell">
      <p className="article-meta">
        {blog.category} / {blog.subcategory} · {blog.publishedAt}
      </p>
      <h1 className="article-title">{blog.title}</h1>
      <p className="page-intro">{blog.excerpt}</p>
      <img
        className="article-hero"
        src={blog.image}
        alt=""
        width={1200}
        height={700}
      />
      <p className="article-body">{blog.content}</p>
      <Link className="text-link" to="/blogs">
        Back to stories
      </Link>
    </article>
  )
}

export default BlogDetailsPage
