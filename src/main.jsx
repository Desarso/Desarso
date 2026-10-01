import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import './styles.css'
import App from './App'
import { loadRoute } from './lib/routes'

// Links from the old hash-routed site (#/projects/gonvex) still land somewhere.
const legacy = /^#\/projects\/([a-z0-9-]+)/.exec(window.location.hash)
if (legacy) window.location.replace(`/projects/${legacy[1]}`)

const root = document.getElementById('root')
const route = await loadRoute(window.location.pathname)
const app = (
  <StrictMode>
    <App route={route} />
  </StrictMode>
)

if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
