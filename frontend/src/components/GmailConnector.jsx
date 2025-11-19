import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

import BookingReviewModal from './BookingReviewModal.jsx';
import AssignToTripModal from './AssignToTripModal.jsx';

function GmailConnector() {
  const [status, setStatus] = useState({ connected: false, email: null, needs_reauth: false });
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null); 
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState('')

  const [bookingsToImport, setBookingsToImport] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    checkGmailStatus();
    
    // Listen for messages from the popup window
    const handleMessage = async (event) => {
      if (event.data.type === 'GMAIL_CONNECTED') {
        setLoading(false);
        if (popup) popup.close();
        setPopup(null);
        await checkGmailStatus();
      } else if (event.data.type === 'GMAIL_ERROR') {
        setLoading(false);
        if (popup) popup.close();
        setPopup(null);
        alert('Failed to connect Gmail. Please try again.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!popup) return;

    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        setLoading(false);
        setPopup(null);
        console.log('Popup closed by user.');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [popup]);

  const checkGmailStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      console.log('Using token:', token); // Debug log
      const response = await axios.get('http://localhost:3000/api/gmail/status', {
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
      
      const response = await axios.get('http://localhost:3000/api/gmail/connect', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Get the auth URL from the response
      const authUrl = new URL(response.data.auth_url);
      
      // Add the JWT token as the state parameter
      authUrl.searchParams.append('state', token);
      
      // Open Google OAuth in a popup window
      const width = 600;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const newPopup = window.open(
        authUrl.toString(),
        'Gmail Authorization',
        `width=${width},height=${height},left=${left},top=${top},toolbar=0,location=0,status=0,menubar=0`
      );
      setPopup(newPopup); // Save the popup reference
    } catch (error) {
      alert('Failed to initiate Gmail connection: ' + error.message);
      setLoading(false);
    }
  };

  const disconnectGmail = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:3000/api/gmail/disconnect', {
        headers: { Authorization: `Bearer ${token}` }
      });
      checkGmailStatus();
    } catch (error) {
      alert('Failed to disconnect: ' + error.message);
    }
  };
  
const handleSimpleScan = async () => {
  setIsScanning(true);
  try {
    const token = localStorage.getItem('token');

    const response = await axios.post(
      'http://localhost:3000/api/gmail/scan',
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setScanResults(response.data || []);
    setShowReviewModal(true);
  } catch (error) {
    // ✅ Handle backend 401 for expired Gmail tokens
    if (error.response && error.response.status === 401) {
      alert('Your Gmail connection has expired or been revoked. Please reconnect your Gmail account.');
      
      // Optional: ensure the backend cleanup happened
      await axios.delete('http://localhost:3000/api/gmail/disconnect', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Trigger reconnect popup
      connectGmail();
      return;
    }

    // ✅ Fallback for all other errors
    alert('Failed to scan inbox: ' + (error.response?.data?.message || error.message));
  } finally {
    setIsScanning(false);
  }
};
 
  // --- NEW: Handler for the "Manual Search" form ---
  const handleManualSearch = async (e) => {
    e.preventDefault(); // Stop form from reloading page
    if (!searchQuery) return; // Don't search if empty
    
    setIsScanning(true);

    // --- NEW "SMART SEARCH" LOGIC ---
    let finalQuery = '';
    if (searchQuery.includes('@')) {
      // If user typed an email, build a 'from:' query
      finalQuery = `from:${searchQuery}`;
    } else {
      // Otherwise, build a 'subject:' query
      finalQuery = `subject:${searchQuery}`;
    }
    
    console.log(`Executing smart search with query: ${finalQuery}`);
    // --- END OF NEW LOGIC ---

  try {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    'http://localhost:3000/api/gmail/search',
    { query: finalQuery },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  setScanResults(response.data || []);
  setShowReviewModal(true);
} catch (error) {
  if (error.response && error.response.status === 401) {
    alert('Your Gmail connection has expired or been revoked. Please reconnect your Gmail account.');
    
    await axios.delete('http://localhost:3000/api/gmail/disconnect', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    connectGmail();
    return;
  }

  alert('Failed to search inbox: ' + (error.response?.data?.message || error.message));
} finally {
  setIsScanning(false);
}
  };  

  const handleReviewSubmit = (selectedBookings) => {
      setBookingsToImport(selectedBookings); // Save the selected items
      setShowReviewModal(false); // Close the first modal
      setShowAssignModal(true); // Open the second modal
    };

  if (status.connected) {
    return (
      <>
        {/* --- This is the main "Connected" bar --- */}
        <div style={{ padding: '10px', background: '#e8f5e9', borderRadius: '5px', marginBottom: '15px' }}>
          <strong>✅ Connected:</strong> {status.email}
          {status.needs_reauth && (
            <button onClick={connectGmail} style={{ marginLeft: '10px' }} disabled={loading}>
              {loading ? 'Connecting...' : 'Re-authorize'}
            </button>
          )}
          <button onClick={disconnectGmail} style={{ marginLeft: '10px' }}>
            Disconnect
          </button>
        </div>


        <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '5px', marginBottom: '15px' }}>
          <h5>Automated Scan</h5>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>Find all bookings from the last 30 days.</p>
          <button onClick={handleSimpleScan} style={{ marginTop: '10px' }} disabled={isScanning}>
            {isScanning ? 'Scanning...' : 'Scan Last 30 Days'}
          </button>
        </div>

        <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '5px' }}>
          <h5>Manual Search</h5>
          <form onSubmit={handleManualSearch}>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., from:united.com or Confirmation #123"
              style={{ width: '300px', marginRight: '10px' }}
            />
            <button type="submit" disabled={isScanning}>
              {isScanning ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        <BookingReviewModal
          show={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          scanResults={scanResults}
          onSubmit={handleReviewSubmit} 
        />

        <AssignToTripModal
          show={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          bookingsToImport={bookingsToImport}
        />
      </>
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