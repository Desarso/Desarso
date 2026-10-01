// Renders project covers (4:3 WebP) and social cards (1200x630 PNG) from
// covers.mjs. Not part of the site build: run it after adding or changing a
// project, then commit the images in public/.
//
//   CHROME_PATH=/usr/bin/chromium node scripts/covers/render.mjs [slug...]
import { execFileSync } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright-core'
import { covers } from './covers.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const fonts = join(root, 'node_modules/@fontsource-variable')
const asset = (path) => pathToFileURL(join(root, 'public', path)).href
const only = process.argv.slice(2)

const css = `
@font-face { font-family: Geist; src: url(${pathToFileURL(join(fonts, 'geist/files/geist-latin-wght-normal.woff2')).href}); font-weight: 100 900; }
@font-face { font-family: GeistMono; src: url(${pathToFileURL(join(fonts, 'geist-mono/files/geist-mono-latin-wght-normal.woff2')).href}); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; }
body { width: var(--w); height: var(--h); overflow: hidden; background: #e7e3d8; color: #151514; font-family: Geist; }
.c { position: relative; width: 100%; height: 100%; padding: 56px 60px; overflow: hidden; }
.k { font: 400 17px/1.3 GeistMono; letter-spacing: .04em; text-transform: uppercase; color: #74726a; }
.t { margin-top: 12px; font-size: 64px; font-weight: 500; letter-spacing: -.03em; line-height: 1.02; max-width: 12ch; }
.s { margin-top: 16px; font-size: 22px; line-height: 1.4; color: #45443f; max-width: 26ch; }
.foot { position: absolute; left: 60px; bottom: 48px; display: flex; gap: 12px; align-items: center; font: 400 15px GeistMono; color: #74726a; }
.foot svg { width: 22px; height: 22px; }
.stage { position: absolute; }
.phone { position: absolute; width: 270px; border-radius: 34px; padding: 9px; background: #151514; box-shadow: 0 30px 60px -20px rgba(21,21,20,.45); }
.phone img { display: block; width: 100%; border-radius: 26px; }
.desk { position: absolute; border-radius: 12px; overflow: hidden; background: #fffefb; border: 1px solid rgba(21,21,20,.14); box-shadow: 0 30px 70px -24px rgba(21,21,20,.42); }
.desk .bar { height: 30px; display: flex; gap: 7px; align-items: center; padding: 0 12px; border-bottom: 1px solid rgba(21,21,20,.1); background: #f3f1ec; }
.desk .bar i { width: 10px; height: 10px; border-radius: 50%; background: #cfcabd; }
.desk img { display: block; width: 100%; }
.dia { position: absolute; font-family: GeistMono; }
.box { position: absolute; padding: 14px 18px; border: 1.5px solid #151514; background: #fffefb; font: 400 17px/1.35 GeistMono; white-space: nowrap; }
.box small { display: block; margin-top: 3px; font-size: 13px; color: #74726a; }
.box.ac { border-color: #3047d0; color: #3047d0; }
.box.dark { background: #151514; color: #f0eee8; }
.box.dark small { color: #a8a59b; }
svg.wires { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
svg.wires path { fill: none; stroke: #151514; stroke-width: 1.5; }
svg.wires path.ac { stroke: #3047d0; stroke-dasharray: 5 5; }
svg.wires text { font: 400 13px GeistMono; fill: #74726a; }
`

const mark = `<svg viewBox="0 0 40 40"><g transform="translate(20 20)" fill="none" stroke="#3047d0" stroke-width="2.6"><ellipse rx="13" ry="5.8" transform="rotate(30)"/><ellipse rx="13" ry="5.8" transform="rotate(-60)"/></g></svg>`

function page(cover, w, h) {
  const scale = w / 1200
  const stage = cover.stage({ asset, w: 1200, h: Math.round(h / scale) })
  return `<!doctype html><html><head><style>${css}</style></head><body style="--w:${w}px;--h:${h}px">
  <div class="c" style="transform-origin:0 0;transform:scale(${scale});width:1200px;height:${Math.round(h / scale)}px">
    <div class="k">${cover.kicker}</div>
    <div class="t">${cover.title}</div>
    ${cover.sub ? `<div class="s">${cover.sub}</div>` : ''}
    ${stage}
    <div class="foot">${mark}<span>gabrielmalek.com</span></div>
  </div></body></html>`
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium' })
for (const cover of covers) {
  if (only.length && !only.includes(cover.slug)) continue
  for (const [kind, w, h, out] of [
    ['cover', 1200, 900, `projects/${cover.slug}/cover.png`],
    ['og', 1200, 630, `og/${cover.slug}.png`],
  ]) {
    const tab = await browser.newPage({ viewport: { width: w, height: h } })
    // Loaded from a file so the page may read fonts and screenshots from disk.
    const html = join(tmpdir(), `cover-${cover.slug}-${kind}.html`)
    await writeFile(html, page({ ...cover, stage: kind === 'og' && cover.ogStage ? cover.ogStage : cover.stage }, w, h))
    await tab.goto(pathToFileURL(html).href, { waitUntil: 'load' })
    await tab.evaluate(() => document.fonts.ready)
    const file = join(root, 'public', out)
    await mkdir(dirname(file), { recursive: true })
    await tab.screenshot({ path: file })
    await tab.close()
    await rm(html)
    if (kind === 'cover') {
      // Covers ship as WebP; ImageMagick does the conversion.
      execFileSync('magick', [file, '-quality', '86', file.replace(/\.png$/, '.webp')])
      await rm(file)
    }
  }
  console.log(`rendered ${cover.slug}`)
}
await browser.close()
