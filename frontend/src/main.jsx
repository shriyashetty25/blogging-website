import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const container = document.getElementById('root')
const initialData = window.__INITIAL_DATA__

const app = (
  <StrictMode>
    <BrowserRouter>
      <App initialData={initialData} />
    </BrowserRouter>
  </StrictMode>
)

if (initialData) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}

// In dev, the server adds <link> tags so the page is styled without
// JavaScript. Vite's own <style> tags have taken over by now.
document.querySelectorAll('link[data-ssr-dev-css]').forEach((link) => link.remove())
