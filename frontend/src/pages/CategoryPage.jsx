import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import BlogList from '../components/BlogList'
import SeoHead from '../components/SeoHead'
import { getPublishedBlogs } from '../services/blogsApi'
import { getCategories } from '../services/categoriesApi'
import { getSubcategories } from '../services/subcategoriesApi'
import { toIdMap } from '../utils/lookupMaps'

function CategoryPage() {
  const { categorySlug } = useParams()
  const [category, setCategory] = useState(null)
  const [blogs, setBlogs] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [categoriesById, setCategoriesById] = useState({})
  const [subcategoriesById, setSubcategoriesById] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [categories, allSubcategories] = await Promise.all([
          getCategories(),
          getSubcategories(),
        ])

        const found = categories.find((item) => item.slug === categorySlug)
        if (!found || found.status !== 'active') {
          setCategory(null)
          setError('Category not found')
          setBlogs([])
          setSubcategories([])
          return
        }

        const categorySubs = allSubcategories.filter(
          (item) => item.category_id === found.id && item.status === 'active',
        )
        const blogData = await getPublishedBlogs({ category_id: found.id })

        setCategory(found)
        setSubcategories(categorySubs)
        setBlogs(blogData)
        setCategoriesById(toIdMap(categories))
        setSubcategoriesById(toIdMap(allSubcategories))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [categorySlug])

  if (loading) {
    return (
      <section className="page-shell">
        <p className="page-intro">Loading category...</p>
      </section>
    )
  }

  if (!category) {
    return (
      <section className="page-shell">
        <p className="page-kicker">Missing page</p>
        <h1>Category not found</h1>
        <p className="page-intro">{error}</p>
        <Link className="text-link" to="/blogs">
          Back to stories
        </Link>
      </section>
    )
  }

  return (
    <section className="page-shell">
      <SeoHead
        title={category.name}
        description={
          category.description || `Published stories in ${category.name}.`
        }
        path={`/${category.slug}`}
      />
      <p className="page-kicker">Category</p>
      <h1>{category.name}</h1>
      <p className="page-intro">
        {category.description || `Published stories in ${category.name}.`}
      </p>

      {subcategories.length > 0 && (
        <div className="topic-links">
          {subcategories.map((subcategory) => (
            <Link
              key={subcategory.id}
              to={`/${category.slug}/${subcategory.slug}`}
            >
              {subcategory.name}
            </Link>
          ))}
        </div>
      )}

      <BlogList
        blogs={blogs}
        categoriesById={categoriesById}
        subcategoriesById={subcategoriesById}
        emptyMessage={`No published stories in ${category.name} yet.`}
      />
    </section>
  )
}

export default CategoryPage
