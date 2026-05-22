import { useSyncExternalStore } from 'react'
import thinkingCircle from '../assets/thinking-circle.svg'
import './App.css'

const projects = [
  {
    slug: 'gonvex',
    name: 'Gonvex',
    repo: 'https://github.com/Desarso/gonvex',
    description:
      'A realtime backend experiment built around a Go runtime, TypeScript CLI, generated bindings, React hooks, Postgres, and WebSockets.',
    reference: {
      label: 'Convex docs',
      href: 'https://docs.convex.dev/home',
    },
    sections: [
      {
        heading: 'What Convex gets right',
        paragraphs: [
          'Convex is different from a typical backend stack. The backend lives in a `convex/` directory inside the app, functions are defined as TypeScript queries, mutations, and actions, and the frontend calls them through a generated API object.',
          'The important feature is that queries are subscriptions. In React, `useQuery` subscribes to a Convex query and rerenders when the underlying database data changes. The Convex client keeps a WebSocket open to the deployment, so new query results can be pushed to the browser without polling.',
          'Convex also maintains consistency across query results. If multiple components depend on related data, the client updates them against the same database snapshot rather than rendering half-updated state.',
        ],
      },
      {
        heading: 'The development loop',
        paragraphs: [
          '`npx convex dev` watches the local filesystem. When a function or schema changes, Convex typechecks the code, updates the generated files in `convex/_generated`, uploads the backend code to the development deployment, and makes the new functions available through the generated API.',
          'That is a large part of the velocity. In development, editing a backend file is enough to live-edit the backend code running behind the dev version of the app. The function is saved, auto-synced into the dev deployment by the Convex dev server, reflected in generated TypeScript types, and callable from React without manually adding routes or maintaining a separate client SDK.',
          'A teammate can be using the dev version of the site while the backend behind that same dev deployment changes in real time. The feedback loop is not just local hot reload; the backend runtime serving the dev app is being updated as the code changes.',
          'Schemas follow a similar workflow. Convex pushes schema changes from `schema.ts`, validates existing documents against the new schema, and fails the push if existing data does not match. After that, future inserts and updates are validated at runtime.',
          'This is useful for LLM-assisted development because the backend API, database types, and frontend call sites are all close together. The generated types give the agent concrete boundaries instead of relying on guessed request shapes.',
        ],
      },
      {
        heading: 'Why it exists',
        paragraphs: [
          'Gonvex starts from that development model, then changes the tradeoffs. The biggest difference is SQL: Gonvex is designed around Postgres and arbitrary SQL requests, which means it cannot have the same fully tight query invalidation model as Convex. Precise invalidation for arbitrary SQL is a hard problem.',
          'The goal is to keep the fast app-development loop: backend functions near the app, generated frontend bindings, React hooks, and realtime updates, while allowing backend code and data access patterns that look more like a conventional SQL-backed service.',
        ],
      },
      {
        heading: 'Where Convex does not fit everything',
        paragraphs: [
          'Convex document queries are intentionally not SQL. The docs describe joins, aggregations, and group-by operations as logic written in JavaScript over documents, usually with indexes and explicit reads. That model works well for many application queries, but it is not the same as having arbitrary SQL available.',
          'For systems that need complex relational queries, reporting workloads, existing SQL patterns, operational analytics, or direct Postgres access, that constraint matters. Convex gives a productive abstraction, but some projects need the database to remain a general SQL database rather than only the storage layer behind a platform API.',
          'There is also the TypeScript-centered backend model. TypeScript is productive, and Convex uses it well, but not every backend runtime, deployment model, or server-side system should be tied to it. Some backend problems fit Go better: long-running services, concurrency-heavy work, infrastructure code, and systems where the runtime itself matters.',
        ],
      },
      {
        heading: 'What it is',
        paragraphs: [
          'Gonvex lets backend functions be written in Go while still generating TypeScript and React bindings for the frontend. The frontend gets a typed API surface; the backend stays compiled Go code.',
          'The current workspace has a Go runtime server, a TypeScript npm CLI, React bindings, shared protocol types, app templates, docs, and a dashboard used as an integration harness. The CLI watches app-local Go files, generates bindings, and syncs manifests to the runtime.',
          'The intended shape is close to Convex at the developer-experience layer: write backend code near the app, keep the frontend API generated, and keep the feedback loop fast. The runtime and database choices are different.',
        ],
      },
      {
        heading: 'Why Go is the middle ground',
        paragraphs: [
          'Go gives Gonvex a middle ground between generated frontend ergonomics and a conventional compiled backend. The frontend can still get generated TypeScript and React bindings, but the backend code compiles into a fast binary with compile-time error checking.',
          'Because Go compiles quickly, the development loop can still be close to the Convex style: edit backend code, let the watcher rebuild, regenerate bindings, and continue from the frontend. The difference is that the backend runtime is Go instead of TypeScript.',
          'That feedback loop is useful with LLMs as well. Generated bindings and compiler errors give the agent immediate feedback when it wires something incorrectly, while the backend remains a real compiled service.',
        ],
      },
      {
        heading: 'Open source shape',
        paragraphs: [
          'Another difference is that multi-tenant and multi-project support are planned directly in the open source version. The local and open-source version should include the core platform shape, not just a minimal demo.',
          'The goal is not to clone Convex feature-for-feature. The goal is to keep the useful parts: backend functions, generated client APIs, React hooks, and realtime app plumbing, while making different choices around SQL, Go, and how much of the platform is available in the open.',
        ],
      },
    ],
  },
  {
    slug: 'godantic',
    name: 'Godantic',
    repo: 'https://github.com/Desarso/godantic-',
    description:
      'A Go agent framework for streaming AI apps, designed around first-class WebSockets, reasoning, execution traces, and faster request paths.',
    reference: {
      label: 'Pydantic AI',
      href: 'https://github.com/pydantic/pydantic-ai',
    },
    sections: [
      {
        heading: 'Why it exists',
        paragraphs: [
          'Godantic came from the flexibility of Pydantic AI, then from the places where that model was not flexible enough for browser-based agent interfaces.',
          'The main requirement was first-class WebSocket support for bidirectional browser communication. Not just streaming text back to a client, but a session that can keep talking: tool updates, reasoning, execution traces, user prompts, approvals, and state changes moving both ways.',
        ],
      },
      {
        heading: 'What it is',
        paragraphs: [
          'Godantic is a Go framework for AI agent sessions. It handles chat interactions, tools, HTTP flows, WebSocket sessions, streaming responses, persistence, and model integration behind a cleaner application-level API.',
          'It treats agent work as something observable. Reasoning content and execution traces are not afterthoughts; they are part of the contract between the backend and the interface.',
        ],
      },
      {
        heading: 'Why Go',
        paragraphs: [
          'The other reason is speed. Pydantic AI is productive, but the request path can be slower than ideal for highly interactive agent UIs. Godantic moves the core session and transport layer into Go so the hot path can be tighter and more predictable.',
          'The point is not just to port an idea. It is to make agent apps that feel live, debuggable, and responsive from the browser all the way down to tool execution.',
        ],
      },
    ],
  },
]

