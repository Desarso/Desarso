// Renders every route to static HTML after `vite build`, so each project page
// ships real content, its own title and its own social card.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const server = await import(pathToFileURL(join(root, 'dist-ssr', 'entry-server.js')).href)
const template = await readFile(join(dist, 'index.html'), 'utf8')

const pages = []
for (const url of server.routes()) {
  const { html, head } = await server.render(url === '/404' ? '/this-page-does-not-exist' : url)
  const page = template.replace('<!--app-head-->', head).replace('<!--app-html-->', html)
  const file = url === '/' ? 'index.html' : url === '/404' ? '404.html' : join(url.slice(1), 'index.html')
  await mkdir(dirname(join(dist, file)), { recursive: true })
  await writeFile(join(dist, file), page)
  if (url !== '/404') pages.push(url)
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((url) => `  <url><loc>${server.SITE}${url}</loc></url>`).join('\n')}
</urlset>
`
await writeFile(join(dist, 'sitemap.xml'), sitemap)
await writeFile(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${server.SITE}/sitemap.xml\n`)
await rm(join(root, 'dist-ssr'), { recursive: true, force: true })
console.log(`prerendered ${pages.length + 1} pages`)
