// frontend/src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import Layout from '../components/Layout.jsx';

/**
 * ProfilePage (simplified)
 * - Loads user from localStorage ("voyago_user") or GET /api/me
 * - Saves profile updates to PUT /api/me
 * - REMOVED: image upload UI and upload logic
 *
 * If PUT /api/me fails, check your backend route and auth token.
 */
export default function ProfilePage() {
  const [isSidebarToggled, setIsSidebarToggled] = useState(false);
  const toggleSidebar = () => setIsSidebarToggled(!isSidebarToggled);
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [editedInfo, setEditedInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('voyago_user') : null;

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      try {
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUserInfo(parsed);
          setEditedInfo(parsed);
          setLoading(false);
          return;
        }

        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch('/api/me', { headers });
        if (!res.ok) {
          console.warn('GET /api/me returned', res.status);
          // fallback user
          const fallback = {
            name: 'Guest Traveler',
            email: 'guest@voyago.app',
            location: '',
            memberSince: '',
            bio: '',
          };
          setUserInfo(fallback);
          setEditedInfo(fallback);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setUserInfo(data);
        setEditedInfo(data);
        localStorage.setItem('voyago_user', JSON.stringify(data));
      } catch (err) {
        console.error('Failed loading user:', err);
        const fallback = {
          name: 'Guest Traveler',
          email: 'guest@voyago.app',
          location: '',
          memberSince: '',
          bio: '',
        };
        setUserInfo(fallback);
        setEditedInfo(fallback);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save profile: only PUT JSON (no file upload)
  const handleSave = async () => {
    if (!editedInfo) return;
    setSaving(true);
    setAlert({ type: '', message: '' });

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch('/api/me', {
        method: 'PUT',
        headers,
        body: JSON.stringify(editedInfo),
      });

      if (!res.ok) {
        // read body (might include error details)
        let text;
        try { text = await res.text(); } catch (e) { text = `status ${res.status}`; }
        throw new Error(text || `Server returned ${res.status}`);
      }

      const updated = await res.json();
      setUserInfo(updated);
      setEditedInfo(updated);
      localStorage.setItem('voyago_user', JSON.stringify(updated));
      setIsEditing(false);
      setAlert({ type: 'success', message: 'Profile updated successfully.' });
    } catch (err) {
      console.error('Profile save error:', err);
      // show a helpful message to the user
      setAlert({
        type: 'danger',
        message: 'Failed to save profile. See console (F12) and network tab for details.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedInfo(userInfo);
    setIsEditing(false);
  };

  if (loading || !userInfo) {
    return (
      <Layout isSidebarToggled={isSidebarToggled} onToggleSidebar={toggleSidebar}>
        <div className="text-center py-5">
          <p>Loading profile…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout isSidebarToggled={isSidebarToggled} onToggleSidebar={toggleSidebar}>
      <Container fluid style={{ padding: 24, maxWidth: 1400 }}>
        {alert.message && (
          <Alert
            variant={alert.type === 'danger' ? 'danger' : 'success'}
            onClose={() => setAlert({ type: '', message: '' })}
            dismissible
            className="animate-alert"
            style={{ borderRadius: 12, marginBottom: 24 }}
          >
            {alert.message}
          </Alert>
        )}

      <Row>
        {/* Left column: stats & account */}
        <Col lg={4} md={12}>
          <Card style={{ 
            borderRadius: 16, 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', 
            padding: 24, 
            marginBottom: 24,
            border: 'none',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginTop: 12 }}>
                <h4 style={{ marginBottom: 0 }}>{userInfo.name}</h4>
                <div style={{ color: '#6b7280', fontSize: 14 }}>{userInfo.email}</div>
              </div>
            </div>

            <hr style={{ marginTop: 18, marginBottom: 18 }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                borderRadius: 12, 
                padding: 16, 
                textAlign: 'center',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease',
                cursor: 'default'
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--bs-primary)' }}>12</div>
                <div style={{ color: '#6b7280', fontSize: 13, fontWeight: 500 }}>Trips Completed</div>
              </div>

              <div style={{ 
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                borderRadius: 12, 
                padding: 16, 
                textAlign: 'center',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--bs-cyan)' }}>8</div>
                <div style={{ color: '#6b7280', fontSize: 13, fontWeight: 500 }}>Countries Visited</div>
              </div>

              <div style={{ 
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                borderRadius: 12, 
                padding: 16, 
                textAlign: 'center',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--bs-green)' }}>45,230</div>
                <div style={{ color: '#6b7280', fontSize: 13, fontWeight: 500 }}>Total Miles</div>
              </div>

              <div style={{ 
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                borderRadius: 12, 
                padding: 16, 
                textAlign: 'center',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--bs-indigo)' }}>15</div>
                <div style={{ color: '#6b7280', fontSize: 13, fontWeight: 500 }}>Travel Buddies</div>
              </div>
            </div>
          </Card>

          <Card style={{ 
            borderRadius: 16, 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', 
            padding: 20,
            border: 'none'
          }}>
            <Card.Body style={{ padding: 0 }}>
              <h6 style={{ marginTop: 0, fontWeight: 700, color: 'var(--bs-gray-900)' }}>Account</h6>
              <div style={{ fontSize: 14, color: '#6b7280' }}>
                <div style={{ marginBottom: 8 }}>
                  <strong>Location: </strong> {userInfo.location || '—'}
                </div>
                <div>
                  <strong>Member since: </strong> {userInfo.memberSince || '—'}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right column: form */}
        <Col lg={8} md={12}>
          <Card style={{ 
            borderRadius: 16, 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', 
            padding: 24,
            border: 'none',
            transition: 'all 0.3s ease'
          }}>
            <Card.Body>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ margin: 0 }}>Profile Information</h3>

                <div>
                  {isEditing ? (
                    <>
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        onClick={handleCancel} 
                        style={{ 
                          marginRight: 8,
                          borderRadius: 8,
                          padding: '0.5rem 1rem',
                          fontWeight: 500
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleSave} 
                        disabled={saving}
                        style={{
                          background: 'linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-indigo) 100%)',
                          border: 'none',
                          borderRadius: 8,
                          padding: '0.5rem 1rem',
                          fontWeight: 600,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => setIsEditing(true)}
                      style={{
                        background: 'linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-indigo) 100%)',
                        border: 'none',
                        borderRadius: 8,
                        padding: '0.5rem 1.25rem',
                        fontWeight: 600,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>

              <Form>
                <Form.Group className="mb-3" controlId="name">
                  <Form.Label style={{ fontWeight: 600, color: 'var(--bs-gray-900)', marginBottom: '0.5rem' }}>Full name</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedInfo.name || ''}
                    onChange={(e) => setEditedInfo({ ...editedInfo, name: e.target.value })}
                    disabled={!isEditing}
                    style={{
                      padding: '0.75rem 1rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      background: isEditing ? 'white' : '#f8fafc'
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="email">
                  <Form.Label style={{ fontWeight: 600, color: 'var(--bs-gray-900)', marginBottom: '0.5rem' }}>Email address</Form.Label>
                  <Form.Control
                    type="email"
                    value={editedInfo.email || ''}
                    onChange={(e) => setEditedInfo({ ...editedInfo, email: e.target.value })}
                    disabled={!isEditing}
                    style={{
                      padding: '0.75rem 1rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      background: isEditing ? 'white' : '#f8fafc'
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="location">
                  <Form.Label style={{ fontWeight: 600, color: 'var(--bs-gray-900)', marginBottom: '0.5rem' }}>Location</Form.Label>
                  <Form.Control
                    value={editedInfo.location || ''}
                    onChange={(e) => setEditedInfo({ ...editedInfo, location: e.target.value })}
                    disabled={!isEditing}
                    style={{
                      padding: '0.75rem 1rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      background: isEditing ? 'white' : '#f8fafc'
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="bio">
                  <Form.Label style={{ fontWeight: 600, color: 'var(--bs-gray-900)', marginBottom: '0.5rem' }}>Bio</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={editedInfo.bio || ''}
                    onChange={(e) => setEditedInfo({ ...editedInfo, bio: e.target.value })}
                    disabled={!isEditing}
                    style={{
                      padding: '0.75rem 1rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      background: isEditing ? 'white' : '#f8fafc',
                      resize: 'vertical'
                    }}
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>

          {/* Preferences */}
          <Card style={{ 
            borderRadius: 16, 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', 
            padding: 24, 
            marginTop: 24,
            border: 'none',
            transition: 'all 0.3s ease'
          }}>
            <Card.Body>
              <h4 style={{ marginTop: 0 }}>Preferences</h4>

              <Form>
                <Form.Group className="mb-3 d-flex justify-content-between align-items-center">
                  <div>
                    <div style={{ fontWeight: 700 }}>Email Notifications</div>
                    <div style={{ color: '#6b7280' }}>Receive updates about your trips</div>
                  </div>
                  <Form.Check type="checkbox" defaultChecked />
                </Form.Group>

                <Form.Group className="mb-3 d-flex justify-content-between align-items-center">
                  <div>
                    <div style={{ fontWeight: 700 }}>Trip Reminders</div>
                    <div style={{ color: '#6b7280' }}>Get notified before your trips</div>
                  </div>
                  <Form.Check type="checkbox" defaultChecked />
                </Form.Group>

                <Form.Group className="mb-0 d-flex justify-content-between align-items-center">
                  <div>
                    <div style={{ fontWeight: 700 }}>Newsletter</div>
                    <div style={{ color: '#6b7280' }}>Receive travel tips and inspiration</div>
                  </div>
                  <Form.Check type="checkbox" />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </Layout>
  );
}
