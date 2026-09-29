// Serves the frontend with server-side rendering.
//   node server.js                 development (Vite, hot reload)
//   node server.js --prod          production (run `npm run build` first)
//   node server.js --port 3000     use a different port
import fs from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

const root = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const isProd = args.includes('--prod')
const portArg = args.indexOf('--port')
const port = Number(portArg >= 0 ? args[portArg + 1] : process.env.PORT || 5173)
const apiUrl = process.env.API_URL || 'http://127.0.0.1:8000'

const app = express()
app.disable('x-powered-by')
const server = http.createServer(app)

for (const file of ['/sitemap.xml', '/robots.txt']) {
  app.get(file, async (req, res) => {
    try {
      const response = await fetch(`${apiUrl}${file}`)
      res
        .status(response.status)
        .type(response.headers.get('content-type') || 'text/plain')
        .send(await response.text())
    } catch {
      res.status(502).type('text/plain').send('Backend is not running.')
    }
  })
}

let vite
let prodTemplate
let prodRender

if (isProd) {
  const clientDir = path.join(root, 'dist/client')
  app.use(
    '/assets',
    express.static(path.join(clientDir, 'assets'), { immutable: true, maxAge: '1y' }),
  )
  app.use(express.static(clientDir, { index: false }))
  prodTemplate = await fs.readFile(path.join(clientDir, 'index.html'), 'utf-8')
  prodRender = (await import('./dist/server/entry-server.js')).render
} else {
  const { createServer } = await import('vite')
  vite = await createServer({
    root,
    appType: 'custom',
    server: { middlewareMode: true, hmr: { server } },
  })
  app.use(vite.middlewares)
}

// Stylesheets used by the rendered page, so it is styled without JavaScript.
// (In production the built index.html already links the CSS file.)
function devCssLinks() {
  const entry = vite.moduleGraph.getModuleById(path.join(root, 'src/entry-server.jsx'))
  const seen = new Set()
  const links = new Set()
  const walk = (mod) => {
    if (!mod || seen.has(mod)) return
    seen.add(mod)
    if (/\.css($|\?)/.test(mod.url)) links.add(mod.url)
    mod.importedModules.forEach(walk)
  }
  walk(entry)
  return [...links]
    .map((url) => `<link rel="stylesheet" href="${url}" data-ssr-dev-css />`)
    .join('\n    ')
}

function serializeData(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

function clientOnlyPage(template) {
  return template
    .replace('<!--app-head-->', '<title>BlogSite</title>')
    .replace('<!--app-html-->', '')
    .replace('<!--app-data-->', '')
}

app.use(async (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next()
  const url = req.originalUrl
  const pathname = url.split('?')[0]
  if (/\.(js|mjs|css|map|json|ico|png|jpe?g|gif|svg|webp|woff2?|txt|xml)$/i.test(pathname)) {
    return next()
  }

  let template = prodTemplate
  try {
    let render = prodRender
    if (vite) {
      template = await fs.readFile(path.join(root, 'index.html'), 'utf-8')
      template = await vite.transformIndexHtml(url, template)
      render = (await vite.ssrLoadModule('/src/entry-server.jsx')).render
    }

    // Admin pages depend on the browser login, so they render in the browser.
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      res.status(200).type('html').send(clientOnlyPage(template))
      return
    }

    const { html, head, data, status } = await render(url)
    const headTags = vite ? `${head}\n    ${devCssLinks()}` : head
    const page = template
      .replace('<!--app-head-->', headTags)
      .replace('<!--app-html-->', html)
      .replace(
        '<!--app-data-->',
        `<script>window.__INITIAL_DATA__ = ${serializeData(data)}</script>`,
      )
    res.status(status).type('html').send(page)
  } catch (error) {
    vite?.ssrFixStacktrace(error)
    console.error(error)
    if (template) {
      // Fall back to a browser-rendered page so the site still works.
      res.status(200).type('html').send(clientOnlyPage(template))
    } else {
      next(error)
    }
  }
})

server.listen(port, 'localhost', () => {
  console.log(`  Local:   http://localhost:${port}/`)
})
