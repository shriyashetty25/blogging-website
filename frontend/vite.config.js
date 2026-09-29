import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// The dev/prod server is server.js (server-side rendering); it also forwards
// /sitemap.xml and /robots.txt to the backend.
export default defineConfig({
  plugins: [react()],
})
