// src/components/Layout.jsx
import React from 'react';
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
  return (
    <div id="wrapper">
      <Sidebar isToggled={isSidebarToggled} />

      <div id="content-wrapper" className="d-flex flex-column">
        <div id="content">
          {/* Use the <Header> component */}
          <Header
            onToggleSidebar={onToggleSidebar}
            onNewTripClick={onNewTripClick}
            onRefreshClick={onRefreshClick}
            onLogoutClick={onLogoutClick}
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