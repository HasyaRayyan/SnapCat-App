import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, User, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import './Layout.css'

export default function AppLayout() {
  const { signOut } = useAuth()

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">🐾</span>
          <span className="brand-text">StrayDex</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/add" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <PlusCircle size={20} />
            <span>Tambah Anabul</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <User size={20} />
            <span>Profil</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="nav-link logout-btn" onClick={signOut}>
            <LogOut size={20} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav className="mobile-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={22} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/add" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
          <PlusCircle size={22} />
          <span>Tambah</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
          <User size={22} />
          <span>Profil</span>
        </NavLink>
      </nav>
    </div>
  )
}
