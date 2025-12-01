// src/pages/LoginPage/components/LoginForm.jsx
import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';

export default function LoginForm({ onSubmit, email, setEmail, password, setPassword, isLoading, hasError }) {
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Reset passwordTouched when an error occurs so user can clear password again
  React.useEffect(() => {
    if (hasError) {
      setPasswordTouched(false);
    }
  }, [hasError]);

  const handlePasswordFocus = () => {
    if (!passwordTouched) {
      setPassword(''); // Clear password on first focus
      setPasswordTouched(true);
    }
  };

  return (
    <Form onSubmit={onSubmit} className="login-form">
      <h2 className="text-center mb-4" style={{ color: 'var(--bs-gray-900)', fontWeight: 700 }}>Welcome Back</h2>
      <Form.Group className="mb-3" controlId="loginEmail">
        <Form.Label style={{ color: 'var(--bs-gray-900)', fontWeight: 600, marginBottom: '0.5rem' }}>Email Address</Form.Label>
        <Form.Control
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            padding: '1rem',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            fontSize: '1rem',
            transition: 'all 0.3s ease'
          }}
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="loginPassword">
        <Form.Label style={{ color: 'var(--bs-gray-900)', fontWeight: 600, marginBottom: '0.5rem' }}>Password</Form.Label>
        <Form.Control
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={handlePasswordFocus}
          required
          style={{
            padding: '1rem',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            fontSize: '1rem',
            transition: 'all 0.3s ease'
          }}
        />
      </Form.Group>
      <Button 
        type="submit" 
        className="w-100" 
        disabled={isLoading}
        style={{
          padding: '1rem',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-indigo) 100%)',
          border: 'none',
          fontSize: '1rem',
          fontWeight: 600,
          marginTop: '1rem',
          transition: 'all 0.3s ease'
        }}
      >
        {isLoading ? 'Logging in...' : 'Log In'}
      </Button>
    </Form>
  );
}