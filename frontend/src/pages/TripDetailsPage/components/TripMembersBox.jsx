// src/pages/TripDetailsPage/components/TripMembersBox.jsx
import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Modal,
  Form,
  ListGroup,
  Spinner,
  Badge,
  InputGroup,
} from 'react-bootstrap';

/**
 * Simplified TripMembersBox - safe for most projects
 * - Uses react-bootstrap widely-supported props (variant)
 * - No JWT decoding, no atob usage
 * - Email entry + invite flow kept
 */

export default function TripMembersBox({ trip }) {
  const [showModal, setShowModal] = useState(false);

  // members
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState(null);

  // cached users for matching
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);

  // invite inputs
  const [emailInput, setEmailInput] = useState('');
  const [enteredEmails, setEnteredEmails] = useState([]); // {email, matchedUser}
  const [emailValidationError, setEmailValidationError] = useState(null);

  const [message, setMessage] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);

  const getAuthHeaders = () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('access_token');
      if (token) return { Authorization: `Bearer ${token}` };
    } catch (e) { /* ignore */ }
    return {};
  };

  async function fetchMembers() {
    if (!trip || !trip.id) {
      setMembers([]);
      return;
    }
    setMembersLoading(true);
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
    } catch (err) {
      console.error('fetchMembers', err);
      setMembersError('Network error while loading members.');
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id]);

  // fetch small user list for exact email match
  async function fetchAllUsers() {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await fetch('/api/users', { headers: { Accept: 'application/json', ...getAuthHeaders() } });
      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        setUsersError(`Failed to fetch users (${res.status})${txt ? `: ${txt}` : ''}`);
        setAllUsers([]);
        return;
      }
      const rows = await res.json();
      setAllUsers(rows || []);
    } catch (err) {
      console.error('fetchAllUsers', err);
      setUsersError('Network error fetching users.');
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

  const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());

  const findUserByEmailSync = (email) => {
    if (!email) return null;
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
  };

  const addEmail = async () => {
    const raw = (emailInput || '').trim();
    if (!raw) { setEmailValidationError('Enter an email address.'); return; }
    if (!isValidEmail(raw)) { setEmailValidationError('Please enter a valid email address.'); return; }
    if (enteredEmails.find(x => x.email.toLowerCase() === raw.toLowerCase())) { setEmailValidationError('Email already added.'); return; }

    let matched = findUserByEmailSync(raw);
    if (!matched) matched = await findUserByEmailRemote(raw);
    if (matched) {
      setAllUsers(prev => prev && !prev.find(u => String(u.id) === String(matched.id)) ? [...prev, matched] : prev);
    }

    setEnteredEmails(prev => [...prev, { email: raw, matchedUser: matched ? { id: String(matched.id ?? matched.user_id ?? ''), name: matched.name, email: matched.email } : null }]);
    setEmailInput('');
    setEmailValidationError(null);
  };

  const removeEmail = (email) => setEnteredEmails(prev => prev.filter(x => x.email !== email));

  const sendInvites = async () => {
    if (!trip || !trip.id) { setInviteError('No trip selected.'); return; }
    if (enteredEmails.length === 0) { setInviteError('Enter at least one full email address to invite.'); return; }
    setInviteError(null);
    setInviteLoading(true);

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

    try {
      const res = await fetch(`/api/trips/${trip.id}/invitations`, {
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
    } catch (err) {
      console.error('sendInvites', err);
      setInviteError(err.message || 'Failed to send invites.');
      await fetchMembers();
    } finally {
      setInviteLoading(false);
    }
  };

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


  return (
    <Card className="shadow mb-4">
      <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
        <h6 className="m-0 font-weight-bold text-primary">Members</h6>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>+ Add People</Button>
      </Card.Header>

      <Card.Body>
        {membersLoading ? (
          <div className="text-center py-3"><Spinner animation="border" /></div>
        ) : membersError ? (
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
        ) : (
          <p className="text-muted small">No members yet. Add people to this trip!</p>
        )}
      </Card.Body>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Invite Members</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <InputGroup>
              <Form.Control
                type="email"
                placeholder="Enter full email address (press Enter to add)"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEmail(); } }}
              />
              <Button variant="outline-secondary" onClick={addEmail}>Add</Button>
            </InputGroup>
            {emailValidationError && <div className="text-danger small mt-1">{emailValidationError}</div>}
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
            </div>
          </Form.Group>

          <Form.Group>
            <Form.Label>Message (optional)</Form.Label>
            <Form.Control as="textarea" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hey, join our trip!" />
          </Form.Group>
          {inviteError && <div className="text-danger small mt-2">{inviteError}</div>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={inviteLoading}>Cancel</Button>
          <Button variant="primary" onClick={sendInvites} disabled={inviteLoading}>
            {inviteLoading ? 'Sending...' : 'Send Invites'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}
