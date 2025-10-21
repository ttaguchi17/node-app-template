// src/components/Sidebar.jsx
import React from 'react';
import { Nav } from 'react-bootstrap';

function Sidebar({ isToggled }) {
  
  // We add 'flex-column' to our list of classes
  const sidebarClasses = [
    'custom-sidebar',
    'flex-column', // This is the Bootstrap class for 'flex-direction: column'
    isToggled ? 'toggled' : ''
  ].join(' '); // Join them all into a single string

  return (
    // We apply the 'flex-column' class here via our className prop
    <Nav as="ul" className={sidebarClasses} id="accordionSidebar">
      
      {/* Sidebar - Brand */}
      <a className="sidebar-brand d-flex align-items-center justify-content-center" href="/dashboard">
        <div className="sidebar-brand-icon rotate-n-15">
          <i className="fas fa-plane-departure"></i>
        </div>
        <div className="sidebar-brand-text mx-3">TRAVEL APP</div>
      </a>

      {/* Divider */}
      <hr className="sidebar-divider my-0" />

      {/* Nav Item - Dashboard */}
      <Nav.Item as="li" className="active">
        <Nav.Link href="/dashboard">
          <i className="fas fa-fw fa-tachometer-alt"></i>
          <span>Dashboard</span>
        </Nav.Link>
      </Nav.Item>

      {/* Divider */}
      <hr className="sidebar-divider" />
    </Nav>
  );
}

export default Sidebar;