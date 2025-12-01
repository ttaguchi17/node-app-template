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
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Welcome to Travel App</h1>
          <p>Please sign in to continue your journey</p>
        </div>

        <Nav variant="pills" 
            defaultActiveKey="login" 
            onSelect={(selectedKey) => switchTab(selectedKey)} 
            activeKey={activeTab}
            className="auth-tabs mb-4">
          <Nav.Item>
            <Nav.Link eventKey="login">Log In</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="signup">Create Account</Nav.Link>
          </Nav.Item>
        </Nav>
        
        <div className="auth-content">
          {error && <Alert variant="danger" className="animate-alert">{error}</Alert>}
          {message && <Alert variant="success" className="animate-alert">{message}</Alert>}
          
          {/* 4. Conditionally render the correct form */}
          {activeTab === 'login' ? (
            <LoginForm 
              onSubmit={handleLogin}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              isLoading={isLoading}
              hasError={!!error}
            />
          ) : (
            <SignUpForm 
              onSubmit={handleSignUp}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              isLoading={isLoading}
              hasError={!!error}
            />
          )}
        </div>
      </div>
    </div>
  );
}