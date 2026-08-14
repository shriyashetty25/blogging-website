import { Link } from 'react-router-dom'
import { getListImageSrc } from '../utils/images'
import './RelatedBlogs.css'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=640&q=70'

function RelatedBlogs({ blogs }) {
  if (!blogs.length) {
    return null
  }

  return (
    <section className="related-blogs">
      <h2>Related blogs</h2>
      <ul>
        {blogs.map((blog) => (
          <li key={blog.id}>
            <Link to={`/blog/${blog.slug}`} className="related-blogs-card">
              <img
                src={getListImageSrc(
                  blog.featured_image,
                  blog.featured_image_thumb,
                  FALLBACK_IMAGE,
                )}
                alt=""
                width={220}
                height={120}
                loading="lazy"
                decoding="async"
              />
              <span>{blog.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default RelatedBlogs
