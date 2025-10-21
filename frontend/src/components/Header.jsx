// src/components/Header.jsx
import React from 'react';
import { Navbar, Nav, Button } from 'react-bootstrap'; // Import React-Bootstrap components

// Accept functions as props from the parent (Layout.jsx)
function Header({ onToggleSidebar, onNewTripClick, onRefreshClick, onLogoutClick }) {
  return (
    // Use <Navbar> component. Apply Bootstrap props (bg, expand) and
    // our own custom class names from the old HTML.
    <Navbar bg="white" expand className="topbar mb-4 static-top shadow">
      
      {/* Mobile Sidebar Toggle Button */}
      <Button 
        variant="link" // 'variant="link"' makes it look like a link
        className="d-md-none rounded-circle me-3" // 'd-md-none' hides it on desktop
        onClick={onToggleSidebar} // Use the prop for the click handler
      >
        <i className="fa fa-bars"></i> {/* Font Awesome icon */}
      </Button>

      {/* Page Title */}
      <Navbar.Brand href="#home" className="h5 mb-0 text-gray-800">
        My Trips
      </Navbar.Brand>

      {/* Nav container. 'ms-auto' pushes it to the right. */}
      <Nav className="ms-auto">
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