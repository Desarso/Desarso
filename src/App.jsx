import HomePage from './pages/HomePage'
import ProjectPage from './pages/ProjectPage'
import NotFoundPage from './pages/NotFoundPage'
import SiteHeader from './components/SiteHeader'
import SiteFooter from './components/SiteFooter'

export default function App({ route }) {
  return (
    <>
      <SiteHeader />
      {route.name === 'home' && <HomePage />}
      {route.name === 'project' && <ProjectPage project={route.project} body={route.body} />}
      {route.name === 'not-found' && <NotFoundPage />}
      <SiteFooter />
    </>
  )
}
