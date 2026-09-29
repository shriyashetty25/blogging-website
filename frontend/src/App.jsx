import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { InitialDataProvider } from './ssr/InitialDataContext'
import { SettingsProvider } from './context/SettingsContext'
import ProtectedRoute from './components/ProtectedRoute'
import GoogleAnalytics from './components/GoogleAnalytics'
import PageViewTracker from './components/PageViewTracker'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import BlogsPage from './pages/BlogsPage'
import BlogDetailsPage from './pages/BlogDetailsPage'
import CategoryPage from './pages/CategoryPage'
import SubcategoryPage from './pages/SubcategoryPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/admin/LoginPage'
import CategoriesPage from './pages/admin/CategoriesPage'
import SubcategoriesPage from './pages/admin/SubcategoriesPage'
import AdminBlogsPage from './pages/admin/AdminBlogsPage'
import AdminBlogFormPage from './pages/admin/AdminBlogFormPage'
import TagsPage from './pages/admin/TagsPage'
import MediaPage from './pages/admin/MediaPage'
import SeoSettingsPage from './pages/admin/SeoSettingsPage'
import AnalyticsPage from './pages/admin/AnalyticsPage'
import './App.css'

// The router is supplied by the caller: BrowserRouter in the browser
// (main.jsx), StaticRouter on the server (entry-server.jsx).
function App({ initialData }) {
  return (
    <InitialDataProvider value={initialData}>
      <AuthProvider>
        <SettingsProvider>
          <GoogleAnalytics />
          <PageViewTracker />
          <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="blogs" element={<BlogsPage />} />
            <Route path="blog/:slug" element={<BlogDetailsPage />} />
            <Route path="admin/login" element={<LoginPage />} />

            <Route
              path="admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/seo"
              element={
                <ProtectedRoute>
                  <SeoSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/categories"
              element={
                <ProtectedRoute>
                  <CategoriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/subcategories"
              element={
                <ProtectedRoute>
                  <SubcategoriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/tags"
              element={
                <ProtectedRoute>
                  <TagsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/media"
              element={
                <ProtectedRoute>
                  <MediaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/blogs"
              element={
                <ProtectedRoute>
                  <AdminBlogsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="admin/blogs/new"
              element={
                <ProtectedRoute>
                  <AdminBlogFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/blogs/:id/edit"
              element={
                <ProtectedRoute>
                  <AdminBlogFormPage />
                </ProtectedRoute>
              }
            />

            <Route path=":categorySlug" element={<CategoryPage />} />
            <Route
              path=":categorySlug/:subcategorySlug"
              element={<SubcategoryPage />}
            />
          </Route>
        </Routes>
        </SettingsProvider>
      </AuthProvider>
    </InitialDataProvider>
  )
}

export default App