const tools = ['Go', 'Python', 'React', 'TypeScript', 'Postgres', 'Docker', 'Expo']

function subscribe(callback) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

function getHash() {
  return window.location.hash.replace(/^#/, '')
}

function App() {
  const hash = useSyncExternalStore(subscribe, getHash, () => '')
  const project = projects.find((item) => hash === `/projects/${item.slug}`)

  if (project) {
    return <ProjectPage project={project} />
  }

  return <HomePage />
}

function HomePage() {
  return (
    <main className="page">
      <section className="card intro" aria-labelledby="intro-title">
        <img className="thinking" src={thinkingCircle} alt="Thinking circle" />

        <p className="kicker">gabriel malek</p>
        <h1 id="intro-title">Beep boop</h1>

        <p className="working-on">
          work at
          <img src="https://whagons.com/favicon.svg" alt="" />
          <a href="https://whagons.com/en" target="_blank" rel="noreferrer">
            Whagons
          </a>
        </p>
      </section>

      <section className="section" aria-labelledby="open-source-title">
        <h2 id="open-source-title">Open Source</h2>
        <div className="project-list">
          {projects.map((project) => (
            <a className="project" href={`#/projects/${project.slug}`} key={project.name}>
              <span>{project.name}</span>
              <p>{project.description}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="section notes" aria-labelledby="notes-title">
        <h2 id="notes-title">Notes</h2>
        <ul>
          <li>Most of my projects start with "this should be quick" and then become a folder with opinions.</li>
          <li>I like backend problems that eventually force me to make a decent UI.</li>
          <li>Currently accepting fewer abstractions and more things that actually run.</li>
        </ul>
      </section>

      <section className="section" aria-labelledby="tools-title">
        <h2 id="tools-title">Tools</h2>
        <div className="tools" aria-label="Tools">
          {tools.map((tool) => (
            <span key={tool}>{tool}</span>
          ))}
        </div>
      </section>

      <footer className="footer" />
    </main>
  )
}

function ProjectPage({ project }) {
  return (
    <main className="page project-page">
      <a className="back-link" href="#/">
        Back
      </a>

      <section className="card intro project-hero" aria-labelledby="project-title">
        <p className="kicker">Project</p>
        <h1 id="project-title">{project.name}</h1>
        <p className="project-lede">{project.description}</p>
      </section>

      <section className="section project-body" aria-label={`${project.name} description`}>
        {project.reference ? (
          <p className="project-reference">
            Reference point:{' '}
            <a href={project.reference.href} target="_blank" rel="noreferrer">
              {project.reference.label}
            </a>
          </p>
        ) : null}
        {project.sections.map((section) => (
          <article className="article-section" key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>
        ))}
      </section>

      <footer className="footer project-actions">
        <a href={project.repo} target="_blank" rel="noreferrer">
          Open repo
        </a>
      </footer>
    </main>
  )
}

export default App
