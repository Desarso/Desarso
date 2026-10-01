export default function ProjectFeed({ projects, onHover, showSummary = true }) {
  return (
    <div className="feed">
      {projects.map((project) => (
        <a
          className={`frow${project.featured ? ' is-featured' : ''}`}
          href={`/projects/${project.slug}`}
          key={project.slug}
          onMouseEnter={onHover ? () => onHover(project.slug) : undefined}
          onFocus={onHover ? () => onHover(project.slug) : undefined}
        >
          <span className="f-l">{project.year}</span>
          <span className="f-t">
            {project.featured && <span className="chip chip-accent">Featured</span>}
            <span className="f-name">{project.title}</span>
            {showSummary && <span className="f-std">{project.summary}</span>}
            <span className="f-sub">
              <span>{project.category}</span>
              <span>{project.stack.slice(0, 4).join(' · ')}</span>
            </span>
          </span>
          <span className={`f-d status status-${slugStatus(project.status)}`}>{project.status}</span>
        </a>
      ))}
    </div>
  )
}

function slugStatus(status = '') {
  return status.toLowerCase().replace(/[^a-z]+/g, '-')
}
