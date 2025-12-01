// src/components/Header.jsx
import React from 'react';
import { Navbar, Nav, Button } from 'react-bootstrap';
import NotificationsBell from './NotificationsBell.jsx'; // ✅ The bell icon component

// Header: top navigation bar with notifications bell and actions
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

      {/* Nav items aligned to the right */}
      <Nav className="ms-auto align-items-center">
        {/* 🔔 Notifications Bell (always visible if logged in) */}
        <Nav.Item className="mx-2">
          <NotificationsBell />
        </Nav.Item>

        {/* Refresh Button */}
        <Nav.Item className="mx-1">
          <Button variant="primary" size="sm" onClick={onRefreshClick}>
            <i className="fas fa-sync-alt me-1"></i> Refresh
          </Button>
        </Nav.Item>

        {/* New Trip Button */}
        <Nav.Item className="mx-1">
          <Button variant="success" size="sm" onClick={onNewTripClick}>
            <i className="fas fa-plus me-1"></i> New Trip
          </Button>
        </Nav.Item>

        {/* Log Out Button */}
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
