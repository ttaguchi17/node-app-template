// frontend/src/pages/SettingsPage.jsx
import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const navigate = useNavigate();

  return (
    <Container fluid style={{ padding: 24 }}>
      <Card style={{ borderRadius: 12, padding: 24, maxWidth: 920, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 36 }}>Settings</h1>
            <p style={{ marginTop: 8, color: '#6b7280' }}>
              This page is coming soon — we’re building out the settings for Voyago.
            </p>
          </div>

          <div>
            <Button variant="outline-secondary" onClick={() => navigate(-1)}>
              ← Back
            </Button>
          </div>
        </div>

        <div style={{ marginTop: 32, textAlign: 'center', padding: 32 }}>
          <h2 style={{ marginBottom: 8 }}>Settings — Coming Soon</h2>
          <p style={{ color: '#6b7280', maxWidth: 640, margin: '0 auto' }}>
            We’ll let you change preferences, notifications, and appearance here soon. For now,
            feel free to navigate back to the dashboard or profile.
          </p>
          <div style={{ marginTop: 18 }}>
            <Button variant="primary" onClick={() => navigate('/dashboard')} style={{ marginRight: 8 }}>
              Go to Dashboard
            </Button>
            <Button variant="secondary" onClick={() => navigate('/profile')}>
              Go to Profile
            </Button>
          </div>
        </div>
      </Card>
    </Container>
  );
}
