import { renderToString } from 'react-dom/server'
import { matchPath } from 'react-router-dom'
import { StaticRouter } from 'react-router-dom/server'
import './index.css'
import App from './App.jsx'
import { HeadContext, buildHead, renderHeadTags } from './seo/head'
import { loadBlogPage, loadLayoutData } from './ssr/loaders'

export async function render(url) {
  const pathname = new URL(url, 'http://localhost').pathname
  const data = await loadLayoutData()
  let status = 200

  const blogMatch = matchPath('/blog/:slug', pathname)
  if (blogMatch) {
    data.blogPage = await loadBlogPage(blogMatch.params.slug)
    if (!data.blogPage.blog) {
      status = 404
    }
  }

  const collector = {}
  const html = renderToString(
    <HeadContext.Provider value={collector}>
      <StaticRouter location={url}>
        <App initialData={data} />
      </StaticRouter>
    </HeadContext.Provider>,
  )

  const head = collector.head || buildHead(data.settings, { path: pathname })

  return { html, head: renderHeadTags(head), data, status }
}
