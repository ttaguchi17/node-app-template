// src/pages/TripDetailsPage/components/TripMembersBox.jsx
import React, { useEffect, useState } from 'react';
import {
  Card, Button, Modal, Form, ListGroup, Spinner, Badge, InputGroup,
} from 'react-bootstrap';

export default function TripMembersBox({ trip, currentUser }) {
  const [showModal, setShowModal] = useState(false);

  // members
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState(null);

  // users cache for matching
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);

  // invite form
  const [emailInput, setEmailInput] = useState('');
  const [enteredEmails, setEnteredEmails] = useState([]); 
  const [emailValidationError, setEmailValidationError] = useState(null);

  const [message, setMessage] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);

  // Determine my role
// Determine my role (normalize possible id fields and allow email fallback)
const currentUserId = String(currentUser?.user_id ?? currentUser?.id ?? currentUser?.userId ?? '');

// Helper to normalize a membership's user id for comparisons
const memberUserId = (m) => String(m?.user_id ?? m?.userId ?? m?.id ?? m?.user?.id ?? '');

// Log to console so we can inspect
console.log('--- DEBUG MEMBERS BOX ---');
console.log('Logged In User ID:', currentUserId);
console.log('Members List:', members);

const myMembership = members.find((m) => {
  // Match by normalized id OR by email (case-insensitive) as a fallback
  const mid = memberUserId(m);
  if (mid && mid === currentUserId) return true;
  const meEmail = String(currentUser?.email || '').toLowerCase();
  const mEmail = String(m?.email || '').toLowerCase();
  if (meEmail && mEmail && meEmail === mEmail) return true;
  return false;
});
console.log('Found My Membership:', myMembership);

