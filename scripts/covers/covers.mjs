// Cover definitions. `stage` returns the HTML placed on a 1200px-wide card;
// `asset(path)` resolves a file in public/. Screenshots are real captures made
// against demo data; diagrams are drawn here.

const phones = (images, { x = 600, y = 120, gap = 36, tilt = 0 } = {}) => ({ asset }) =>
  images
    .map(
      (src, index) =>
        `<div class="phone" style="left:${x + index * (270 + gap)}px;top:${y + (index % 2) * 60}px;transform:rotate(${tilt * (index - (images.length - 1) / 2)}deg)"><img src="${asset(src)}"></div>`,
    )
    .join('')

const desktop = (src, { x = 560, y = 150, width = 820 } = {}) => ({ asset }) =>
  `<div class="desk" style="left:${x}px;top:${y}px;width:${width}px"><div class="bar"><i></i><i></i><i></i></div><img src="${asset(src)}"></div>`

// Boxes are anchored by their horizontal center so wires can target one x.
const box = (cx, y, label, note = '', cls = '') =>
  `<div class="box ${cls}" style="left:${cx}px;top:${y}px;transform:translateX(-50%)">${label}${note ? `<small>${note}</small>` : ''}</div>`

const wires = (paths) =>
  `<svg class="wires">${paths.map(([d, cls = '', label]) => `<path class="${cls}" d="${d}"/>${label ?? ''}`).join('')}</svg>`

