// src/pages/TripDetailsPage/components/TripMembersBox.jsx
import React, { useEffect, useState } from 'react';
import {
  Card, Button, Modal, Form, ListGroup, Spinner, Badge, InputGroup,
} from 'react-bootstrap';

<<<<<<< HEAD
/**
 * Simplified TripMembersBox - safe for most projects
 * - Uses react-bootstrap widely-supported props (variant)
 * - No JWT decoding, no atob usage
 * - Email entry + invite flow kept
 */

export default function TripMembersBox({ trip }) {
=======
export default function TripMembersBox({ trip, currentUser }) {
>>>>>>> 032d81a87afbfe3d59f994bc6318df99ff259255
  const [showModal, setShowModal] = useState(false);

  // members
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState(null);

<<<<<<< HEAD
  // cached users for matching
=======
  // users cache for matching
>>>>>>> 032d81a87afbfe3d59f994bc6318df99ff259255
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);

<<<<<<< HEAD
  // invite inputs
  const [emailInput, setEmailInput] = useState('');
  const [enteredEmails, setEnteredEmails] = useState([]); // {email, matchedUser}
=======
  // invite form
  const [emailInput, setEmailInput] = useState('');
  const [enteredEmails, setEnteredEmails] = useState([]); 
>>>>>>> 032d81a87afbfe3d59f994bc6318df99ff259255
  const [emailValidationError, setEmailValidationError] = useState(null);

  const [message, setMessage] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);

<<<<<<< HEAD
  const getAuthHeaders = () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('access_token');
      if (token) return { Authorization: `Bearer ${token}` };
    } catch (e) { /* ignore */ }
    return {};
  };

