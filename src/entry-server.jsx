import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App'
import { loadRoute } from './lib/routes'
import { projects } from './lib/content'

export const SITE = 'https://gabrielmalek.com'

export function routes() {
  return ['/', ...projects.map((project) => `/projects/${project.slug}`), '/404']
}

const escape = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

export async function render(url) {
  const route = await loadRoute(url)
  const html = renderToString(
    <StrictMode>
      <App route={route} />
    </StrictMode>,
  )

  let title = 'Gabriel Malek | Projects'
  let description =
    'Gabriel Malek builds backends, realtime sync and the apps he runs his own day on. Write-ups of Gonvex, Life OS, LiftLedger, Uni and more.'
  let image = `${SITE}/og/home.png`
  let type = 'website'
  if (route.name === 'project') {
    title = `${route.project.title} | Gabriel Malek`
    description = route.project.standfirst
    image = `${SITE}/og/${route.project.slug}.png`
    type = 'article'
  }
  if (route.name === 'not-found') title = 'Not found | Gabriel Malek'

  const canonical = route.name === 'not-found' ? null : `${SITE}${url === '/' ? '/' : url}`
  const head = [
    `<title>${escape(title)}</title>`,
    `<meta name="description" content="${escape(description)}" />`,
    canonical ? `<link rel="canonical" href="${canonical}" />` : '<meta name="robots" content="noindex" />',
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:title" content="${escape(title)}" />`,
    `<meta property="og:description" content="${escape(description)}" />`,
    canonical ? `<meta property="og:url" content="${canonical}" />` : '',
    `<meta property="og:image" content="${image}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ]
    .filter(Boolean)
    .join('\n    ')

  return { html, head }
}
