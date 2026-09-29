import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { getCategories } from '../services/categoriesApi'
import { getSubcategories } from '../services/subcategoriesApi'
import { useInitialData } from '../ssr/InitialDataContext'
import './CategorySidebar.css'

function onlyActive(items) {
  return (items || []).filter((item) => item.status === 'active')
}

function categorySlugFromPath(pathname) {
  const segment = pathname.split('/').filter(Boolean)[0]
  if (
    !segment ||
    segment === 'blogs' ||
    segment === 'blog' ||
    segment === 'admin'
  ) {
    return null
  }
  return segment
}

function CategorySidebar() {
  const location = useLocation()
  const initial = useInitialData()
  const hasPreloaded = Boolean(initial.categories && initial.subcategories)
  const [categories, setCategories] = useState(() => onlyActive(initial.categories))
  const [subcategories, setSubcategories] = useState(() =>
    onlyActive(initial.subcategories),
  )
  const [openSlug, setOpenSlug] = useState(() =>
    categorySlugFromPath(location.pathname),
  )

  useEffect(() => {
    if (hasPreloaded) {
      return
    }

    async function load() {
      try {
        const [categoryData, subcategoryData] = await Promise.all([
          getCategories(),
          getSubcategories(),
        ])
        setCategories(onlyActive(categoryData))
        setSubcategories(onlyActive(subcategoryData))
      } catch {
        setCategories([])
        setSubcategories([])
      }
    }

    load()
  }, [hasPreloaded])

  const activeCategorySlug = useMemo(
    () => categorySlugFromPath(location.pathname),
    [location.pathname],
  )

  useEffect(() => {
    if (activeCategorySlug) {
      setOpenSlug(activeCategorySlug)
    }
  }, [activeCategorySlug])

  function toggleCategory(slug) {
    setOpenSlug((current) => (current === slug ? null : slug))
  }

  return (
    <aside className="category-sidebar" aria-label="Categories">
      <p className="category-sidebar-kicker">Topics</p>
      <ul className="category-sidebar-list">
        {categories.map((category) => {
          const isOpen = openSlug === category.slug
          const children = subcategories.filter(
            (item) => item.category_id === category.id,
          )

          return (
            <li key={category.id}>
              <button
                type="button"
                className={
                  isOpen
                    ? 'category-sidebar-toggle is-open'
                    : 'category-sidebar-toggle'
                }
                aria-expanded={isOpen}
                onClick={() => toggleCategory(category.slug)}
              >
                {category.name}
              </button>

              {isOpen && (
                <ul className="category-sidebar-subs">
                  <li>
                    <NavLink to={`/${category.slug}`} end>
                      All {category.name}
                    </NavLink>
                  </li>
                  {children.map((subcategory) => (
                    <li key={subcategory.id}>
                      <NavLink
                        to={`/${category.slug}/${subcategory.slug}`}
                      >
                        {subcategory.name}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
      <NavLink className="category-sidebar-all" to="/blogs">
        All stories
      </NavLink>
    </aside>
  )
}

export default CategorySidebar
