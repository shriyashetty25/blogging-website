import { Link } from 'react-router-dom'
import { dummyBlogs } from '../data/dummyBlogs'
import './HomePage.css'

function HomePage() {
  const latestBlogs = dummyBlogs.slice(0, 3)

  return (
    <section className="home">
      <header className="home-header">
        <h1 className="home-masthead">BlogSite</h1>
        <p className="home-tagline">
          A personal magazine for culture, focus, sport, and everyday life.
        </p>
      </header>

      <div className="home-latest-header">
        <h2>Latest</h2>
        <Link to="/blogs">View all</Link>
      </div>

      <ul className="editorial-list">
        {latestBlogs.map((blog) => (
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
                {blog.category} / {blog.subcategory}
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

export default HomePage
