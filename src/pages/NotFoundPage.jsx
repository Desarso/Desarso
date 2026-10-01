export default function NotFoundPage() {
  return (
    <main className="site nf">
      <div className="wrap">
        <p className="lbl">404</p>
        <h1>This page wandered off.</h1>
        <p className="nf-lead">The project you were looking for is not here. Maybe it is still a folder with opinions.</p>
        <a className="btn" href="/">
          Back to projects
        </a>
      </div>
    </main>
  )
}
