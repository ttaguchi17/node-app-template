import { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { Mail, Search, Calendar } from 'lucide-react';
import axios from 'axios';
import BookingReviewModal from '../../../components/BookingReviewModal.jsx';
import AssignToTripModal from '../../../components/AssignToTripModal.jsx';
import { truncateEmail } from '../../../utils/textUtils';

export default function GmailModal({ show, onClose }) {
  const [status, setStatus] = useState({ connected: false, email: null, needs_reauth: false });
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingsToImport, setBookingsToImport] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    if (show) {
      checkGmailStatus();
    }
  }, [show]);

  useEffect(() => {
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
  }, [popup]);

  useEffect(() => {
    if (!popup) return;

    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        setLoading(false);
        setPopup(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [popup]);

  const checkGmailStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
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
      
      const response = await axios.get('http://localhost:3000/api/gmail/connect', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const authUrl = new URL(response.data.url);
      authUrl.searchParams.append('state', token);
      
      const width = 600;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const newPopup = window.open(
        authUrl.toString(),
        'Gmail Authorization',
        `width=${width},height=${height},left=${left},top=${top},toolbar=0,location=0,status=0,menubar=0`
      );
      setPopup(newPopup);
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
      if (error.response && error.response.status === 401) {
        alert('Your Gmail connection has expired or been revoked. Please reconnect your Gmail account.');
        await axios.delete('http://localhost:3000/api/gmail/disconnect', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        connectGmail();
        return;
      }
      alert('Failed to scan inbox: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setIsScanning(true);

    let finalQuery = '';
    if (searchQuery.includes('@')) {
      finalQuery = `from:${searchQuery}`;
    } else {
      finalQuery = `subject:${searchQuery}`;
    }

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
    setBookingsToImport(selectedBookings);
    setShowReviewModal(false);
    setShowAssignModal(true);
  };

  return (
    <>
      <Modal show={show} onHide={onClose} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            <Mail size={24} className="text-primary" />
            Gmail Travel Booking Scanner
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Connection Status */}
          {status.connected ? (
            <Alert variant="success" className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <Mail size={20} />
                <div>
                  <strong>Connected:</strong> <span title={status.email}>{truncateEmail(status.email)}</span>
                  {status.needs_reauth && (
                    <div className="text-warning small mt-1">⚠️ Re-authorization required</div>
                  )}
                </div>
              </div>
              <div className="d-flex gap-2">
                {status.needs_reauth && (
                  <Button size="sm" variant="warning" onClick={connectGmail} disabled={loading}>
                    {loading ? 'Connecting...' : 'Re-authorize'}
                  </Button>
                )}
                <Button size="sm" variant="outline-danger" onClick={disconnectGmail}>
                  Disconnect
                </Button>
              </div>
            </Alert>
          ) : (
            <Alert variant="info" className="text-center">
              <Mail size={32} className="mb-2" />
              <p className="mb-3">Connect your Gmail account to automatically scan for travel bookings</p>
              <Button variant="primary" onClick={connectGmail} disabled={loading}>
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Mail size={18} className="me-2" />
                    Connect Gmail
                  </>
                )}
              </Button>
            </Alert>
          )}

          {/* Scan Options - Only show if connected */}
          {status.connected && (
            <>
              <hr />
              
              {/* Automated Scan */}
              <div className="mb-4">
                <h6 className="d-flex align-items-center gap-2 mb-3">
                  <Calendar size={20} className="text-primary" />
                  Automated Scan
                </h6>
                <p className="text-muted small mb-3">
                  Automatically find all travel bookings from the last 30 days
                </p>
                <Button 
                  variant="primary" 
                  onClick={handleSimpleScan} 
                  disabled={isScanning}
                  className="w-100"
                >
                  {isScanning ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Calendar size={18} className="me-2" />
                      Scan Last 30 Days
                    </>
                  )}
                </Button>
              </div>

              {/* Manual Search */}
              <div>
                <h6 className="d-flex align-items-center gap-2 mb-3">
                  <Search size={20} className="text-primary" />
                  Manual Search
                </h6>
                <p className="text-muted small mb-3">
                  Search by sender email or confirmation number
                </p>
                <Form onSubmit={handleManualSearch}>
                  <Form.Group className="mb-3">
                    <Form.Control
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g., booking@airline.com or Confirmation #123"
                      disabled={isScanning}
                    />
                    <Form.Text className="text-muted">
                      Enter an email address or search term
                    </Form.Text>
                  </Form.Group>
                  <Button 
                    type="submit" 
                    variant="outline-primary" 
                    disabled={isScanning || !searchQuery}
                    className="w-100"
                  >
                    {isScanning ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search size={18} className="me-2" />
                        Search Inbox
                      </>
                    )}
                  </Button>
                </Form>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Booking Review Modal */}
      <BookingReviewModal
        show={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        scanResults={scanResults}
        onSubmit={handleReviewSubmit}
      />

      {/* Assign to Trip Modal */}
      <AssignToTripModal
        show={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        bookingsToImport={bookingsToImport}
      />
    </>
  );
}