=======
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
>>>>>>> 032d81a87afbfe3d59f994bc6318df99ff259255
  async function fetchMembers() {
    if (!trip || !trip.trip_id) { // Note: changed trip.id to trip.trip_id based on your schema
      setMembers([]); return;
    }
    setMembersLoading(true);
<<<<<<< HEAD
    setMembersError(null);
    try {
      const res = await fetch(`/api/trips/${trip.id}/members`, { headers: { Accept: 'application/json', ...getAuthHeaders() } });
      if (!res.ok) {
        if (res.status === 401) setMembersError('Unauthorized — sign in.');
        else if (res.status === 403) setMembersError('Access denied.');
        else if (res.status === 404) setMembersError('Members endpoint not found (404).');
        else {
          const txt = await res.text().catch(() => null);
          setMembersError(`Failed to load members (${res.status})${txt ? `: ${txt}` : ''}`);
        }
        setMembers([]);
        return;
      }
      const data = await res.json();
      const normalized = (data || []).map((m) => {
        if (m.user) {
          return {
            id: String(m.user.id ?? m.user.user_id ?? m.id ?? ''),
            user_id: String(m.user.id ?? m.user.user_id ?? ''),
            name: m.user.name ?? m.name ?? `User`,
            email: (m.user.email ?? m.email ?? '').toLowerCase(),
            role: m.role ?? m.user.role ?? 'member',
            status: m.status ?? 'accepted',
          };
        }
        return {
          id: String(m.membership_id ?? m.id ?? ''),
          user_id: String(m.user_id ?? m.userId ?? ''),
          name: m.name ?? `User`,
          email: (m.email ?? '').toLowerCase(),
          role: m.role ?? 'member',
          status: m.status ?? 'accepted',
        };
      });

      normalized.sort((a, b) => {
        const rank = x => {
          if (!x) return 3;
          const r = (x.role || '').toLowerCase();
          if (r === 'owner' || r === 'organizer') return 0;
          if ((x.status || '').toLowerCase() === 'invited') return 1;
          if ((x.status || '').toLowerCase() === 'accepted') return 2;
          return 3;
        };
        return rank(a) - rank(b);
      });

      setMembers(normalized);
=======
    try {
      const res = await fetch(`/api/trips/${trip.trip_id}/members`, {
        headers: { Accept: 'application/json', ...getAuthHeaders() },
      });
      if (!res.ok) throw new Error(`Failed to load members (${res.status})`);
      
      const data = await res.json();
      setMembers(data || []);
>>>>>>> 032d81a87afbfe3d59f994bc6318df99ff259255
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

<<<<<<< HEAD
  // fetch small user list for exact email match
=======
  // --- 2. Fetch All Users (for matching) ---
>>>>>>> 032d81a87afbfe3d59f994bc6318df99ff259255
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

<<<<<<< HEAD
=======
  // --- 3. Email Logic ---
>>>>>>> 032d81a87afbfe3d59f994bc6318df99ff259255
  const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());

  const findUserByEmailSync = (email) => {
    if (!email) return null;
<<<<<<< HEAD
    const e = email.toLowerCase();
    return (allUsers || []).find(u => (String(u.email || u.user_email || '').toLowerCase() === e)) || null;
  };

  const findUserByEmailRemote = async (email) => {
    if (!email) return null;
    try {
      const res = await fetch(`/api/users?query=${encodeURIComponent(email)}`, { headers: { Accept: 'application/json', ...getAuthHeaders() } });
      if (!res.ok) return null;
      const rows = await res.json();
      const e = email.toLowerCase();
      return (rows || []).find(r => (String(r.email || r.user_email || '').toLowerCase() === e)) || null;
    } catch (err) {
      return null;
    }
=======
    return (allUsers || []).find(u => (String(u.email || '').toLowerCase() === email.toLowerCase()));
>>>>>>> 032d81a87afbfe3d59f994bc6318df99ff259255
  };

  const addEmail = async () => {
    const raw = (emailInput || '').trim();
<<<<<<< HEAD
    if (!raw) { setEmailValidationError('Enter an email address.'); return; }
    if (!isValidEmail(raw)) { setEmailValidationError('Please enter a valid email address.'); return; }
    if (enteredEmails.find(x => x.email.toLowerCase() === raw.toLowerCase())) { setEmailValidationError('Email already added.'); return; }

    let matched = findUserByEmailSync(raw);
    if (!matched) matched = await findUserByEmailRemote(raw);
    if (matched) {
      setAllUsers(prev => prev && !prev.find(u => String(u.id) === String(matched.id)) ? [...prev, matched] : prev);
    }

    setEnteredEmails(prev => [...prev, { email: raw, matchedUser: matched ? { id: String(matched.id ?? matched.user_id ?? ''), name: matched.name, email: matched.email } : null }]);
=======
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
>>>>>>> 032d81a87afbfe3d59f994bc6318df99ff259255
    setEmailInput('');
  };

  const removeEmail = (email) => setEnteredEmails(prev => prev.filter(x => x.email !== email));

<<<<<<< HEAD
  const sendInvites = async () => {
    if (!trip || !trip.id) { setInviteError('No trip selected.'); return; }
    if (enteredEmails.length === 0) { setInviteError('Enter at least one full email address to invite.'); return; }
    setInviteError(null);
=======
  // --- 4. Send Invites ---
  const sendInvites = async () => {
    if (!enteredEmails.length) return;
>>>>>>> 032d81a87afbfe3d59f994bc6318df99ff259255
    setInviteLoading(true);
    setInviteError(null);

<<<<<<< HEAD
    const invited_user_ids = [];
    const invited_emails = [];
    enteredEmails.forEach(e => {
      if (e.matchedUser && e.matchedUser.id) invited_user_ids.push(Number(e.matchedUser.id));
      else invited_emails.push(e.email);
    });

    // optimistic
    setMembers(prev => [...prev, ...enteredEmails.map(e => ({ id: `email:${e.email}`, user_id: null, name: e.email, email: e.email, role: 'member', status: 'invited', optimistic: true }))]);
    setShowModal(false);

    const payload = { invited_user_ids, invited_emails, message, role: 'member' };
=======
    // Only send IDs, as per our backend logic
    const invited_user_ids = enteredEmails
      .filter(e => e.matchedUser)
      .map(e => Number(e.matchedUser.id));

    const payload = {
      invited_user_ids,
      message,
      role: 'member',
    };
>>>>>>> 032d81a87afbfe3d59f994bc6318df99ff259255

    try {
      // FIX: Correct URL
      const res = await fetch(`/api/trips/${trip.trip_id}/members/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
<<<<<<< HEAD
      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        throw new Error(txt || `Invites API failed (${res.status})`);
      }

      await fetchMembers();
      setEnteredEmails([]);
      setMessage('');
=======

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed');
      }

      // FIX: Removed the redundant /api/notifications call block here. 
      // The backend handles it.

      await fetchMembers(); // Refresh list
      setShowModal(false);
>>>>>>> 032d81a87afbfe3d59f994bc6318df99ff259255
    } catch (err) {
      console.error(err);
      setInviteError(err.message || 'Failed to send invites.');
<<<<<<< HEAD
      await fetchMembers();
=======
>>>>>>> 032d81a87afbfe3d59f994bc6318df99ff259255
    } finally {
      setInviteLoading(false);
    }
  };

<<<<<<< HEAD
  const renderStatusBadge = (m) => {
  const roleLower = (m.role || '').toLowerCase();
  const statusLower = (m.status || '').toLowerCase();

  // Color codes:
  // Owner -> Blue, Invited -> Yellow, Member -> Green
  if (roleLower === 'owner' || roleLower === 'organizer') {
    return <Badge bg="primary" text="light">Owner</Badge>; // Blue
  }
  if (statusLower === 'invited') {
    return <Badge bg="warning" text="dark">Invited</Badge>; // Yellow
  }
  if (statusLower === 'accepted' || statusLower === 'member') {
    return <Badge bg="success" text="light">Member</Badge>; // Green
  }

  // default for anything else
  return <Badge bg="secondary" text="light">{m.role || m.status || 'Member'}</Badge>;
};

=======
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
>>>>>>> 032d81a87afbfe3d59f994bc6318df99ff259255

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
<<<<<<< HEAD
          <div>
            <p className="text-danger small">{membersError}</p>
            <div className="d-flex gap-2">
              <Button size="sm" variant="outline-secondary" onClick={fetchMembers}>Retry</Button>
            </div>
          </div>
        ) : members && members.length > 0 ? (
          <ListGroup>
            {members.map(m => (
              <ListGroup.Item key={m.id} className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-bold">{m.name}{m.optimistic ? ' (sending...)' : ''}</div>
                  <div className="text-muted small">{m.email}</div>
                </div>
                <div>{renderStatusBadge(m)}</div>
              </ListGroup.Item>
            ))}
          </ListGroup>
=======
          <p className="text-danger small">{membersError}</p>
>>>>>>> 032d81a87afbfe3d59f994bc6318df99ff259255
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

<<<<<<< HEAD
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Invite Members</Modal.Title></Modal.Header>
=======
      {/* Invite Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Invite Members</Modal.Title>
        </Modal.Header>
>>>>>>> 032d81a87afbfe3d59f994bc6318df99ff259255
        <Modal.Body>
          <Form.Group className="mb-3">
            <InputGroup>
              <Form.Control
                type="email"
                placeholder="Enter email..."
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
<<<<<<< HEAD
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEmail(); } }}
=======
                onKeyDown={(e) => e.key === 'Enter' && addEmail()}
>>>>>>> 032d81a87afbfe3d59f994bc6318df99ff259255
              />
              <Button variant="outline-secondary" onClick={addEmail}>Add</Button>
            </InputGroup>
            {emailValidationError && <div className="text-danger small mt-1">{emailValidationError}</div>}
<<<<<<< HEAD
            <div className="mt-3">
              {enteredEmails.length === 0 ? <div className="text-muted">No emails added yet.</div> : (
                <div className="d-flex flex-wrap gap-2">
                  {enteredEmails.map(e => (
                    <div key={e.email} className="badge bg-light border d-flex align-items-center" style={{ padding: '0.5rem' }}>
                      <div style={{ minWidth: 220 }}>
                        <div style={{ fontWeight: 600 }}>{e.matchedUser?.name ?? e.email}</div>
                        <div style={{ fontSize: 12, color: '#6c757d' }}>{e.email}</div>
                      </div>
                      {e.matchedUser ? <Badge variant="success" className="ms-2">Existing</Badge> : <Badge variant="secondary" className="ms-2">Email</Badge>}
                      <Button size="sm" variant="link" onClick={() => removeEmail(e.email)} style={{ color: '#6c757d', textDecoration: 'none', marginLeft: 8 }}>✕</Button>
                    </div>
                  ))}
                </div>
              )}
=======
            
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
>>>>>>> 032d81a87afbfe3d59f994bc6318df99ff259255
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