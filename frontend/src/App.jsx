import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import BlogsPage from './pages/BlogsPage'
import BlogDetailsPage from './pages/BlogDetailsPage'
import AdminPage from './pages/AdminPage'
import CategoriesPage from './pages/admin/CategoriesPage'
import SubcategoriesPage from './pages/admin/SubcategoriesPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="blogs" element={<BlogsPage />} />
          <Route path="blog/:slug" element={<BlogDetailsPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="admin/categories" element={<CategoriesPage />} />
          <Route path="admin/subcategories" element={<SubcategoriesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
