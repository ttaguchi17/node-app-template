import { useEffect, useState } from 'react';
import axios from 'axios';

function GmailConnector() {
  const [status, setStatus] = useState({ connected: false, email: null, needs_reauth: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkGmailStatus();
    
    // Listen for messages from the popup window
    const handleMessage = async (event) => {
      if (event.data.type === 'GMAIL_CONNECTED') {
        setLoading(false);
        await checkGmailStatus();
      } else if (event.data.type === 'GMAIL_ERROR') {
        setLoading(false);
        alert('Failed to connect Gmail. Please try again.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkGmailStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      console.log('Using token:', token); // Debug log
      const response = await axios.get('http://localhost:3000/api/auth/gmail/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to check Gmail status:', error);
    }
  };

  const connectGmail = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        alert('Please log in first');
        return;
      }
      console.log('Using token for connect:', token);
      
      const response = await axios.get('http://localhost:3000/api/auth/gmail/connect', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Get the auth URL from the response
      const authUrl = new URL(response.data.url);
      
      // Add the JWT token as the state parameter
      authUrl.searchParams.append('state', token);
      
      // Open Google OAuth in a popup window
      const width = 600;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        authUrl.toString(), // <-- FIX: Use the NEW URL with the 'state' token
        'Gmail Authorization',
        `width=${width},height=${height},left=${left},top=${top},toolbar=0,location=0,status=0,menubar=0`
      );
    } catch (error) {
      alert('Failed to initiate Gmail connection: ' + error.message);
      setLoading(false);
    }
  };

  const disconnectGmail = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:3000/api/auth/gmail/disconnect', {
        headers: { Authorization: `Bearer ${token}` }
      });
      checkGmailStatus();
    } catch (error) {
      alert('Failed to disconnect: ' + error.message);
    }
  };

  if (status.connected) {
    return (
      <div style={{ padding: '10px', background: '#e8f5e9', borderRadius: '5px' }}>
        <strong>✅ Connected:</strong> {status.email}
        {status.needs_reauth && (
          <button onClick={connectGmail} style={{ marginLeft: '10px' }}>
            Re-authorize
          </button>
        )}
        <button onClick={disconnectGmail} style={{ marginLeft: '10px' }}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={connectGmail} 
      disabled={loading}
      style={{ padding: '10px', background: '#4285f4', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
    >
      {loading ? 'Connecting...' : '📧 Connect Gmail'}
    </button>
  );
}

export default GmailConnector;