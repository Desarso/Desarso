import { useState } from 'react'
import { categories, projects } from '../lib/content'
import ProjectFeed from '../components/ProjectFeed'

const notes = [
  'Most of my projects start with "this should be quick" and then become a folder with opinions.',
  'I like backend problems that eventually force me to make a decent UI.',
  'Currently accepting fewer abstractions and more things that actually run.',
]

const tools = ['Go', 'TypeScript', 'React', 'React Native / Expo', 'Postgres', 'Rust', 'Python', 'Docker', 'Coolify']

export default function HomePage() {
  const [category, setCategory] = useState('all')
  const featured = projects.find((project) => project.featured) ?? projects[0]
  const [hovered, setHovered] = useState(featured.slug)
  const visible = category === 'all' ? projects : projects.filter((project) => project.category === category)
  const preview = projects.find((project) => project.slug === hovered) ?? featured

  return (
    <main className="site home">
      <div className="wrap g12 hi" id="projects">
        <aside className="hi-hd">
          <h1 className="hi-title">
            gabriel<span>/</span>projects
          </h1>
          <p className="hi-lead">
            I build backends, realtime sync, and the apps I run my own day on. Engineer at{' '}
            <a href="https://whagons.com/en" target="_blank" rel="noreferrer">
              Whagons
            </a>
            . These are write-ups of the projects I care about, what they do, and how they work.
          </p>
          <div className="hi-preview" aria-hidden="true">
            {projects.map((project) => (
              <img
                key={project.slug}
                className={project.slug === preview.slug ? 'on' : ''}
                src={project.cover}
                alt=""
                loading={project.slug === featured.slug ? 'eager' : 'lazy'}
              />
            ))}
          </div>
          <div className="hi-preview-cap" aria-hidden="true">
            <span>{preview.title}</span>
            <span>{preview.minutes} min read</span>
          </div>
        </aside>

        <section className="hi-list" aria-label="Projects">
          <div className="tabs-line">
            <div className="tabs" role="toolbar" aria-label="Filter projects">
              {categories.map((item) => {
                const count =
                  item.key === 'all' ? projects.length : projects.filter((project) => project.category === item.key).length
                return (
                  <button
                    type="button"
                    className="tab"
                    key={item.key}
                    aria-pressed={category === item.key}
                    onClick={() => setCategory(item.key)}
                  >
                    {item.label}
                    <span className="n">{count}</span>
                  </button>
                )
              })}
            </div>
            <span className="tabs-count">{visible.length} projects</span>
          </div>
          <ProjectFeed projects={visible} onHover={setHovered} />
        </section>
      </div>

      <div className="wrap g12 extras">
        <section className="extra-notes" aria-labelledby="notes-title">
          <h2 className="lbl" id="notes-title">
            Notes
          </h2>
          <ul>
            {notes.map((note) => (
              <li key={note}>
                <span className="br" aria-hidden="true" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="extra-tools" aria-labelledby="tools-title">
          <h2 className="lbl" id="tools-title">
            Tools I reach for
          </h2>
          <div className="chips">
            {tools.map((tool) => (
              <span className="chip" key={tool}>
                {tool}
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