// Consider role first (role is the authoritative field for organizer/owner)
const isOrganizer = (myMembership?.role === 'organizer' || myMembership?.role === 'owner');
console.log('Am I Organizer?', isOrganizer);


  const getToken = () => {
    const token = localStorage.getItem('token');
    return token ? token : null;
  };
  const getAuthHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // --- 1. Fetch Members ---
  async function fetchMembers() {
    if (!trip || !trip.trip_id) { // Note: changed trip.id to trip.trip_id based on your schema
      setMembers([]); return;
    }
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/trips/${trip.trip_id}/members`, {
        headers: { Accept: 'application/json', ...getAuthHeaders() },
      });
      if (!res.ok) throw new Error(`Failed to load members (${res.status})`);
      
      const data = await res.json();
      setMembers(data || []);
    } catch (err) {
      console.error('fetchMembers', err);
      setMembersError('Could not load members.');
    } finally {
      setMembersLoading(false);
    }
  }

  useEffect(() => {
    fetchMembers();
  }, [trip]);

  // --- 2. Fetch All Users (for matching) ---
  async function fetchAllUsers() {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/users', { headers: { Accept: 'application/json', ...getAuthHeaders() } });
      if (res.ok) {
        const rows = await res.json();
        setAllUsers(rows || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => {
    if (showModal) {
      // Reset form
      setEmailInput('');
      setEnteredEmails([]);
      setEmailValidationError(null);
      setMessage('');
      fetchAllUsers();
    }
  }, [showModal]);

  // --- 3. Email Logic ---
  const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());

  const findUserByEmailSync = (email) => {
    if (!email) return null;
    return (allUsers || []).find(u => (String(u.email || '').toLowerCase() === email.toLowerCase()));
  };

  const addEmail = async () => {
    const raw = (emailInput || '').trim();
    setEmailValidationError(null);

    if (!isValidEmail(raw)) {
      setEmailValidationError('Please enter a valid email address.');
      return;
    }

    // CHECK 1: Is this email already in the invite list?
    if (enteredEmails.find(x => x.email.toLowerCase() === raw.toLowerCase())) {
      setEmailValidationError('Email already added to this invite list.');
      return;
    }

    // CHECK 2 (The Fix): Is this user ALREADY a member or invited?
    const existingMember = members.find(m => m.email && m.email.toLowerCase() === raw.toLowerCase());
    if (existingMember) {
      const status = existingMember.status === 'accepted' ? 'joined' : 'invited';
      setEmailValidationError(`User already ${status}: ${existingMember.name}`);
      return;
    }

    // CHECK 3: Does the user exist in the system?
    let matched = findUserByEmailSync(raw);
    
    // If not found locally, try remote query
    if (!matched) {
        try {
            const res = await fetch(`/api/users?query=${encodeURIComponent(raw)}`, { headers: { Accept: 'application/json', ...getAuthHeaders() } });
            if (res.ok) {
                const rows = await res.json();
                matched = rows.find(r => r.email.toLowerCase() === raw.toLowerCase());
            }
        } catch(e) { /* ignore */ }
    }

    if (!matched) {
      setEmailValidationError(`User not found. You can only invite existing users.`);
      return;
    }

    setEnteredEmails(prev => [...prev, { email: raw, matchedUser: matched }]);
    setEmailInput('');
  };

  const removeEmail = (email) => {
    setEnteredEmails(prev => prev.filter(x => x.email !== email));
  };

  // --- 4. Send Invites ---
  const sendInvites = async () => {
    if (!enteredEmails.length) return;
    setInviteLoading(true);
    setInviteError(null);

    // Only send IDs, as per our backend logic
    const invited_user_ids = enteredEmails
      .filter(e => e.matchedUser)
      .map(e => Number(e.matchedUser.id));

    const payload = {
      invited_user_ids,
      message,
      role: 'member',
    };

    try {
      // FIX: Correct URL
      const res = await fetch(`/api/trips/${trip.trip_id}/members/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed');
      }

      // FIX: Removed the redundant /api/notifications call block here. 
      // The backend handles it.

      await fetchMembers(); // Refresh list
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setInviteError(err.message || 'Failed to send invites.');
    } finally {
      setInviteLoading(false);
    }
  };

  // --- 5. Remove Member Logic ---
  const handleRemoveMember = async (membershipId, memberName, isMe) => {
    const action = isMe ? "leave this trip" : `remove ${memberName}`;
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;

    try {
      const res = await fetch(`/api/trips/${trip.trip_id}/members/${membershipId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed');
      }
      
      if (isMe) {
        // If I left, redirect to dashboard
        window.location.href = '/dashboard'; 
      } else {
        await fetchMembers();
      }
    } catch (err) {
      alert(err.message);
    }
  };

 const renderStatusBadge = (m) => {
  const role = (m.role || '').toLowerCase();
  const status = (m.status || '').toLowerCase();

  // Prioritize explicit role (owner/organizer) over status
  if (role === 'owner') return <Badge bg="primary">Owner</Badge>;
  if (role === 'organizer') return <Badge bg="primary">Organizer</Badge>;

  if (status === 'accepted') return <Badge bg="success">Member</Badge>;
  if (status === 'invited') return <Badge bg="warning" text="dark">Invited</Badge>;

  // Fallback label to whichever is available
  return <Badge bg="secondary">{role || status || 'Member'}</Badge>;
};

  return (
    <Card className="shadow mb-4">
      <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
        <h6 className="m-0 font-weight-bold text-primary">Members</h6>
        {/* FIX: Only organizer sees Add button */}
        {isOrganizer && (
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>+ Add People</Button>
        )}
      </Card.Header>

      <Card.Body>
        {membersLoading ? (
          <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
        ) : membersError ? (
          <p className="text-danger small">{membersError}</p>
        ) : (
          <ListGroup variant="flush">
            {members.map((m) => {
              const isMe = memberUserId(m) === currentUserId;
              const targetIsOrganizer = (m.role === 'organizer' || m.role === 'owner');
              
              // Logic: Can I remove this person?
              // 1. I can remove myself (Leave) - unless I am the organizer
              // 2. I can remove others if I am organizer AND they are not organizer
              let canAction = false;
              if (isMe && !targetIsOrganizer) canAction = true; // Leave
              if (isOrganizer && !isMe && !targetIsOrganizer) canAction = true; // Remove
              
              return (
                <ListGroup.Item key={m.id} className="d-flex justify-content-between align-items-center px-0">
                  <div>
                    <div className="fw-bold" style={{ fontSize: '0.9rem' }}>
                        {m.name} {isMe ? '(You)' : ''}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{m.email}</div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {renderStatusBadge(m)}
                    
                    {canAction && (
                       <Button 
                         variant={isMe ? "outline-secondary" : "outline-danger"}
                         size="sm" 
                         style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                         onClick={() => handleRemoveMember(m.id, m.name, isMe)}
                         title={isMe ? "Leave Trip" : "Remove Member"}
                       >
                         {isMe ? "Leave" : "Remove"}
                       </Button>
                    )}
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        )}
      </Card.Body>

      {/* Invite Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Invite Members</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <InputGroup>
              <Form.Control
                type="email"
                placeholder="Enter email..."
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addEmail()}
              />
              <Button variant="outline-secondary" onClick={addEmail}>Add</Button>
            </InputGroup>
            {emailValidationError && <div className="text-danger small mt-1">{emailValidationError}</div>}
            
            <div className="mt-2 d-flex flex-wrap gap-2">
              {enteredEmails.map((e) => (
                <Badge key={e.email} bg="light" text="dark" className="border d-flex align-items-center">
                  {e.matchedUser?.name || e.email}
                  <span 
                    style={{ cursor: 'pointer', marginLeft: '5px', fontWeight: 'bold' }} 
                    onClick={() => removeEmail(e.email)}
                  >×</span>
                </Badge>
              ))}
            </div>
          </Form.Group>

          <Form.Group>
            <Form.Label>Message</Form.Label>
            <Form.Control as="textarea" rows={2} value={message} onChange={(e) => setMessage(e.target.value)} />
          </Form.Group>
          {inviteError && <div className="text-danger small mt-2">{inviteError}</div>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={sendInvites} disabled={inviteLoading}>
            {inviteLoading ? 'Sending...' : 'Send Invites'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}