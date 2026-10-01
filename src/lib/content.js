const metas = import.meta.glob('../content/projects/*.md', { eager: true, import: 'meta' })
const bodies = import.meta.glob('../content/projects/*.md', { query: '?body', import: 'default' })

const slugOf = (path) => path.split('/').pop().replace(/\.md$/, '')

export const projects = Object.entries(metas)
  .map(([path, meta]) => ({
    ...meta,
    slug: meta.slug ?? slugOf(path),
    stack: meta.stack ?? [],
    links: meta.links ?? [],
    path,
  }))
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))

export const categories = [
  { key: 'all', label: 'All' },
  ...[...new Set(projects.map((project) => project.category))].map((label) => ({ key: label, label })),
]

export function getProject(slug) {
  return projects.find((project) => project.slug === slug)
}

export function loadBody(project) {
  return bodies[project.path]()
}
