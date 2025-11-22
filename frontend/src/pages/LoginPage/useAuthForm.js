import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../../utils/api';

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
      const data = await apiPost('/api/auth/login', { email, password });

      // 1. Save Token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // 2. === FIXED: Redirect to Dashboard ===
      navigate('/dashboard'); 
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
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
      await apiPost('/api/auth/create-account', { email, password });

      // --- Success ---
      setMessage('Account created successfully! Please log in.');
      setActiveTab('login');
      setPassword('');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Account creation failed. Please try again.');
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