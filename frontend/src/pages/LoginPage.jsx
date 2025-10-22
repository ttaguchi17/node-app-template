// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import hook for navigation
import { Form, Button, Alert, Container, Card } from 'react-bootstrap';

function LoginPage() {
  // --- State ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // To store error messages
  const [isLoading, setIsLoading] = useState(false);
  
  // 'useNavigate' is the React hook for redirecting the user
  const navigate = useNavigate();

  // --- Handle Form Submission ---
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form refresh
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If server responds with an error (400, 401, etc.)
        throw new Error(data.message || 'Login failed');
      }

      // --- Success ---
      // 1. Save the token to the browser's local storage
      localStorage.setItem('token', data.token);
      
      // 2. Redirect to the dashboard page
      navigate('/'); 

    } catch (err) {
      // Show error message to the user
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '100%', maxWidth: '400px' }}>
        <Card.Body className="p-4">
          <h2 className="text-center mb-4">Welcome Back</h2>
          <Form onSubmit={handleSubmit}>
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

            {/* Display error messages if any */}
            {error && (
              <Alert variant="danger" className="mt-3">
                {error}
              </Alert>
            )}

            <Button variant="primary" type="submit" className="w-100" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Log In'}
            </Button>
          </Form>
          
          {/* We'll add the "Create Account" tab/link logic here later */}
          <div className="text-center mt-3">
            <small>Don't have an account? We'll add signup soon.</small>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LoginPage;