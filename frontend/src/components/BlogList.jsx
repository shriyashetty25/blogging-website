import { Link } from 'react-router-dom'
import { formatDate } from '../utils/formatDate'
import { getListImageSrc } from '../utils/images'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=640&q=70'

function BlogList({
  blogs,
  categoriesById = {},
  subcategoriesById = {},
  emptyMessage = 'No published stories yet.',
}) {
  if (!blogs.length) {
    return <p className="page-intro">{emptyMessage}</p>
  }

  return (
    <ul className="editorial-list">
      {blogs.map((blog) => {
        const category = categoriesById[blog.category_id]
        const subcategory = subcategoriesById[blog.subcategory_id]
        const categoryName = category?.name || 'Category'
        const subcategoryName = subcategory?.name || 'Subcategory'
        const image = getListImageSrc(
          blog.featured_image,
          blog.featured_image_thumb,
          FALLBACK_IMAGE,
        )

        return (
          <li key={blog.id}>
            <Link to={`/blog/${blog.slug}`}>
              <img
                className="story-image"
                src={image}
                alt=""
                width={280}
                height={140}
                loading="lazy"
                decoding="async"
              />
            </Link>
            <div className="story-copy">
              <p className="meta">
                {category?.slug ? (
                  <Link to={`/${category.slug}`}>{categoryName}</Link>
                ) : (
                  categoryName
                )}
                {' / '}
                {category?.slug && subcategory?.slug ? (
                  <Link to={`/${category.slug}/${subcategory.slug}`}>
                    {subcategoryName}
                  </Link>
                ) : (
                  subcategoryName
                )}
                {blog.published_at ? ` · ${formatDate(blog.published_at)}` : ''}
              </p>
              <Link className="story-title" to={`/blog/${blog.slug}`}>
                {blog.title}
              </Link>
              {blog.excerpt && <p className="excerpt">{blog.excerpt}</p>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default BlogList
