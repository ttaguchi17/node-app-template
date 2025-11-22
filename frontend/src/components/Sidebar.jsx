// src/components/Sidebar.jsx
import React from 'react';
import { Nav, Button } from 'react-bootstrap';
import voyagoLogo from '../assets/voyagologo.png'; // make sure this file exists at src/assets/voyagologo.png

export default function Sidebar({
  active = 'dashboard',
  isToggled = false,
  onNavigate = () => {},
  onRefresh = () => {},
  onNewTrip = () => {},
  onLogout = () => {}
}) {
  // Inline styles (no external CSS)
  const container = {
    width: 240,
    minHeight: '100vh',
    padding: '28px 18px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    background: 'linear-gradient(180deg, #6f6be6 0%, #6ea9e8 100%)',
    color: '#fff',
    boxSizing: 'border-box',
    boxShadow: 'inset -8px 0 24px rgba(0,0,0,0.04)'
  };

  const logoBox = {
    width: 84,
    height: 84,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(4,8,25,0.06)'
  };

  const brandText = {
    fontWeight: 700,
    fontSize: 20,
    marginTop: 8,
    letterSpacing: 0.6,
    textAlign: 'center'
  };

  const navWrap = {
    width: '100%',
    marginTop: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    alignItems: 'stretch'
  };

  const navItemBase = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    borderRadius: 10,
    cursor: 'pointer',
    userSelect: 'none'
  };

  const navIcon = {
    minWidth: 28,
    height: 28,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    background: 'rgba(255,255,255,0.06)'
  };

  const footer = {
    marginTop: 'auto',
    fontSize: 12,
    opacity: 0.95,
    textAlign: 'center',
    width: '100%'
  };

  const btnSmall = {
    width: '100%',
    padding: '6px 10px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600
  };

  const item = (id) => ({
    ...navItemBase,
    background: active === id ? 'rgba(255,255,255,0.12)' : 'transparent',
    color: '#fff'
  });

  return (
    <aside style={container}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={logoBox}>
          <img
            src={voyagoLogo}
            alt="Voyago logo"
            style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 10 }}
          />
        </div>
        <div style={brandText}>VOYAGO</div>
      </div>

      <div style={navWrap}>
        <div style={item('dashboard')} onClick={() => onNavigate('dashboard')}>
          <div style={navIcon}>🏠</div>
          <div style={{ flex: 1 }}>Dashboard</div>
        </div>

        <div style={item('calendar')} onClick={() => onNavigate('calendar')}>
          <div style={navIcon}>📅</div>
          <div style={{ flex: 1 }}>Calendar</div>
        </div>

        <div style={item('budget')} onClick={() => onNavigate('budget')}>
          <div style={navIcon}>💲</div>
          <div style={{ flex: 1 }}>Budget</div>
        </div>

        <div style={item('profile')} onClick={() => onNavigate('profile')}>
          <div style={navIcon}>👤</div>
          <div style={{ flex: 1 }}>Profile</div>
        </div>

        <div style={item('settings')} onClick={() => onNavigate('settings')}>
          <div style={navIcon}>⚙️</div>
          <div style={{ flex: 1 }}>Settings</div>
        </div>

        <div style={item('support')} onClick={() => onNavigate('support')}>
          <div style={navIcon}>❓</div>
          <div style={{ flex: 1 }}>Support</div>
        </div>

        {/* Quick action buttons inside sidebar */}
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Button variant="light" size="sm" style={btnSmall} onClick={onRefresh}>🔁 Refresh</Button>
          <Button variant="light" size="sm" style={btnSmall} onClick={onNewTrip}>＋ New Trip</Button>
        </div>
      </div>

      <div style={footer}>
        <div style={{ marginBottom: 8 }}>
          <Button variant="outline-light" size="sm" onClick={onLogout} style={{ borderRadius: 8 }}>Log Out</Button>
        </div>
        <div>© {new Date().getFullYear()} Voyago</div>
      </div>
    </aside>
  );
}
