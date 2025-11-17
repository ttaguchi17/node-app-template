import React, { useState, useEffect, useRef } from 'react';
import { Nav, Badge, Dropdown, Spinner, Button } from 'react-bootstrap';
import axios from 'axios';
// You can use an icon library like 'react-icons' or just text
// import { FaBell } from 'react-icons/fa'; 

const NotificationsBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Helper to get auth header
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  // 1. Fetch Notifications
  const fetchNotifications = async () => {
    const headers = getAuthHeader();
    if (!headers) return;

    try {
      // We fetch ALL notifications (read and unread) to show history
      const res = await axios.get('http://localhost:3000/api/notifications', { headers });
      setNotifications(res.data);
      
      // Calculate unread count
      const unread = res.data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  // 2. Poll every 30 seconds
  useEffect(() => {
    fetchNotifications(); // Initial fetch
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // 3. Handle Actions (Accept/Decline)
  const handleRespond = async (id, action, e) => {
    e.stopPropagation(); // Prevent dropdown from closing
    e.preventDefault();
    
    const headers = getAuthHeader();
    if (!headers) return;

    try {
      setLoading(true);
      await axios.post(`http://localhost:3000/api/notifications/${id}/respond`, { action }, { headers });
      
      // Refresh list after action
      await fetchNotifications();
    } catch (err) {
      alert('Failed to respond: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 4. Mark as read when opening dropdown
  const handleToggle = async (isOpen) => {
    setShowDropdown(isOpen);
    if (isOpen && unreadCount > 0) {
      // Optional: Mark all as read instantly, or wait for user action.
      // For now, we'll just leave them unread until acted upon.
    }
  };

  return (
    <Dropdown show={showDropdown} onToggle={handleToggle} align="end">
      <Dropdown.Toggle as={Nav.Link} id="dropdown-notifications">
        <span style={{ fontSize: '1.2rem' }}>🔔</span> {/* Replace with FaBell icon if you have it */}
        {unreadCount > 0 && (
          <Badge 
            bg="danger" 
            pill 
            style={{ position: 'absolute', top: '5px', right: '0px', fontSize: '0.7rem' }}
          >
            {unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu style={{ width: '350px', maxHeight: '400px', overflowY: 'auto' }}>
        <Dropdown.Header>Notifications</Dropdown.Header>
        
        {notifications.length === 0 ? (
          <Dropdown.Item disabled>No notifications</Dropdown.Item>
        ) : (
          notifications.map(notif => (
            <Dropdown.Item key={notif.id} className={notif.is_read ? 'text-muted' : 'fw-bold'}>
              <div style={{ whiteSpace: 'normal' }}>
                <div className="d-flex justify-content-between">
                   <strong>{notif.title}</strong>
                   <small className="text-muted">{new Date(notif.created_at).toLocaleDateString()}</small>
                </div>
                <p className="mb-1 small">{notif.body}</p>
                
                {/* Show Action Buttons for Invites */}
                {notif.type === 'trip_invite' && !notif.is_read && (
                  <div className="d-flex gap-2 mt-2">
                    <Button 
                      size="sm" 
                      variant="success" 
                      onClick={(e) => handleRespond(notif.id, 'accept', e)}
                      disabled={loading}
                    >
                      Accept
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline-danger" 
                      onClick={(e) => handleRespond(notif.id, 'decline', e)}
                      disabled={loading}
                    >
                      Decline
                    </Button>
                  </div>
                )}
                
                {/* Show status if already handled */}
                {notif.type === 'trip_invite' && notif.is_read && (
                   <div className="mt-1 small text-success">
                     Responded
                   </div>
                )}
              </div>
              <Dropdown.Divider />
            </Dropdown.Item>
          ))
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationsBell;