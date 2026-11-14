import { Link, NavLink, Outlet } from 'react-router-dom'
import { MOCK_MODE } from '../api'

export function Layout() {
  return (
    <>
      <header className="shell-header">
        <div className="shell-header-inner">
          <Link to="/" className="brand">
            Site Finder
          </Link>
          <nav className="shell-nav">
            {MOCK_MODE && <span className="mock-pill" title="VITE_API_BASE is not set">Mock data</span>}
            <NavLink to="/" end>
              Search
            </NavLink>
            <NavLink to="/watchlist">Watchlist</NavLink>
          </nav>
        </div>
      </header>
      <main className="shell-main">
        <Outlet />
      </main>
    </>
  )
}
