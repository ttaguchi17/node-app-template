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
    if (p.includes('/budget')) return 'budget';
    if (p.startsWith('/profile')) return 'profile';
    if (p.startsWith('/settings')) return 'settings';
    if (p.startsWith('/support')) return 'support';
    return 'dashboard';
  };

  // Get page title based on pathname
  const getPageTitle = (pathname) => {
    if (!pathname) return 'Dashboard';
    const p = pathname.toLowerCase();
    if (p.startsWith('/calendar')) return 'Calendar';
    if (p === '/budget') return 'Budget Overview';
    if (p.includes('/budget')) return 'Trip Budget';
    if (p.startsWith('/profile')) return 'Profile';
    if (p.startsWith('/settings')) return 'Settings';
    if (p.startsWith('/support')) return 'Support';
    if (p.startsWith('/trips/') && p !== '/trips/new') return 'Trip Details';
    if (p === '/trips/new') return 'New Trip';
    if (p === '/dashboard' || p === '/') return 'Dashboard';
    return 'Dashboard';
  };

  const activeKey = getActiveKeyFromPath(location.pathname);
  const pageTitle = getPageTitle(location.pathname);

  // Default handlers — use props if provided, otherwise fall back to these:
  const handleRefresh = (...args) => {
    if (typeof onRefreshClick === 'function') {
      try { return onRefreshClick(...args); } catch (e) { console.warn('onRefreshClick error', e); }
    }
    window.location.reload();
  };

  const handleNewTrip = (...args) => {
    if (typeof onNewTripClick === 'function') {
      try { return onNewTripClick(...args); } catch (e) { console.warn('onNewTripClick error', e); }
    }
    navigate('/trips/new');
  };

  const handleLogout = (...args) => {
    if (typeof onLogoutClick === 'function') {
      try { return onLogoutClick(...args); } catch (e) { console.warn('onLogoutClick error', e); }
    }
    try { localStorage.removeItem('token'); } catch (e) { /* ignore */ }
    navigate('/login');
  };

  const handleNavigate = (key) => {
    // Extract tripId from current path if we're on a trip page
    const tripIdMatch = location.pathname.match(/\/trips\/(\d+)/);
    const currentTripId = tripIdMatch ? tripIdMatch[1] : null;
    
    // --- SMART NAVIGATION LOGIC ---
    if (key === 'budget') {
      if (currentTripId) {
        // Case A: User is inside a specific trip -> Go to THAT trip's budget
        navigate(`/trips/${currentTripId}/budget`);
      } else {
        // Case B: User is on Dashboard/Calendar -> Go to Global Budget Summary
        navigate('/budget');
      }
      return; // Stop here, don't run the map below
    }

    // Standard route mapping
    const map = {
      dashboard: '/dashboard',
      calendar: '/calendar',
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
          <Header 
            onToggleSidebar={onToggleSidebar}
            onNewTripClick={handleNewTrip}
            onRefreshClick={handleRefresh}
            onLogoutClick={handleLogout}
            pageTitle={pageTitle}
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