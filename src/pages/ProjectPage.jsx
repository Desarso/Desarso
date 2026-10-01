import { useEffect, useMemo, useRef, useState } from 'react'
import { projects } from '../lib/content'
import ProjectFeed from '../components/ProjectFeed'

export default function ProjectPage({ project, body }) {
  const { html, toc } = body
  const groups = useMemo(() => groupToc(toc), [toc])
  const { active, progress, pastHero } = useReadingState(toc)
  const others = projects.filter((item) => item.slug !== project.slug)
  const primaryLink = project.live ?? project.links[0]

  return (
    <main className="site art">
      <div className="top-prog" style={{ width: `${progress}%` }} aria-hidden="true" />
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <a href="/#projects">projects</a>
          <span aria-hidden="true">/</span>
          <span>{project.slug}</span>
        </nav>

        <header className="art-hero g12">
          <div className="art-cover">
            <img src={project.cover} alt={project.coverAlt ?? ''} fetchPriority="high" />
          </div>
          <div className="art-hd">
            <span className="chip">{project.category}</span>
            <h1 id="art-title">{project.title}</h1>
            <p className="standfirst">{project.standfirst}</p>
            <dl className="art-meta">
              <div>
                <dt className="lbl">Year</dt>
                <dd>
                  <span className="br" aria-hidden="true" />
                  {project.year}
                </dd>
              </div>
              <div>
                <dt className="lbl">Status</dt>
                <dd>
                  <span className="br" aria-hidden="true" />
                  {project.status}
                </dd>
              </div>
              <div>
                <dt className="lbl">Reading</dt>
                <dd>
                  <span className="br" aria-hidden="true" />
                  {project.minutes} min
                </dd>
              </div>
              <div>
                <dt className="lbl">Source</dt>
                <dd>
                  <span className="br" aria-hidden="true" />
                  {project.source ? (
                    <a href={project.source} target="_blank" rel="noreferrer">
                      {project.sourceLabel ?? 'GitHub'} <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    'Private repo'
                  )}
                </dd>
              </div>
            </dl>
            {(project.live || project.source) && (
              <div className="art-acts">
                {project.live && (
                  <a className="btn" href={project.live.href} target="_blank" rel="noreferrer">
                    {project.live.label} <span aria-hidden="true">↗</span>
                  </a>
                )}
                {project.source && (
                  <a className="tlink" href={project.source} target="_blank" rel="noreferrer">
                    Source on GitHub <span className="arr">→</span>
                  </a>
                )}
              </div>
            )}
            <div className="art-stack" aria-label="Stack">
              {project.stack.map((item) => (
                <span className="chip" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </header>

        <div className="body-grid g12">
          <aside className="rail" aria-label="Contents">
            <p className={`rail-title${pastHero ? ' on' : ''}`}>{project.title}</p>
            <div className="lbl th">Contents</div>
            <nav className="rail-tree">
              {groups.map((group) => {
                const open = group.item.id === active || group.subs.some((sub) => sub.id === active)
                return (
                  <div key={group.item.id}>
                    <a href={`#${group.item.id}`} className={group.item.id === active ? 'on' : ''}>
                      <span className="br" aria-hidden="true" />
                      <span>{group.item.text}</span>
                    </a>
                    {group.subs.length > 0 && (
                      <div className={`subs${open ? ' open' : ''}`}>
                        <div>
                          {group.subs.map((sub) => (
                            <a href={`#${sub.id}`} className={`sub${sub.id === active ? ' on' : ''}`} key={sub.id}>
                              <span className="br" aria-hidden="true" />
                              <span>{sub.text}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
            <div className="prog" aria-hidden="true">
              <div className="prog-bar">
                <b style={{ width: `${progress}%` }} />
              </div>
              <span className="pct">{String(Math.round(progress)).padStart(2, '0')}%</span>
            </div>
            {project.links.length > 0 && (
              <div className="rail-links">
                <div className="lbl th">Links</div>
                {project.links.map((link) => (
                  <a href={link.href} target="_blank" rel="noreferrer" key={link.href}>
                    <span className="br" aria-hidden="true" />
                    <span>
                      {link.label} <span aria-hidden="true">↗</span>
                    </span>
                  </a>
                ))}
              </div>
            )}
          </aside>

          <article className="prose" aria-labelledby="art-title">
            <div dangerouslySetInnerHTML={{ __html: html }} />
            <div className="art-end">
              <div className="lbl">{project.status}</div>
              <p className="art-end-title">{project.endTitle ?? `Where ${project.title} is now`}</p>
              <p>{project.endText ?? project.summary}</p>
              <div className="acts">
                {primaryLink && (
                  <a className="btn" href={primaryLink.href} target="_blank" rel="noreferrer">
                    {primaryLink.label} <span aria-hidden="true">↗</span>
                  </a>
                )}
                {project.source && (
                  <a className="tlink" href={project.source} target="_blank" rel="noreferrer">
                    Source <span className="arr">→</span>
                  </a>
                )}
                <a className="tlink" href="/#projects">
                  All projects <span className="arr">→</span>
                </a>
              </div>
            </div>
          </article>
        </div>

        <section className="more-sec" aria-labelledby="more-title">
          <h2 className="rel-lbl" id="more-title">
            More projects
          </h2>
          <ProjectFeed projects={others} showSummary={false} />
        </section>
      </div>
    </main>
  )
}

function groupToc(toc) {
  const groups = []
  for (const item of toc) {
    if (item.depth === 2 || groups.length === 0) groups.push({ item, subs: [] })
    else groups[groups.length - 1].subs.push(item)
  }
  return groups
}

function useReadingState(toc) {
  const [state, setState] = useState({ active: toc[0]?.id, progress: 0, pastHero: false })
  const frame = useRef(0)

  useEffect(() => {
    const headings = toc.map((item) => document.getElementById(item.id)).filter(Boolean)
    const article = document.querySelector('.prose')
    const title = document.getElementById('art-title')

    const update = () => {
      frame.current = 0
      const offset = window.innerHeight * 0.3
      let active = headings[0]?.id
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top - offset <= 0) active = heading.id
      }
      const rect = article.getBoundingClientRect()
      const total = rect.height - window.innerHeight * 0.6
      const progress = Math.min(100, Math.max(0, (-rect.top + window.innerHeight * 0.2) / Math.max(total, 1) * 100))
      const pastHero = title ? title.getBoundingClientRect().bottom < 0 : false
      setState((prev) =>
        prev.active === active && Math.abs(prev.progress - progress) < 0.5 && prev.pastHero === pastHero
          ? prev
          : { active, progress, pastHero },
      )
    }
    const onScroll = () => {
      if (!frame.current) frame.current = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame.current)
    }
  }, [toc])

  return state
}
