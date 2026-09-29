import {
  getBlogBySlug,
  getNavbarCategories,
  getPopularBlogs,
  getPublishedBlogs,
} from '../services/blogsApi'
import { getCategories } from '../services/categoriesApi'
import { getSettings } from '../services/settingsApi'
import { getSubcategories } from '../services/subcategoriesApi'
import { toIdMap } from '../utils/lookupMaps'

// Data shared by every public page: settings, menu, sidebar and rail.
// A value of null means "not loaded"; the component then fetches it itself.
export async function loadLayoutData() {
  const results = await Promise.allSettled([
    getSettings(),
    getNavbarCategories(),
    getCategories(),
    getSubcategories(),
    getPublishedBlogs(),
    getPopularBlogs(6),
  ])
  const valueAt = (index) =>
    results[index].status === 'fulfilled' ? results[index].value : null

  return {
    settings: valueAt(0),
    navbar: valueAt(1),
    categories: valueAt(2),
    subcategories: valueAt(3),
    latestBlogs: valueAt(4),
    popularBlogs: valueAt(5),
  }
}

export async function loadBlogPage(slug) {
  try {
    const [blog, categories, subcategories] = await Promise.all([
      getBlogBySlug(slug),
      getCategories(),
      getSubcategories(),
    ])

    if (blog.status !== 'PUBLISHED') {
      return { slug, blog: null, error: 'This story is not published.' }
    }

    const published = await getPublishedBlogs({ category_id: blog.category_id })
    const others = published.filter((item) => item.id !== blog.id)
    const sameSub = others.filter(
      (item) => item.subcategory_id === blog.subcategory_id,
    )
    const sameCategory = others.filter(
      (item) => item.subcategory_id !== blog.subcategory_id,
    )

    return {
      slug,
      blog,
      category: toIdMap(categories)[blog.category_id] || null,
      subcategory: toIdMap(subcategories)[blog.subcategory_id] || null,
      related: [...sameSub, ...sameCategory].slice(0, 3),
      error: null,
    }
  } catch (err) {
    return { slug, blog: null, error: err.message || 'Story not found' }
  }
}
