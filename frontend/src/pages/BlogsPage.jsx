import { Link } from 'react-router-dom'
import { dummyBlogs } from '../data/dummyBlogs'

function BlogsPage() {
  return (
    <section className="page-shell">
      <p className="page-kicker">The archive</p>
      <h1>All Stories</h1>
      <p className="page-intro">
        An editorial index of every piece on BlogSite. Dummy content for now —
        live posts arrive with FastAPI later.
      </p>

      <ul className="editorial-list">
        {dummyBlogs.map((blog) => (
          <li key={blog.id}>
            <Link to={`/blog/${blog.slug}`}>
              <img
                className="story-image"
                src={blog.image}
                alt=""
                width={280}
                height={140}
              />
            </Link>
            <div className="story-copy">
              <p className="meta">
                {blog.category} / {blog.subcategory} · {blog.publishedAt}
              </p>
              <Link className="story-title" to={`/blog/${blog.slug}`}>
                {blog.title}
              </Link>
              <p className="excerpt">{blog.excerpt}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default BlogsPage
