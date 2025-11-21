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

  // Helpers to accept either trip.id or trip.trip_id
  const tripId = trip?.trip_id ?? trip?.id ?? null;

  // Auth helpers
  const getToken = () => {
    try {
      return localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('access_token') || null;
    } catch (e) {
      return null;
    }
  };
  const getAuthHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Normalization helpers for currentUser and members
  const currentUserId = String(currentUser?.user_id ?? currentUser?.id ?? currentUser?.userId ?? '');
  const currentUserEmail = String(currentUser?.email ?? '').toLowerCase();

  const memberUserId = (m) => String(m?.user_id ?? m?.userId ?? m?.id ?? m?.user?.id ?? '');
  const memberEmail = (m) => String(m?.email ?? m?.user?.email ?? '').toLowerCase();

  // Determine membership + organizer flag
  const myMembership = members.find((m) => {
    const mid = memberUserId(m);
    if (mid && mid === currentUserId) return true;
    const mEmail = memberEmail(m);
    if (currentUserEmail && mEmail && currentUserEmail === mEmail) return true;
    return false;
  });
  const isOrganizer = Boolean(myMembership && ((myMembership.role || '').toLowerCase() === 'organizer' || (myMembership.role || '').toLowerCase() === 'owner'));

  // --- Fetch members ---
  async function fetchMembers() {
    if (!tripId) {
      setMembers([]);
      return;
    }
    setMembersLoading(true);
    setMembersError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/members`, {
        headers: { Accept: 'application/json', ...getAuthHeaders() },
      });

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

      // Normalize shapes
      const normalized = (data || []).map((m) => {
        if (m.user) {
          return {
            id: String(m.membership_id ?? m.id ?? `membership:${m.user.id}`),
            user_id: String(m.user.id ?? m.user.user_id ?? ''),
            name: m.user.name ?? m.name ?? 'User',
            email: (m.user.email ?? m.email ?? '').toLowerCase(),
            role: m.role ?? m.user.role ?? 'member',
            status: m.status ?? 'accepted',
          };
        }
        return {
          id: String(m.membership_id ?? m.id ?? ''),
          user_id: String(m.user_id ?? m.userId ?? ''),
          name: m.name ?? 'User',
          email: (m.email ?? '').toLowerCase(),
          role: m.role ?? 'member',
          status: m.status ?? 'accepted',
        };
      });

      // Sort owner/organizer first, then invited, accepted, others
      normalized.sort((a, b) => {
        const rank = (x) => {
          const r = (x.role || '').toLowerCase();
          const s = (x.status || '').toLowerCase();
          if (r === 'owner' || r === 'organizer') return 0;
          if (s === 'invited') return 1;
          if (s === 'accepted') return 2;
          return 3;
        };
        return rank(a) - rank(b);
      });

      setMembers(normalized);
    } catch (err) {
      console.error('fetchMembers', err);
      setMembersError('Could not load members.');
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  // --- Fetch all users for matching ---
  async function fetchAllUsers() {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await fetch('/api/users', { headers: { Accept: 'application/json', ...getAuthHeaders() } });
      if (res.ok) {
        const rows = await res.json();
        setAllUsers(rows || []);
      } else {
        setAllUsers([]);
      }
    } catch (err) {
      console.error('fetchAllUsers', err);
      setAllUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => {
    if (showModal) {
      setEmailInput('');
      setEnteredEmails([]);
      setEmailValidationError(null);
      setMessage('');
      fetchAllUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  // --- Email helpers ---
  const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());

  const findUserByEmailSync = (email) => {
    if (!email) return null;
    const e = String(email).toLowerCase();
    return (allUsers || []).find((u) => (String(u.email || u.user_email || '').toLowerCase() === e)) || null;
  };

  const addEmail = async () => {
    const raw = (emailInput || '').trim();
    setEmailValidationError(null);

    if (!raw) {
      setEmailValidationError('Enter an email address.');
      return;
    }
    if (!isValidEmail(raw)) {
      setEmailValidationError('Please enter a valid email address.');
      return;
    }
    if (enteredEmails.find((x) => x.email.toLowerCase() === raw.toLowerCase())) {
      setEmailValidationError('Email already added to this invite list.');
      return;
    }

    // Check if already a member/invited
    const existingMember = members.find((m) => m.email && m.email.toLowerCase() === raw.toLowerCase());
    if (existingMember) {
      const status = (existingMember.status || '').toLowerCase() === 'accepted' ? 'joined' : 'invited';
      setEmailValidationError(`User already ${status}: ${existingMember.name}`);
      return;
    }

    // Try local lookup first
    let matched = findUserByEmailSync(raw);

    // Remote lookup fallback
    if (!matched) {
      try {
        const res = await fetch(`/api/users?query=${encodeURIComponent(raw)}`, { headers: { Accept: 'application/json', ...getAuthHeaders() } });
        if (res.ok) {
          const rows = await res.json();
          matched = (rows || []).find((r) => String(r.email || '').toLowerCase() === raw.toLowerCase()) || null;
          if (matched) setAllUsers((prev) => (prev && !prev.find((u) => String(u.id) === String(matched.id)) ? [...prev, matched] : prev));
        }
      } catch (e) {
        // ignore remote lookup failure
      }
    }

    // Currently require existing users; change behavior here if you want to allow raw email invites
    if (!matched) {
      setEmailValidationError('User not found in system. Please invite existing users only.');
      return;
    }

    setEnteredEmails((prev) => [...prev, { email: raw, matchedUser: matched }]);
    setEmailInput('');
  };

  const removeEmail = (email) => setEnteredEmails((prev) => prev.filter((x) => x.email !== email));

  // --- Send invites ---
  const sendInvites = async () => {
    if (!tripId) {
      setInviteError('No trip selected.');
      return;
    }
    if (enteredEmails.length === 0) {
      setInviteError('Enter at least one full email address to invite.');
      return;
    }

    setInviteLoading(true);
    setInviteError(null);

    const invited_user_ids = enteredEmails
      .filter((e) => e.matchedUser && (e.matchedUser.id || e.matchedUser.user_id))
      .map((e) => Number(e.matchedUser.id ?? e.matchedUser.user_id));

    const payload = { invited_user_ids, message, role: 'member' };

    try {
      // <<< FIXED: use backend route /api/trips/:tripId/invitations (no /members segment) >>>
      const res = await fetch(`/api/trips/${tripId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        throw new Error(txt || `Invites API failed (${res.status})`);
      }

      await fetchMembers();
      setEnteredEmails([]);
      setMessage('');
      setShowModal(false);
    } catch (err) {
      console.error('sendInvites', err);
      setInviteError(err.message || 'Failed to send invites.');
    } finally {
      setInviteLoading(false);
    }
  };

  // --- Remove member / leave ---
  const handleRemoveMember = async (membershipId, memberName, isMe) => {
    const action = isMe ? 'leave this trip' : `remove ${memberName}`;
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;

    try {
      const res = await fetch(`/api/trips/${tripId}/members/${membershipId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(text || `Failed to ${isMe ? 'leave' : 'remove'}`);
      }

      if (isMe) {
        window.location.href = '/dashboard';
      } else {
        await fetchMembers();
      }
    } catch (err) {
      alert(err.message || 'Failed to remove member.');
    }
  };

  // --- UI helpers ---
  const renderStatusBadge = (m) => {
    const role = (m.role || '').toLowerCase();
    const status = (m.status || '').toLowerCase();

    if (role === 'owner') return <Badge bg="primary">Owner</Badge>;
    if (role === 'organizer') return <Badge bg="primary">Organizer</Badge>;
    if (status === 'accepted') return <Badge bg="success">Member</Badge>;
    if (status === 'invited') return <Badge bg="warning" text="dark">Invited</Badge>;

    return <Badge bg="secondary">{role || status || 'Member'}</Badge>;
  };

  return (
    <Card className="shadow mb-4">
      <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
        <h6 className="m-0 font-weight-bold text-primary">Members</h6>
        {isOrganizer && (
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>+ Add People</Button>
        )}
      </Card.Header>

      <Card.Body>
        {membersLoading ? (
          <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
        ) : membersError ? (
          <div>
            <p className="text-danger small">{membersError}</p>
            <div className="d-flex gap-2">
              <Button size="sm" variant="outline-secondary" onClick={fetchMembers}>Retry</Button>
            </div>
          </div>
        ) : members && members.length > 0 ? (
          <ListGroup variant="flush">
            {members.map((m) => {
              const isMe = memberUserId(m) === currentUserId || (currentUserEmail && memberEmail(m) === currentUserEmail);
              const targetIsOrganizer = ((m.role || '').toLowerCase() === 'organizer' || (m.role || '').toLowerCase() === 'owner');

              let canAction = false;
              if (isMe && !targetIsOrganizer) canAction = true; // Leave
              if (isOrganizer && !isMe && !targetIsOrganizer) canAction = true; // Remove others

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
                        variant={isMe ? 'outline-secondary' : 'outline-danger'}
                        size="sm"
                        style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                        onClick={() => handleRemoveMember(m.id, m.name, isMe)}
                        title={isMe ? 'Leave Trip' : 'Remove Member'}
                      >
                        {isMe ? 'Leave' : 'Remove'}
                      </Button>
                    )}
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        ) : (
          <div className="text-muted">No members yet.</div>
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
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEmail(); } }}
              />
              <Button variant="outline-secondary" onClick={addEmail}>Add</Button>
            </InputGroup>
            {emailValidationError && <div className="text-danger small mt-1">{emailValidationError}</div>}

            <div className="mt-2 d-flex flex-wrap gap-2">
              {enteredEmails.map((e) => (
                <Badge key={e.email} bg="light" text="dark" className="border d-flex align-items-center">
                  {e.matchedUser?.name || e.email}
                  <span
                    style={{ cursor: 'pointer', marginLeft: '8px', fontWeight: 'bold' }}
                    onClick={() => removeEmail(e.email)}
                    aria-hidden
                  >
                    ×
                  </span>
                </Badge>
              ))}
              {enteredEmails.length === 0 && <div className="text-muted mt-2">No emails added yet.</div>}
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
