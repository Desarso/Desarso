import { Marked } from 'marked'
import { parse as parseYaml } from 'yaml'

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const stripTags = (value) => value.replace(/<[^>]+>/g, '')

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&[a-z]+;/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function splitFrontmatter(source) {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(source)
  if (!match) throw new Error('Project file is missing frontmatter')
  return { data: parseYaml(match[1]), body: match[2] }
}

// Images inside a paragraph on their own become a numbered figure. Several
// images in one paragraph become a gallery that shares one caption. A `#phone`
// suffix on the src marks a portrait phone screenshot.
function renderFigure(images, number) {
  const phone = images.some((image) => image.href.endsWith('#phone'))
  const caption = images.map((image) => image.title).filter(Boolean).join(' ')
  const body = images
    .map((image) => {
      const src = image.href.replace(/#phone$/, '')
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(image.text)}" loading="lazy" decoding="async" />`
    })
    .join('')
  const classes = ['fig', phone ? 'fig-phone' : '', images.length > 1 ? 'fig-gallery' : '']
    .filter(Boolean)
    .join(' ')
  return `<figure class="${classes}" style="--n:${images.length}"><div class="fig-media">${body}</div>${
    caption ? `<figcaption><b>Fig. ${number}</b><span>${caption}</span></figcaption>` : ''
  }</figure>`
}

function renderMarkdown(source) {
  const toc = []
  const seen = new Map()
  let figures = 0
  const marked = new Marked({ gfm: true })

  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens)
        if (depth !== 2 && depth !== 3) return `<h${depth}>${html}</h${depth}>`
        const text = stripTags(html)
        const base = slugify(text) || 'section'
        const count = seen.get(base) ?? 0
        seen.set(base, count + 1)
        const id = count ? `${base}-${count}` : base
        toc.push({ depth, id, text: text.replace(/&amp;/g, '&').replace(/&#39;/g, "'") })
        return `<h${depth} id="${id}">${html}</h${depth}>`
      },
      paragraph({ tokens }) {
        const meaningful = tokens.filter((token) => !(token.type === 'text' && !token.text.trim()) && token.type !== 'br')
        if (meaningful.length && meaningful.every((token) => token.type === 'image')) {
          figures += 1
          return renderFigure(meaningful, figures)
        }
        return `<p>${this.parser.parseInline(tokens)}</p>\n`
      },
      code({ text, lang }) {
        const label = lang ? escapeHtml(lang) : 'text'
        return `<figure class="code"><figcaption>${label}</figcaption><pre><code>${escapeHtml(text)}</code></pre></figure>\n`
      },
      table(token) {
        const head = token.header
          .map((cell) => `<th>${this.parser.parseInline(cell.tokens)}</th>`)
          .join('')
        const rows = token.rows
          .map((row) => `<tr>${row.map((cell) => `<td>${this.parser.parseInline(cell.tokens)}</td>`).join('')}</tr>`)
          .join('')
        return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>\n`
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens)
        const external = /^https?:\/\//.test(href)
        const attrs = external ? ' target="_blank" rel="noreferrer"' : ''
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : ''
        return `<a href="${escapeHtml(href)}"${titleAttr}${attrs}>${text}</a>`
      },
    },
  })

  const html = marked.parse(source)
  return { html, toc }
}

function readingMinutes(body) {
  const words = body
    .replace(/```[\s\S]*?```/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / 230))
}


// Vite plugin: a project .md file imports as its metadata, and `file.md?body`
// imports as compiled HTML plus the table of contents. Compiling here keeps the
// markdown and YAML parsers out of the browser bundle, and each article body
// becomes its own chunk.
export default function projectContent() {
  return {
    name: 'project-content',
    enforce: 'pre',
    transform(code, id) {
      const [file, query = ''] = id.split('?')
      if (!file.endsWith('.md') || !file.includes('/content/projects/')) return null
      const { data, body } = splitFrontmatter(code)
      if (query === 'body') {
        const { html, toc } = renderMarkdown(body)
        return { code: `export default ${JSON.stringify({ html, toc })}`, map: null }
      }
      const meta = { ...data, minutes: readingMinutes(body) }
      return { code: `export const meta = ${JSON.stringify(meta)}`, map: null }
    },
  }
}