export const covers = [
  {
    slug: 'gonvex',
    kicker: 'Open source · Realtime backend',
    title: 'Gonvex',
    sub: 'A Convex-style backend on Postgres. Rust runtime, TypeScript in V8.',
    stage: () =>
      `<div class="dia" style="inset:0">
        ${wires([
          ['M800 196 V 262', 'ac'],
          ['M800 330 V 396'],
          ['M720 464 C 680 520 640 540 640 590'],
          ['M880 464 C 920 520 960 540 960 590'],
        ])}
        ${box(800, 140, 'useReplicaCollection(api.tasks)', 'React · IndexedDB / SQLite replica')}
        ${box(800, 270, 'WebSocket', 'committed transactions', 'ac')}
        ${box(800, 400, 'Rust runtime', 'auth · tenants · change feed', 'dark')}
        ${box(640, 596, 'V8 module host', 'TypeScript functions')}
        ${box(960, 596, 'Postgres', 'db per tenant')}
      </div>`,
  },
  {
    slug: 'life-os',
    kicker: 'App I use · Web + Android',
    title: 'Life OS',
    sub: 'Every device logs one event store. An AI coach reads it.',
    stage: (ctx) =>
      desktop('projects/life-os/dashboard-today.webp', { x: 500, y: 110, width: 800 })(ctx) +
      desktop('projects/life-os/dashboard-coach.webp', { x: 400, y: 470, width: 640 })(ctx),
  },
  {
    slug: 'life-tube',
    kicker: 'App I use · Web + Android',
    title: 'Life Tube',
    sub: 'Only videos an LLM vetted against my goals.',
    stage: desktop('projects/life-tube/tube-grid.webp', { x: 520, y: 150, width: 820 }),
  },
  {
    slug: 'liftledger',
    kicker: 'App I use · iOS / Android',
    title: 'LiftLedger',
    sub: 'Workout logging, progression and a smart scale, on my phone.',
    stage: phones(['projects/liftledger/home.webp', 'projects/liftledger/active.webp'], { x: 590, y: 90 }),
  },
  {
    slug: 'uni',
    kicker: 'App I use · Web',
    title: 'Uni',
    sub: 'Interactive courses written on demand, one lesson a day.',
    stage: (ctx) =>
      desktop('projects/uni/lesson-plot-desktop.webp', { x: 520, y: 120, width: 760 })(ctx) +
      phones(['projects/uni/lesson-icons-phone.webp'], { x: 440, y: 330 })(ctx),
  },
  {
    slug: 'captains-logs',
    kicker: 'App I use · Web + mobile',
    title: "Captain's Logs",
    sub: 'A video journal that records offline and files itself into Immich.',
    stage: phones(['projects/captains-logs/library-mobile.webp', 'projects/captains-logs/recording-active-mobile.webp'], { x: 590, y: 90 }),
  },
  {
    slug: 'lakecivic',
    kicker: 'Product · Web + mobile',
    title: 'LakeCivic',
    sub: 'Software for HOAs and neighborhood associations.',
    stage: (ctx) =>
      desktop('projects/lakecivic/dashboard-households.webp', { x: 500, y: 120, width: 800 })(ctx) +
      phones(['projects/lakecivic/dashboard-phone.webp'], { x: 420, y: 360 })(ctx),
  },
  {
    slug: 'mandelbrot',
    kicker: 'Open source · WebGPU',
    title: 'Mandelbrot WebGPU',
    sub: 'Arbitrary-precision deep zoom, computed on the GPU.',
    stage: (ctx) =>
      desktop('projects/mandelbrot/desktop-seahorse-valley.webp', { x: 470, y: 130, width: 860 })(ctx),
  },
  {
    slug: 'remote-desktop',
    kicker: 'Home lab · Go + C',
    title: 'Archbox Connect',
    sub: 'A Linux desktop in a container, streamed over one HTTPS tunnel.',
    stage: () =>
      `<div class="dia" style="inset:0">
        ${wires([
          ['M770 196 V 262'],
          ['M770 330 V 396', 'ac'],
          ['M770 464 V 530'],
        ])}
        ${box(800, 140, 'Moonlight → localhost', 'any laptop, no VPN')}
        ${box(800, 270, 'archbox-connect', 'chisel client · TCP + UDP')}
        ${box(800, 400, 'HTTPS / WebSocket', 'the only open path', 'ac')}
        ${box(800, 536, 'Sunshine + Hyprland', 'LXC container', 'dark')}
        ${box(980, 660, 'evdev-bridge', '/dev/input → Wayland')}
        ${wires([['M800 604 C 800 650 860 680 900 682']])}
      </div>`,
  },
  {
    slug: 'sprinkler',
    kicker: 'Home lab · Web + hardware',
    title: 'Sprinkler Controller',
    sub: 'Irrigation zones on a schedule, driven over a tiny HTTP API.',
    stage: (ctx) =>
      desktop('projects/sprinkler/dashboard-desktop.webp', { x: 500, y: 130, width: 800 })(ctx) +
      phones(['projects/sprinkler/dashboard-mobile.webp'], { x: 420, y: 360 })(ctx),
  },
  {
    slug: 'godantic',
    kicker: 'Open source · Go',
    title: 'Godantic',
    sub: 'LLM agents in Go, with sessions that talk both ways.',
    stage: () =>
      `<div class="dia" style="inset:0">
        ${wires([
          ['M800 196 V 262', 'ac'],
          ['M800 330 V 396'],
          ['M720 464 C 680 520 640 540 640 590'],
          ['M880 464 C 920 520 960 540 960 590'],
        ])}
        ${box(800, 140, 'Browser', 'tools · traces · audio')}
        ${box(800, 270, 'AgentSession', 'WebSocket · SSE · HTTP', 'ac')}
        ${box(800, 400, 'Agent loop', 'typed Go tools', 'dark')}
        ${box(640, 596, 'Model adapters', 'Gemini · Anthropic · …')}
        ${box(960, 596, 'MessageStore', 'Postgres · SQLite')}
      </div>`,
  },
  {
    slug: 'pageup',
    kicker: 'Open source · Go CLI',
    title: 'Pageup',
    sub: 'Local HTML to an unlisted URL, in one signed request.',
    stage: () =>
      `<div class="desk" style="left:500px;top:220px;width:700px;background:#151514;border-color:#151514">
        <div class="bar" style="background:#1f1f1d;border-color:#2a2a27"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div>
        <pre style="margin:0;padding:28px 30px;font:400 21px/1.75 GeistMono;color:#e9e6de"><span style="color:#6fcf97">$</span> pageup report.html
<span style="color:#8d9bff">https://pages.example.com/0192f6c1-7a3e…</span>

<span style="color:#6fcf97">$</span> pageup ./site
<span style="color:#8d9bff">https://pages.example.com/0192f6c4-91b0…</span>

<span style="color:#6fcf97">$</span> pageup keys list
<span style="color:#a8a59b">laptop    admin   ed25519</span>
<span style="color:#a8a59b">desktop   upload  ed25519</span></pre></div>`,
  },
]
