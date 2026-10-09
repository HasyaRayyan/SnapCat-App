import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Plus, User, LogOut, Cat } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { useAnimals } from '../../hooks/useAnimals'
import './Layout.css'

export default function AppLayout() {
  const { signOut, user } = useAuth()
  const { profile } = useProfile()
  const { animals } = useAnimals()

  const displayName = profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'Kawan'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo-wrap">
            <Cat size={20} color="#ffffff" strokeWidth={1.75} />
          </div>
          <div className="brand-text-col">
            <span className="brand-text">StrayCat</span>
            <span className="brand-subtext">Cat Collector</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Menu Utama</div>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
            {animals.length > 0 && <span className="nav-badge">{animals.length}</span>}
          </NavLink>
          <NavLink to="/add" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <div className="nav-add-icon">
              <Plus size={18} />
            </div>
            <span>Tambah Kucing</span>
            <span className="nav-badge-new">Baru</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <User size={20} />
            <span>Profil Saya</span>
          </NavLink>
        </nav>

        {/* Sidebar Footer User Widget */}
        <div className="sidebar-footer">
          <div className="user-mini-card">
            <div className="user-avatar-circle">{initial}</div>
            <div className="user-text-col">
              <span className="user-name-text">{displayName}</span>
              <span className="user-role-text">Pecinta Kucing</span>
            </div>
            <button
              type="button"
              className="user-logout-icon-btn"
              onClick={signOut}
              title="Keluar dari akun"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Mobile Floating Bottom Navigation */}
      <nav className="mobile-nav-dock">
        <NavLink to="/dashboard" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={22} />
          <span>Dashboard</span>
          <div className="mobile-active-dot" />
        </NavLink>

        {/* Floating Center Action Button */}
        <NavLink to="/add" className="mobile-fab-center" aria-label="Tambah Kucing Baru">
          <div className="fab-inner-button">
            <Plus size={26} strokeWidth={2.5} />
          </div>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <User size={22} />
          <span>Profil</span>
          <div className="mobile-active-dot" />
        </NavLink>
      </nav>
    </div>
  )
}
