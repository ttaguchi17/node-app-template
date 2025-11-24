// src/components/Header.jsx
import React from 'react';
import { Navbar, Nav, Button } from 'react-bootstrap'; 
import NotificationsBell from './NotificationsBell.jsx'; // Ensure this path is correct

// 1. ADD 'user' and 'pageTitle' to the props list
function Header({ onToggleSidebar, onNewTripClick, onRefreshClick, onLogoutClick, user, pageTitle = 'Dashboard' }) {
  return (
    <Navbar bg="white" expand className="topbar mb-4 static-top shadow">
      
      {/* Mobile Sidebar Toggle Button */}
      <Button 
        variant="link" 
        className="d-md-none rounded-circle me-3" 
        onClick={onToggleSidebar} 
      >
        <i className="fa fa-bars"></i>
      </Button>

      {/* Page Title */}
      <Navbar.Brand href="#home" className="h5 mb-0 text-gray-800">
        {pageTitle}
      </Navbar.Brand>

      {/* Nav container. 'ms-auto' pushes it to the right. */}
      <Nav className="ms-auto align-items-center">
        
        {/* --- NOTIFICATIONS BELL --- */}
        {/* Only show if user is logged in (token exists or user object is present) */}
        <Nav.Item className="mx-1">
             <NotificationsBell />
        </Nav.Item>
        {/* -------------------------- */}

        <Nav.Item className="mx-1">
          <Button variant="primary" size="sm" onClick={onRefreshClick}>
            <i className="fas fa-sync-alt me-1"></i> Refresh
          </Button>
        </Nav.Item>

        <Nav.Item className="mx-1">
          <Button variant="success" size="sm" onClick={onNewTripClick}>
            <i className="fas fa-plus me-1"></i> New Trip
          </Button>
        </Nav.Item>

        <Nav.Item className="mx-1">
          <Button variant="danger" size="sm" onClick={onLogoutClick}>
            <i className="fas fa-sign-out-alt me-1"></i> Log Out
          </Button>
        </Nav.Item>

      </Nav>
    </Navbar>
  );
}

export default Header;