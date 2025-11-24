import React from 'react';
import { Navbar, Nav, Button } from 'react-bootstrap'; 
import NotificationsBell from './NotificationsBell.jsx'; // Ensure this path is correct

// Header: simplified topbar (removed the "My Trips" title)
// Props: onToggleSidebar, onNewTripClick, onRefreshClick, onLogoutClick, user
function Header({ onToggleSidebar, onNewTripClick, onRefreshClick, onLogoutClick, user }) {
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

      {/* NOTE: Removed the static "My Trips" brand/title to keep the top bar clean. */}

      {/* Nav container. 'ms-auto' pushes it to the right. */}
      <Nav className="ms-auto align-items-center">
        {/* --- NOTIFICATIONS BELL --- */}
        {user && (
          <Nav.Item className="mx-1">
            <NotificationsBell />
          </Nav.Item>
        )}

        {/* Optional action buttons: only render if handlers are provided to avoid duplicate UI
            (This keeps the header flexible — Dashboard can choose not to pass these props.) */}
        {typeof onRefreshClick === 'function' && (
          <Nav.Item className="mx-1">
            <Button variant="primary" size="sm" onClick={onRefreshClick}>
              <i className="fas fa-sync-alt me-1"></i> Refresh
            </Button>
          </Nav.Item>
        )}

        {typeof onNewTripClick === 'function' && (
          <Nav.Item className="mx-1">
            <Button variant="success" size="sm" onClick={onNewTripClick}>
              <i className="fas fa-plus me-1"></i> New Trip
            </Button>
          </Nav.Item>
        )}

        {typeof onLogoutClick === 'function' && (
          <Nav.Item className="mx-1">
            <Button variant="danger" size="sm" onClick={onLogoutClick}>
              <i className="fas fa-sign-out-alt me-1"></i> Log Out
            </Button>
          </Nav.Item>
        )}
      </Nav>
    </Navbar>
  );
}

export default Header;
