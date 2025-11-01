// src/components/Layout.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx'; // Changed from Topbar
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

  return (
    <div id="wrapper">
      <Sidebar isToggled={isSidebarToggled} />

      <div id="content-wrapper" className="d-flex flex-column">
        <div id="content">
          {/* Use the <Header> component and pass handlers (defaults used when props absent) */}
          <Header
            onToggleSidebar={onToggleSidebar}
            onNewTripClick={handleNewTrip}
            onRefreshClick={handleRefresh}
            onLogoutClick={handleLogout}
          />
          <div className="container-fluid">
             {children}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default Layout;
