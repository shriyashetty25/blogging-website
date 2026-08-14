import { Outlet, useLocation } from 'react-router-dom'
import CategorySidebar from '../components/CategorySidebar'
import Navbar from '../components/Navbar'
import SeoHead from '../components/SeoHead'
import SiteRail from '../components/SiteRail'

function MainLayout() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <div className="layout">
      {isAdmin && <SeoHead title="Admin" path={location.pathname} />}
      <Navbar />
      {isAdmin ? (
        <main className="site-main">
          <Outlet />
        </main>
      ) : (
        <div className="site-body">
          <CategorySidebar />
          <main className="site-main">
            <Outlet />
          </main>
          <SiteRail />
        </div>
      )}
    </div>
  )
}

export default MainLayout
