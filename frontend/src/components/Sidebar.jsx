// src/components/Sidebar.jsx
import React from 'react';
import { Nav, Button } from 'react-bootstrap';
import { Home, Calendar, DollarSign, User, Settings, HelpCircle, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import voyagoLogo from '../assets/voyagologo.png';

export default function Sidebar({
  onLogout = () => {},
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // derive active key from current path
  const path = location.pathname || '/';
  const active = path.startsWith('/profile')
    ? 'profile'
    : path.startsWith('/calendar')
    ? 'calendar'
    : path.startsWith('/budget')
    ? 'budget'
    : path.startsWith('/settings')
    ? 'settings'
    : path.startsWith('/support')
    ? 'support'
    : 'dashboard';

  const container = {
    width: 260,
    minHeight: '100vh',
    padding: '32px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 24,
    background: 'linear-gradient(165deg, #4f46e5 0%, #3b82f6 50%, #06b6d4 100%)',
    color: '#fff',
    boxSizing: 'border-box',
    position: 'relative',
    boxShadow: '0 0 30px rgba(0, 0, 0, 0.15)'
  };

  const logoBox = {
    width: 56,
    height: 56,
    borderRadius: 14,
    background: 'rgba(255, 255, 255, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
    marginBottom: 4,
    backdropFilter: 'blur(10px)'
  };

  const brandText = {
    fontWeight: 800,
    fontSize: 22,
    marginTop: 8,
    letterSpacing: 1.5,
    textAlign: 'center',
    color: '#fff',
    textTransform: 'uppercase'
  };

  const navWrap = {
    width: '100%',
    marginTop: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    alignItems: 'stretch'
  };

  const navItemBase = {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '12px 16px',
    borderRadius: 12,
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'all 0.2s ease',
    fontWeight: 500,
    fontSize: 15
  };

  const footer = {
    marginTop: 'auto',
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
    width: '100%',
    paddingTop: 16,
    borderTop: '1px solid rgba(255, 255, 255, 0.2)'
  };

  const item = (id) => ({
    ...navItemBase,
    background: active === id ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
    color: '#fff',
    opacity: active === id ? 1 : 0.8,
    fontWeight: active === id ? 700 : 500
  });

  return (
    <aside style={container}>
      {/* Brand */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
        <div style={logoBox}>
          <img
            src={voyagoLogo}
            alt="Voyago logo"
            style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 8 }}
          />
        </div>
        <div style={brandText}>VOYAGO</div>
      </div>

      {/* Navigation */}
      <div style={navWrap}>
        <div style={item('dashboard')} onClick={() => navigate('/dashboard')}>
          <Home size={20} strokeWidth={2} />
          <div style={{ flex: 1 }}>Dashboard</div>
        </div>

        <div style={item('calendar')} onClick={() => navigate('/calendar')}>
          <Calendar size={20} strokeWidth={2} />
          <div style={{ flex: 1 }}>Calendar</div>
        </div>

        <div style={item('budget')} onClick={() => navigate('/budget')}>
          <DollarSign size={20} strokeWidth={2} />
          <div style={{ flex: 1 }}>Budget</div>
        </div>

        <div style={item('profile')} onClick={() => navigate('/profile')}>
          <User size={20} strokeWidth={2} />
          <div style={{ flex: 1 }}>Profile</div>
        </div>

        <div style={item('settings')} onClick={() => navigate('/settings')}>
          <Settings size={20} strokeWidth={2} />
          <div style={{ flex: 1 }}>Settings</div>
        </div>

        <div style={item('support')} onClick={() => navigate('/support')}>
          <HelpCircle size={20} strokeWidth={2} />
          <div style={{ flex: 1 }}>Support</div>
        </div>
      </div>

      {/* Footer */}
      <div style={footer}>
        <div style={{ marginBottom: 12 }}>
          <Button 
            variant="outline-light" 
            size="sm" 
            onClick={onLogout} 
            style={{ 
              borderRadius: 10, 
              width: '100%',
              padding: '10px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s ease'
            }}
          >
            <LogOut size={16} />
            Log Out
          </Button>
        </div>
        <div>© {new Date().getFullYear()} Voyago</div>
      </div>
    </aside>
  );
}
