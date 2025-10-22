// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// 1. Import the Nav component from React-Bootstrap
import { Form, Button, Alert, Container, Card, Nav } from 'react-bootstrap';

function LoginPage() {
  // --- State ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');       // For error messages
  const [message, setMessage] = useState('');     // For success messages
  const [isLoading, setIsLoading] = useState(false);
  
  // 2. Add state to track which tab is active ('login' or 'signup')
  const [activeTab, setActiveTab] = useState('login');
  
  const navigate = useNavigate();

  // --- Handle LOGIN Submission ---
  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      navigate('/'); // Redirect to dashboard
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. --- NEW FUNCTION: Handle SIGN UP Submission ---
  const handleSignUp = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      // Call the create-account endpoint
      const response = await fetch('http://localhost:3000/api/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        // Handle errors (like "email already exists")
        throw new Error(data.message || 'Sign-up failed');
      }

      // --- Success ---
      // Show success message and switch to the login tab
      setMessage('Account created successfully! Please log in.');
      setActiveTab('login');
      // Clear password field
      setPassword('');

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 4. Helper function to clear state when switching tabs
  const switchTab = (tab) => {
    setEmail('');
    setPassword('');
    setError('');
    setMessage('');
    setActiveTab(tab);
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '100%', maxWidth: '400px' }}>
        
        {/* 5. --- NEW: Tab Navigation --- */}
        <Nav variant="tabs" defaultActiveKey="login" onSelect={(selectedKey) => switchTab(selectedKey)} activeKey={activeTab}>
          <Nav.Item>
            <Nav.Link eventKey="login">Log In</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="signup">Create Account</Nav.Link>
          </Nav.Item>
        </Nav>
        
        {/* --- Form Area --- */}
        <Card.Body className="p-4">
          
          {/* Display error or success messages */}
          {error && <Alert variant="danger">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}
          
          {/* 6. --- NEW: Conditional Form Rendering --- */}
          {activeTab === 'login' ? (
            /* --- Login Form --- */
            <Form onSubmit={handleLogin}>
              <h2 className="text-center mb-4">Welcome Back</h2>
              <Form.Group className="mb-3" controlId="loginEmail">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="loginPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>
              <Button variant="primary" type="submit" className="w-100" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Log In'}
              </Button>
            </Form>
          ) : (
            /* --- Sign Up Form --- */
            <Form onSubmit={handleSignUp}>
              <h2 className="text-center mb-4">Create Account</h2>
              <Form.Group className="mb-3" controlId="signupEmail">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="signupPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>
              <Button variant="success" type="submit" className="w-100" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LoginPage;