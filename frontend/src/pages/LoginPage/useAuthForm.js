// src/pages/LoginPage/hooks/useAuthForm.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuthForm() {
  // --- State ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');      // For error messages
  const [message, setMessage] = useState('');  // For success messages
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const navigate = useNavigate();

  // --- Handle LOGIN Submission ---
  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/login', { // Use relative URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/'); // Redirect to dashboard
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handle SIGN UP Submission ---
  const handleSignUp = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      // Call the create-account endpoint
      const response = await fetch('/api/auth/create-account', { // Use relative URL
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
      setMessage('Account created successfully! Please log in.');
      setActiveTab('login');
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- Helper function to clear state when switching tabs ---
  const switchTab = (tab) => {
    setEmail('');
    setPassword('');
    setError('');
    setMessage('');
    setActiveTab(tab);
  };

  // --- Return the "Control Panel" ---
  return {
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
  };
}