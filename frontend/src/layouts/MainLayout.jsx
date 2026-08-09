import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

function MainLayout() {
  return (
    <div className="layout">
      <Navbar />
      <main className="site-main">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
