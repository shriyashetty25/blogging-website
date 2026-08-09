import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

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
          <NavLink to="/admin">Admin</NavLink>
        </nav>

        <form className="navbar-search" onSubmit={handleSearch}>
          <input
            type="search"
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
