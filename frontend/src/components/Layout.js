import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdBanner from './AdBanner';

export default function Layout({ isAdmin, isManager }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const studentLinks = [
    { to: '/', icon: '🏠', label: 'Dashboard' },
    { to: '/select-test', icon: '📝', label: 'Start Test' },
    { to: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
    { to: '/profile', icon: '👤', label: 'My Profile' },
  ];

  const adminLinks = [
    { to: '/admin', icon: '📊', label: 'Dashboard' },
    { to: '/admin/questions', icon: '❓', label: 'Questions' },
    { to: '/admin/upload', icon: '📤', label: 'Upload Questions' },
    { to: '/admin/users', icon: '👥', label: 'Manage Users' },
    { to: '/admin/reports', icon: '📋', label: 'Reports' },
  ];

  const managerLinks = [
    { to: '/manager', icon: '📊', label: 'Rankings Dashboard' },
  ];

  const getLinks = () => {
    if (isAdmin) return adminLinks;
    if (isManager) return managerLinks;
    return studentLinks;
  };

  const getTitle = () => {
    if (isAdmin) return '⚙️ Admin Panel';
    if (isManager) return '📊 Manager Panel';
    return '🎓 Krishna Classes';
  };

  const getSectionTitle = () => {
    if (isAdmin) return 'Admin Panel';
    if (isManager) return 'Manager Panel';
    return 'Navigation';
  };

  const links = getLinks();

  return (
    <div className="main-layout">
      {/* Overlay for mobile */}
      <div className={`overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${isAdmin ? 'admin-layout' : ''}`}>
        <div className="sidebar-header">
          <img
            src="/logo192.png"
            alt="Krishna Classes"
            className="sidebar-logo"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div className="sidebar-brand">Krishna Classes</div>
          <div className="sidebar-tagline">Keep You Step Ahead</div>
        </div>

        {user && (
          <div className="sidebar-user-card">
            <div className="sidebar-user-name">
              {user.role === 'admin' ? '⚙️' : user.role === 'manager' ? '📊' : '🎓'} {user.name}
            </div>
            <div className="sidebar-user-class">
              {user.role === 'manager'
                ? '📊 Manager'
                : user.role === 'admin'
                ? '⚙️ Admin'
                : `Class ${user.className} • ${user.language === 'hindi' ? 'हिंदी' : 'English'}`
              }
            </div>
            {user.role === 'student' && (
              <div className="sidebar-user-score">
                ⭐ Score: {user.totalScore || 0} | Tests: {user.totalTests || 0}
              </div>
            )}
            {user.schoolName && (
              <div className="sidebar-user-score">
                🏫 {user.schoolName}
              </div>
            )}
          </div>
        )}

        <nav className="sidebar-nav">
          <div className="nav-section-title">{getSectionTitle()}</div>
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/' || link.to === '/admin' || link.to === '/manager'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-item-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}

          {/* Show admin panel link to admin users on student layout */}
          {user?.role === 'admin' && !isAdmin && (
            <>
              <div className="nav-section-title">Admin</div>
              <NavLink to="/admin" className="nav-item" onClick={() => setSidebarOpen(false)}>
                <span className="nav-item-icon">⚙️</span> Admin Panel
              </NavLink>
            </>
          )}

          <div className="nav-section-title">Account</div>
          <div
            className="nav-item"
            onClick={handleLogout}
            style={{ cursor: 'pointer', color: '#ff6b6b' }}
          >
            <span className="nav-item-icon">🚪</span> Logout
          </div>
        </nav>

        {/* Ad in sidebar */}
        <div style={{ padding: '12px' }}>
          <AdBanner slot="sidebar" style={{ minHeight: '60px', fontSize: '0.75rem' }} />
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {/* Topbar */}
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <span className="topbar-title">{getTitle()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user?.role === 'manager' && (
              <span style={{
                background: 'linear-gradient(135deg, var(--gold), #a07010)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                📊 Manager
              </span>
            )}
          </div>
        </div>

        {/* Top ad banner */}
        <div style={{ padding: '12px 24px 0' }}>
          <AdBanner slot="top-banner" />
        </div>

        <Outlet />
      </main>
    </div>
  );
}