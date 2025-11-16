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
 * TripMembersBox - email-entry invite UI
 *
 * Key behaviors:
 * - Load trip members on mount
 * - Invite modal requires entering full email addresses (press Enter or Add)
 * - Matches entered emails to existing users (best-effort)
 * - Sends invited_user_ids for matched users and invited_emails for unknown emails
 * - Will attach Authorization header when token found in localStorage/cookie
 */

export default function TripMembersBox({ trip }) {
  const [showModal, setShowModal] = useState(false);

  // members
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState(null);

  // optionally keep a cache of known users for matching
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);

  // invite form states
  const [emailInput, setEmailInput] = useState('');
  const [enteredEmails, setEnteredEmails] = useState([]); // [{ email, matchedUser }]
  const [emailValidationError, setEmailValidationError] = useState(null);

  const [message, setMessage] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);

  // helper: find token in localStorage or cookie
  const getToken = () => {
    try {
      const keys = ['token', 'accessToken', 'access_token', 'authToken', 'jwt'];
      for (const k of keys) {
        const v = localStorage.getItem(k);
        if (v) return v;
      }
      const auth = localStorage.getItem('auth');
      if (auth) {
        try {
          const parsed = JSON.parse(auth);
          if (parsed?.token) return parsed.token;
          if (parsed?.accessToken) return parsed.accessToken;
        } catch (e) { /* ignore */ }
      }
      const cookieMatch = document.cookie.match(/(?:^|; )(?:token|access_token|jwt)=([^;]+)/);
      if (cookieMatch) return decodeURIComponent(cookieMatch[1]);
      return null;
    } catch (e) {
      return null;
    }
  };

  const getAuthHeaders = () => {
    const token = getToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  };

  // ---------- Members ----------
  async function fetchMembers() {
    if (!trip || !trip.id) {
      setMembers([]);
      return;
    }
    setMembersLoading(true);
    setMembersError(null);

    try {
      const res = await fetch(`/api/trips/${trip.id}/members`, {
        headers: { Accept: 'application/json', ...getAuthHeaders() },
      });
      if (res.status === 401) {
        setMembersError('Unauthorized — please sign in to view members.');
        setMembers([]);
        return;
      }
      if (res.status === 403) {
        setMembersError('Access denied — you are not a member of this trip.');
        setMembers([]);
        return;
      }
      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        setMembersError(`Failed to load members (${res.status})${txt ? `: ${txt}` : ''}`);
        setMembers([]);
        return;
      }
      const data = await res.json();
      const normalized = (data || []).map((m) => {
        if (m.user) return { id: String(m.user.id), name: m.user.name, email: m.user.email, role: m.role || m.user.role, status: m.status || 'accepted' };
        if (m.user_id || m.userId) {
          return { id: String(m.user_id || m.userId), name: m.name || `User ${m.user_id || m.userId}`, email: m.email || '', role: m.role, status: m.status };
        }
        return { id: String(m.id), name: m.name || `User ${m.id}`, email: m.email || '', role: m.role, status: m.status || 'accepted' };
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

  // ---------- Users cache for matching ----------
  // Load a small set of users for matching (optional)
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

  // called when modal opens (we will still not list users, but keep a cache to match quickly)
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

  // ---------- email helpers ----------
  const isValidEmail = (s) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
  };

  // find existing user by exact email (case-insensitive)
  const findUserByEmailSync = (email) => {
    if (!email) return null;
    const e = email.toLowerCase();
    const found = (allUsers || []).find(u => (String(u.email || u.user_email || '').toLowerCase() === e));
    if (found) return found;
    return null;
  };

  // fallback: query backend for exact email match (uses /api/users?query=...)
  const findUserByEmailRemote = async (email) => {
    if (!email) return null;
    try {
      const res = await fetch(`/api/users?query=${encodeURIComponent(email)}`, { headers: { Accept: 'application/json', ...getAuthHeaders() } });
      if (!res.ok) return null;
      const rows = await res.json();
      // try to find exact match in returned rows
      const e = email.toLowerCase();
      return (rows || []).find(r => (String(r.email || r.user_email || '').toLowerCase() === e)) || null;
    } catch (err) {
      return null;
    }
  };

  const addEmail = async () => {
    const raw = (emailInput || '').trim();
    if (!raw) {
      setEmailValidationError('Enter an email address.');
      return;
    }
    if (!isValidEmail(raw)) {
      setEmailValidationError('Please enter a valid email address.');
      return;
    }
    const already = enteredEmails.find(x => x.email.toLowerCase() === raw.toLowerCase());
    if (already) {
      setEmailValidationError('Email already added.');
      return;
    }

    // try to match locally first
    let matched = findUserByEmailSync(raw);

    // if not matched, attempt remote lookup
    if (!matched) {
      matched = await findUserByEmailRemote(raw);
      // if remote found, add to local cache for subsequent matches
      if (matched) {
        setAllUsers(prev => {
          // avoid duplicates
          if (!prev.find(u => String(u.id) === String(matched.id) || String(u.user_id) === String(matched.user_id))) {
            return [...prev, matched];
          }
          return prev;
        });
      }
    }

    setEnteredEmails(prev => [...prev, { email: raw, matchedUser: matched ? { id: String(matched.id ?? matched.user_id ?? matched.userId ?? matched.ID ?? matched.user_id), name: matched.name ?? matched.full_name ?? null, email: matched.email ?? matched.user_email ?? null } : null }]);
    setEmailInput('');
    setEmailValidationError(null);
  };

  const removeEmail = (email) => {
    setEnteredEmails(prev => prev.filter(x => x.email !== email));
  };

  // ---------- send invites ----------
  const sendInvites = async () => {
    if (!trip || !trip.id) {
      setInviteError('No trip selected.');
      return;
    }
    if (enteredEmails.length === 0) {
      setInviteError('Enter at least one full email address to invite.');
      return;
    }
    setInviteError(null);
    setInviteLoading(true);

    // build invited_user_ids and invited_emails
    const invited_user_ids = [];
    const invited_emails = [];
    for (const e of enteredEmails) {
      if (e.matchedUser && e.matchedUser.id) {
        invited_user_ids.push(Number(e.matchedUser.id));
      } else {
        invited_emails.push(e.email);
      }
    }

    // optimistic update: show emails as invited
    const optimisticMembers = [
      ...members,
      ...enteredEmails.map(e => ({ id: `email:${e.email}`, user_id: null, name: e.email, email: e.email, role: 'member', status: 'invited', optimistic: true })),
    ];
    setMembers(optimisticMembers);
    setShowModal(false);

    const payload = {
      invited_user_ids,
      invited_emails,
      message,
      role: 'member',
    };

    try {
      const res = await fetch(`/api/trips/${trip.id}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) throw new Error('Unauthorized — please sign in to invite members.');
      if (res.status === 403) throw new Error('Access denied — you do not have permission to invite members.');
      if (res.status === 404) throw new Error('Invitations endpoint not found (404). Check backend routes.');
      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(text || `Invites API failed (${res.status})`);
      }

      // best-effort notifications for invited_user_ids
      await Promise.all(invited_user_ids.map(async (uid) => {
        try {
          await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({
              recipient_user_id: Number(uid),
              type: 'trip_invite',
              title: `You were invited to: ${trip.title || trip.name || 'a trip'}`,
              body: message || 'Preview the trip, accept or decline the invitation.',
              metadata: { trip_id: trip.id },
            }),
          });
        } catch (nerr) {
          console.warn('notification failed for', uid, nerr);
        }
      }));

      // refresh members
      await fetchMembers();
      setEnteredEmails([]);
      setMessage('');
    } catch (err) {
      console.error('sendInvites', err);
      setInviteError(err.message || 'Failed to send invites.');
      // rollback by reloading authoritative members
      await fetchMembers();
    } finally {
      setInviteLoading(false);
    }
  };

  const renderStatusBadge = (m) => {
    const s = (m.status || '').toLowerCase();
    if (s === 'owner') return <Badge bg="primary">Owner</Badge>;
    if (s === 'admin') return <Badge bg="secondary">Admin</Badge>;
    if (s === 'accepted') return <Badge bg="success">Member</Badge>;
    if (s === 'invited') return <Badge bg="warning">Invited</Badge>;
    if (s === 'declined') return <Badge bg="danger">Declined</Badge>;
    return <Badge bg="light" text="dark">{m.role || m.status || 'Member'}</Badge>;
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
            {members.map((m) => (
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

      {/* Invite Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Invite Members</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-3">
            <InputGroup>
              <Form.Control
                type="email"
                placeholder="Enter full email address (press Enter to add)"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addEmail();
                  }
                }}
              />
              <Button variant="outline-secondary" onClick={addEmail}>Add</Button>
            </InputGroup>
            {emailValidationError && <div className="text-danger small mt-1">{emailValidationError}</div>}
            <div className="mt-3">
              {enteredEmails.length === 0 ? (
                <div className="text-muted">No emails added yet.</div>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {enteredEmails.map((e) => (
                    <div key={e.email} className="badge bg-light border d-flex align-items-center" style={{ padding: '0.5rem', marginRight: 6 }}>
                      <div style={{ minWidth: 220 }}>
                        <div style={{ fontWeight: 600 }}>{e.matchedUser?.name ?? e.email}</div>
                        <div style={{ fontSize: 12, color: '#6c757d' }}>{e.email}</div>
                      </div>
                      {e.matchedUser ? <Badge bg="success" className="ms-2">Existing</Badge> : <Badge bg="secondary" className="ms-2">Email</Badge>}
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
