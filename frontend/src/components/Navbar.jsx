import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { getNavbarCategories } from '../services/blogsApi'
import { useInitialData } from '../ssr/InitialDataContext'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const preloaded = useInitialData().navbar
  const [query, setQuery] = useState('')
  const [topCategories, setTopCategories] = useState(preloaded || [])

  useEffect(() => {
    let ignore = false

    async function loadNavbar() {
      try {
        const items = await getNavbarCategories()
        if (!ignore) {
          setTopCategories(items)
        }
      } catch {
        if (!ignore) {
          setTopCategories([])
        }
      }
    }

    loadNavbar()
    return () => {
      ignore = true
    }
  }, [location.pathname])

  function handleSearch(event) {
    event.preventDefault()
    const nextQuery = query.trim()
    navigate(nextQuery ? `/blogs?q=${encodeURIComponent(nextQuery)}` : '/blogs')
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-mark" end>
          BlogSite
        </NavLink>

        <nav className="navbar-links" aria-label="Primary">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/blogs">Blogs</NavLink>
          {topCategories.map((category) => (
            <NavLink key={category.slug} to={`/${category.slug}`}>
              {category.name}
            </NavLink>
          ))}
          <NavLink to="/admin">Admin</NavLink>
        </nav>

        <form
          className="navbar-search"
          action="/blogs"
          method="get"
          onSubmit={handleSearch}
        >
          <input
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            aria-label="Search blogs"
          />
        </form>
      </div>
    </header>
  )
}

export default Navbar
