// src/pages/LoginPage/components/LoginForm.jsx
import React from 'react';
import { Form, Button } from 'react-bootstrap';

export default function LoginForm({ onSubmit, email, setEmail, password, setPassword, isLoading }) {
  return (
    <Form onSubmit={onSubmit}>
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
  );
}