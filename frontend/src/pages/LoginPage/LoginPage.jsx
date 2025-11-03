// src/pages/LoginPage/LoginPage.jsx
import React from 'react';
import { Form, Button, Alert, Container, Card, Nav } from 'react-bootstrap';

// 1. Import our new hook and components
import { useAuthForm } from './useAuthForm.js';
import LoginForm from './components/LoginForm.jsx';
import SignUpForm from './components/SignUpForm.jsx';

export default function LoginPage() {
  
  // 2. Call the hook to get all state and logic
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    message,
    isLoading,
    activeTab,
    handleLogin,
    handleSignUp,
    switchTab
  } = useAuthForm();

  // 3. The render is now clean and simple
  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '100%', maxWidth: '400px' }}>
        
        <Nav variant="tabs" defaultActiveKey="login" onSelect={(selectedKey) => switchTab(selectedKey)} activeKey={activeTab}>
          <Nav.Item>
            <Nav.Link eventKey="login">Log In</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="signup">Create Account</Nav.Link>
          </Nav.Item>
        </Nav>
        
        <Card.Body className="p-4">
          
          {/* Messages are handled by the page */}
          {error && <Alert variant="danger">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}
          
          {/* 4. Conditionally render the correct form */}
          {activeTab === 'login' ? (
            <LoginForm 
              onSubmit={handleLogin}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              isLoading={isLoading}
            />
          ) : (
            <SignUpForm 
              onSubmit={handleSignUp}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              isLoading={isLoading}
            />
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}