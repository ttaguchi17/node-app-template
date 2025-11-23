// src/pages/LoginPage/components/SignUpForm.jsx
import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';

export default function SignUpForm({ onSubmit, email, setEmail, password, setPassword, isLoading, hasError }) {
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
    <Form onSubmit={onSubmit}>
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
          onFocus={handlePasswordFocus}
          required
        />
      </Form.Group>
      <Button variant="success" type="submit" className="w-100" disabled={isLoading}>
        {isLoading ? 'Creating Account...' : 'Sign Up'}
      </Button>
    </Form>
  );
}