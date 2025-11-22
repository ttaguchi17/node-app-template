// src/components/Layout.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

function Layout({
  children,
  onNewTripClick,
  onRefreshClick,
  onLogoutClick,
  isSidebarToggled,
  onToggleSidebar
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // derive a simple active page key from pathname
  const getActiveKeyFromPath = (pathname) => {
    if (!pathname) return 'dashboard';
    const p = pathname.toLowerCase();
    if (p.startsWith('/calendar')) return 'calendar';
    if (p.startsWith('/budget')) return 'budget';
    if (p.startsWith('/profile')) return 'profile';
    if (p.startsWith('/settings')) return 'settings';
    if (p.startsWith('/support')) return 'support';
    return 'dashboard';
  };

  const activeKey = getActiveKeyFromPath(location.pathname);

  // Default handlers — use props if provided, otherwise fall back to these:
  const handleRefresh = (...args) => {
    if (typeof onRefreshClick === 'function') {
      try { return onRefreshClick(...args); } catch (e) { console.warn('onRefreshClick error', e); }
    }
    // default behavior: reload the page
    window.location.reload();
  };

  const handleNewTrip = (...args) => {
    if (typeof onNewTripClick === 'function') {
      try { return onNewTripClick(...args); } catch (e) { console.warn('onNewTripClick error', e); }
    }
    // default behavior: navigate to the "new trip" route
    navigate('/trips/new');
  };

  const handleLogout = (...args) => {
    if (typeof onLogoutClick === 'function') {
      try { return onLogoutClick(...args); } catch (e) { console.warn('onLogoutClick error', e); }
    }
    // default behavior: clear token and go to login
    try { localStorage.removeItem('token'); } catch (e) { /* ignore */ }
    navigate('/login');
  };

  const handleNavigate = (key) => {
    // map keys to routes
    const map = {
      dashboard: '/dashboard',
      calendar: '/calendar',
      budget: '/budget',
      profile: '/profile',
      settings: '/settings',
      support: '/support'
    };
    const to = map[key] || map.dashboard;
    navigate(to);
  };

  return (
    <div id="wrapper" style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        isToggled={!!isSidebarToggled}
        active={activeKey}
        onNavigate={handleNavigate}
        onRefresh={handleRefresh}
        onNewTrip={handleNewTrip}
        onLogout={handleLogout}
      />

      <div id="content-wrapper" className="d-flex flex-column" style={{ flex: 1 }}>
        <div id="content">
          {/* Use the <Header> component and pass handlers (defaults used when props absent) */}
          <Header
            onToggleSidebar={onToggleSidebar}
            onNewTripClick={handleNewTrip}
            onRefreshClick={handleRefresh}
            onLogoutClick={handleLogout}
          />
          <main className="container-fluid" style={{ padding: '20px 28px' }}>
             {children}
          </main>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default Layout;
