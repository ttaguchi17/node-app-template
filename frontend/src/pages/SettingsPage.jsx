// frontend/src/pages/SettingsPage.jsx
import React, { useEffect, useState } from 'react';
import {
  Container,
  Card,
  Button,
  Form,
  Row,
  Col,
  Modal,
  Alert,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const STORAGE_KEY = 'voyago_settings_v1';

const DEFAULTS = {
  account: {
    fullName: '',
    email: '',
  },
  preferences: {
    language: 'en',
    timezone: 'UTC',
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
  },
  appearance: {
    theme: 'system', // 'light' | 'dark' | 'system'
  },
};

function ChangePasswordModal({ show, onHide }) {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!show) {
      setCurrent('');
      setNewPass('');
      setConfirm('');
      setError(null);
      setSuccess(false);
    }
  }, [show]);

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!newPass || newPass.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPass !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    // NOTE: replace this with your real password-change API call
    setTimeout(() => {
      setSuccess(true);
      setCurrent('');
      setNewPass('');
      setConfirm('');
      // keep modal open briefly to show success
      setTimeout(onHide, 1000);
    }, 600);
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Change Password</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">Password changed.</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="currentPassword">
            <Form.Label style={{ fontWeight: 600, color: 'var(--bs-gray-900)' }}>Current password</Form.Label>
            <Form.Control
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              style={{ borderRadius: 12, border: '2px solid #e2e8f0', padding: '12px 16px' }}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="newPassword">
            <Form.Label style={{ fontWeight: 600, color: 'var(--bs-gray-900)' }}>New password</Form.Label>
            <Form.Control
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              required
              style={{ borderRadius: 12, border: '2px solid #e2e8f0', padding: '12px 16px' }}
            />
            <Form.Text className="text-muted">
              At least 8 characters.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3" controlId="confirmPassword">
            <Form.Label style={{ fontWeight: 600, color: 'var(--bs-gray-900)' }}>Confirm new password</Form.Label>
            <Form.Control
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              style={{ borderRadius: 12, border: '2px solid #e2e8f0', padding: '12px 16px' }}
            />
          </Form.Group>

          <div className="d-flex justify-content-end">
            <Button
              onClick={onHide}
              className="me-2"
              style={{
                background: 'var(--bs-gray)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '10px 24px',
                fontWeight: 600,
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-indigo) 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '10px 24px',
                fontWeight: 600,
              }}
            >
              Change password
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState(DEFAULTS);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [savedAlert, setSavedAlert] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSettings((prev) => ({ ...prev, ...JSON.parse(raw) }));
      }
    } catch (err) {
      // ignore parse errors
      // console.warn('Failed to parse settings from storage', err);
    }
  }, []);

  // helper to persist to localStorage
  function persist(s) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }

  function updateSection(path, value) {
    // simple path updater for our shape (e.g. 'account.fullName')
    const [section, key] = path.split('.');
    setSettings((prev) => {
      const copy = { ...prev, [section]: { ...prev[section], [key]: value } };
      return copy;
    });
  }

  useEffect(() => {
    // persist on change
    persist(settings);
  }, [settings]);

  function validateBeforeSave() {
    setValidationError(null);
    const email = settings.account.email.trim();
    const name = settings.account.fullName.trim();
    if (!name) {
      setValidationError('Please enter your full name.');
      return false;
    }
    // simple email regex — replace with more robust if needed
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
      setValidationError('Please enter a valid email address.');
      return false;
    }
    return true;
  }

  function handleSave() {
    if (!validateBeforeSave()) return;
    // here you would call backend API to save settings, if applicable.
    // For now we show a success alert
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
  }

  function handleReset() {
    setSettings(DEFAULTS);
    persist(DEFAULTS);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 1500);
    setValidationError(null);
  }

  return (
    <Layout
      isSidebarOpen={isSidebarOpen}
      onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      pageTitle="Settings"
    >
      <Container fluid style={{ padding: 24 }}>
        <Card
          style={{
            borderRadius: 16,
            padding: 32,
            maxWidth: 920,
            margin: '0 auto',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            border: 'none',
          }}
        >

        <div style={{ marginTop: 24 }}>
          {savedAlert && (
            <Alert variant="success" dismissible onClose={() => setSavedAlert(false)}>
              Settings saved.
            </Alert>
          )}

          {validationError && (
            <Alert variant="danger" onClose={() => setValidationError(null)} dismissible>
              {validationError}
            </Alert>
          )}

          <Form>
            {/* ACCOUNT */}
            <h5 className="mb-3" style={{ fontWeight: 700, color: 'var(--bs-gray-900)' }}>Account</h5>
            <Card className="p-3 mb-3" style={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <Row>
                <Col md={6}>
                  <Form.Group controlId="fullName" className="mb-3">
                    <Form.Label style={{ fontWeight: 600, color: 'var(--bs-gray-900)' }}>Full name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Your name"
                      value={settings.account.fullName}
                      onChange={(e) =>
                        updateSection('account.fullName', e.target.value)
                      }
                      style={{ borderRadius: 12, border: '2px solid #e2e8f0', padding: '12px 16px' }}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId="email" className="mb-3">
                    <Form.Label style={{ fontWeight: 600, color: 'var(--bs-gray-900)' }}>Email address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="you@voyago.com"
                      value={settings.account.email}
                      onChange={(e) => updateSection('account.email', e.target.value)}
                      style={{ borderRadius: 12, border: '2px solid #e2e8f0', padding: '12px 16px' }}
                    />
                    <Form.Text className="text-muted">
                      Your account email — used for notifications and login.
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-end">
                <Button
                  onClick={() => setShowPwdModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, var(--bs-indigo) 0%, var(--bs-purple) 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 24px',
                    fontWeight: 600,
                  }}
                >
                  Change password
                </Button>
              </div>
            </Card>

            {/* PREFERENCES */}
            <h5 className="mb-3" style={{ fontWeight: 700, color: 'var(--bs-gray-900)' }}>Preferences</h5>
            <Card className="p-3 mb-3" style={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <Row>
                <Col md={6}>
                  <Form.Group controlId="language" className="mb-3">
                    <Form.Label style={{ fontWeight: 600, color: 'var(--bs-gray-900)' }}>Language</Form.Label>
                    <Form.Select
                      value={settings.preferences.language}
                      onChange={(e) =>
                        updateSection('preferences.language', e.target.value)
                      }
                      style={{ borderRadius: 12, border: '2px solid #e2e8f0', padding: '12px 16px' }}
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="ja">日本語</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group controlId="timezone" className="mb-3">
                    <Form.Label style={{ fontWeight: 600, color: 'var(--bs-gray-900)' }}>Timezone</Form.Label>
                    <Form.Select
                      value={settings.preferences.timezone}
                      onChange={(e) =>
                        updateSection('preferences.timezone', e.target.value)
                      }
                      style={{ borderRadius: 12, border: '2px solid #e2e8f0', padding: '12px 16px' }}
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/Phoenix">America / Phoenix (MST)</option>
                      <option value="America/Los_Angeles">America / Los_Angeles (PST)</option>
                      <option value="Pacific/Honolulu">Pacific / Honolulu (HST)</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      This affects displayed times for trips and bookings.
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </Card>

            {/* NOTIFICATIONS */}
            <h5 className="mb-3" style={{ fontWeight: 700, color: 'var(--bs-gray-900)' }}>Notifications</h5>
            <Card className="p-3 mb-3" style={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <Form.Group className="mb-3" controlId="emailNotifications">
                <Form.Check
                  type="switch"
                  label="Email notifications"
                  checked={settings.notifications.emailNotifications}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        emailNotifications: e.target.checked,
                      },
                    }))
                  }
                />
                <Form.Text className="text-muted">
                  Receive emails for itineraries, booking updates, and offers.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3" controlId="pushNotifications">
                <Form.Check
                  type="switch"
                  label="Push notifications"
                  checked={settings.notifications.pushNotifications}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        pushNotifications: e.target.checked,
                      },
                    }))
                  }
                />
                <Form.Text className="text-muted">
                  Allow browser/app push notifications for urgent updates.
                </Form.Text>
              </Form.Group>
            </Card>

            {/* APPEARANCE */}
            <h5 className="mb-3" style={{ fontWeight: 700, color: 'var(--bs-gray-900)' }}>Appearance</h5>
            <Card className="p-3 mb-3" style={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <Form.Group className="mb-3" controlId="theme">
                <Form.Label>Theme</Form.Label>
                <div>
                  <Form.Check
                    type="radio"
                    inline
                    id="theme-system"
                    label="System"
                    name="theme"
                    checked={settings.appearance.theme === 'system'}
                    onChange={() =>
                      setSettings((prev) => ({
                        ...prev,
                        appearance: { ...prev.appearance, theme: 'system' },
                      }))
                    }
                  />
                  <Form.Check
                    type="radio"
                    inline
                    id="theme-light"
                    label="Light"
                    name="theme"
                    checked={settings.appearance.theme === 'light'}
                    onChange={() =>
                      setSettings((prev) => ({
                        ...prev,
                        appearance: { ...prev.appearance, theme: 'light' },
                      }))
                    }
                  />
                  <Form.Check
                    type="radio"
                    inline
                    id="theme-dark"
                    label="Dark"
                    name="theme"
                    checked={settings.appearance.theme === 'dark'}
                    onChange={() =>
                      setSettings((prev) => ({
                        ...prev,
                        appearance: { ...prev.appearance, theme: 'dark' },
                      }))
                    }
                  />
                </div>
                <Form.Text className="text-muted">
                  Toggle Voyago's theme. 'System' follows the user's OS preference.
                </Form.Text>
              </Form.Group>
            </Card>

            {/* SAVE / RESET */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 24,
              }}
            >
              <div>
                <Button
                  onClick={handleReset}
                  style={{
                    background: 'linear-gradient(135deg, var(--bs-red) 0%, #dc2626 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 24px',
                    fontWeight: 600,
                  }}
                >
                  Reset to defaults
                </Button>
              </div>

              <div>
                <Button
                  onClick={() => navigate('/profile')}
                  style={{
                    background: 'linear-gradient(135deg, var(--bs-gray) 0%, var(--bs-gray-dark) 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 24px',
                    fontWeight: 600,
                    marginRight: 12,
                  }}
                >
                  Go to Profile
                </Button>
                <Button
                  onClick={handleSave}
                  style={{
                    background: 'linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-indigo) 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 24px',
                    fontWeight: 600,
                  }}
                >
                  Save changes
                </Button>
              </div>
            </div>
          </Form>
        </div>
      </Card>

        <ChangePasswordModal show={showPwdModal} onHide={() => setShowPwdModal(false)} />
      </Container>
    </Layout>
  );
}
