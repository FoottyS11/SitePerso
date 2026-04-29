import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <>
      <div className="grid-bg" />
      <div className="scan-overlay" />
      <div className="app-shell">
        <Header />
        <Sidebar />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </>
  )
}
