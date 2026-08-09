import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import BlogList from '../components/BlogList'
import { getPublishedBlogs } from '../services/blogsApi'
import { getCategories } from '../services/categoriesApi'
import { getSubcategories } from '../services/subcategoriesApi'
import { toIdMap } from '../utils/lookupMaps'

function SubcategoryPage() {
  const { categorySlug, subcategorySlug } = useParams()
  const [category, setCategory] = useState(null)
  const [subcategory, setSubcategory] = useState(null)
  const [blogs, setBlogs] = useState([])
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

        const foundCategory = categories.find(
          (item) => item.slug === categorySlug,
        )
        const foundSubcategory = allSubcategories.find(
          (item) => item.slug === subcategorySlug,
        )

        if (
          !foundCategory ||
          foundCategory.status !== 'active' ||
          !foundSubcategory ||
          foundSubcategory.status !== 'active' ||
          foundSubcategory.category_id !== foundCategory.id
        ) {
          setCategory(null)
          setSubcategory(null)
          setError('Subcategory not found')
          setBlogs([])
          return
        }

        const blogData = await getPublishedBlogs({
          category_id: foundCategory.id,
          subcategory_id: foundSubcategory.id,
        })

        setCategory(foundCategory)
        setSubcategory(foundSubcategory)
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
  }, [categorySlug, subcategorySlug])

  if (loading) {
    return (
      <section className="page-shell">
        <p className="page-intro">Loading subcategory...</p>
      </section>
    )
  }

  if (!category || !subcategory) {
    return (
      <section className="page-shell">
        <p className="page-kicker">Missing page</p>
        <h1>Subcategory not found</h1>
        <p className="page-intro">{error}</p>
        <Link className="text-link" to="/blogs">
          Back to stories
        </Link>
      </section>
    )
  }

  return (
    <section className="page-shell">
      <p className="page-kicker">
        <Link to={`/${category.slug}`}>{category.name}</Link>
        {' / Subcategory'}
      </p>
      <h1>{subcategory.name}</h1>
      <p className="page-intro">
        {subcategory.description ||
          `Published stories in ${category.name} / ${subcategory.name}.`}
      </p>

      <BlogList
        blogs={blogs}
        categoriesById={categoriesById}
        subcategoriesById={subcategoriesById}
        emptyMessage={`No published stories in ${subcategory.name} yet.`}
      />
    </section>
  )
}

export default SubcategoryPage
