import { getProject, loadBody } from './content'

// Resolves a path to a page, loading the article body for project pages so
// both the prerender and the client hydrate from the same data.
export async function loadRoute(pathname) {
  const route = resolveRoute(pathname)
  if (route.name === 'project') route.body = await loadBody(route.project)
  return route
}

function resolveRoute(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return { name: 'home' }
  const match = /^\/projects\/([a-z0-9-]+)$/.exec(path)
  if (match) {
    const project = getProject(match[1])
    if (project) return { name: 'project', project }
  }
  return { name: 'not-found' }
}
