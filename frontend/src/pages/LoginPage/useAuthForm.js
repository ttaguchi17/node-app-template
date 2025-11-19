import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuthForm() {
  // --- State ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');      
  const [message, setMessage] = useState('');  
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
      // NOTE: If you haven't set up a proxy in package.json/vite.config, 
      // you might need 'http://localhost:3000/api/auth/login' here.
      const response = await fetch('/api/auth/login', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // 1. Save Token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // 2. === FIXED: Redirect to Dashboard ===
      navigate('/dashboard'); 
      
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
      const response = await fetch('/api/auth/create-account', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
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
  
  const switchTab = (tab) => {
    setEmail('');
    setPassword('');
    setError('');
    setMessage('');
    setActiveTab(tab);
  };

  return {
    email, setEmail,
    password, setPassword,
    error, message,
    isLoading,
    activeTab,
    handleLogin, handleSignUp,
    switchTab
  };
}