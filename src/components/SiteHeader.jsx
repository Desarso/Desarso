import Mark from './Mark'

export default function SiteHeader() {
  return (
    <header className="site-nav">
      <div className="wrap site-nav-in">
        <a className="brand" href="/">
          <Mark size={26} />
          <span>Gabriel Malek</span>
        </a>
        <nav aria-label="Site">
          <a href="/#projects">Projects</a>
          <a href="https://github.com/Desarso" target="_blank" rel="noreferrer">
            GitHub <span className="ext" aria-hidden="true">↗</span>
          </a>
        </nav>
      </div>
    </header>
  )
}
