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
 * TripMembersBox
 * - Loads members from GET /api/trips/:tripId/members
 * - Loads all users from GET /api/users when modal opens
 * - POST /api/trips/:tripId/invitations to invite users
 * - POST /api/notifications to create notifications (best-effort)
 *
 * If your API paths or shapes differ, change the fetch URLs/response parsing.
 * If your app requires auth headers, add them to the fetch calls.
 */

export default function TripMembersBox({ trip }) {
  const [showModal, setShowModal] = useState(false);

  // members
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState(null);

  // users for invite modal
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);

  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [message, setMessage] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);

  // fetch members
  async function fetchMembers() {
    if (!trip || !trip.id) {
      setMembers([]);
      return;
    }
    setMembersLoading(true);
    setMembersError(null);
    try {
      const res = await fetch(`/api/trips/${trip.id}/members`);
      if (!res.ok) throw new Error(`Failed to load members (${res.status})`);
      const data = await res.json();
      // Expect server to return array with user info or membership rows with user_id
      // Normalize to simple objects: { id, name, email, role, status }
      const normalized = (data || []).map((m) => {
        // if row has user object or user_id, try to normalize
        if (m.user) return { id: String(m.user.id), name: m.user.name, email: m.user.email, role: m.role || m.user.role, status: m.status || 'accepted' };
        if (m.user_id || m.userId) {
          return { id: String(m.user_id || m.userId), name: m.name || `User ${m.user_id || m.userId}`, email: m.email || '', role: m.role, status: m.status };
        }
        // else assume it is a user object
        return { id: String(m.id), name: m.name || `User ${m.id}`, email: m.email || '', role: m.role, status: m.status || 'accepted' };
      });
      setMembers(normalized);
    } catch (err) {
      console.error('fetchMembers', err);
      setMembersError(err.message || 'Failed to load members');
    } finally {
      setMembersLoading(false);
    }
  }

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id]);

  // fetch all users for modal
  async function fetchAllUsers() {
    if (!trip) return;
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error(`Failed to fetch users (${res.status})`);
      const data = await res.json();
      // filter out users already members
      const memberIds = new Set((members || []).map((m) => String(m.id)));
      const filtered = (data || []).filter((u) => !memberIds.has(String(u.id)));
      setAllUsers(filtered);
    } catch (err) {
      console.error('fetchAllUsers', err);
      setUsersError(err.message || 'Failed to fetch users');
      setAllUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => {
    if (showModal) {
      setSelectedUserIds([]);
      setMessage('');
      fetchAllUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  const toggleSelect = (id) => {
    setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const sendInvites = async () => {
    if (!trip || !trip.id || selectedUserIds.length === 0) {
      setInviteError('Select at least one user to invite.');
      return;
    }
    setInviteError(null);
    setInviteLoading(true);

    // optimistic update: show invited users as 'Invited'
    const optimistic = [
      ...members,
      ...allUsers
        .filter((u) => selectedUserIds.includes(String(u.id)))
        .map((u) => ({ id: String(u.id), name: u.name, email: u.email, role: 'member', status: 'invited', optimistic: true })),
    ];
    setMembers(optimistic);
    setShowModal(false);

    const payload = {
      invited_user_ids: selectedUserIds.map((id) => (isNaN(Number(id)) ? id : Number(id))),
      invited_emails: [],
      message,
      role: 'member',
    };

    try {
      const res = await fetch(`/api/trips/${trip.id}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Invites API failed (${res.status})`);
      }

      // create notifications (best-effort)
      await Promise.all(
        selectedUserIds.map(async (uid) => {
          try {
            await fetch('/api/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipient_user_id: isNaN(Number(uid)) ? uid : Number(uid),
                type: 'trip_invite',
                title: `You were invited to: ${trip.title || trip.name || 'a trip'}`,
                body: message || 'Preview the trip, accept or decline the invitation.',
                metadata: { trip_id: trip.id },
              }),
            });
          } catch (nerr) {
            // don't fail the whole flow if notification fails
            console.warn('notification failed for', uid, nerr);
          }
        })
      );

      // refresh authoritative members from server
      await fetchMembers();
      setSelectedUserIds([]);
      setMessage('');
    } catch (err) {
      console.error('sendInvites', err);
      setInviteError(err.message || 'Failed to send invites');
      // rollback: re-fetch members
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
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          + Add People
        </Button>
      </Card.Header>

      <Card.Body>
        {membersLoading ? (
          <div className="text-center py-3"><Spinner animation="border" /></div>
        ) : membersError ? (
          <p className="text-danger small">{membersError}</p>
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
              <Form.Control type="text" placeholder="Search by name or email (not required)" disabled />
              <InputGroup.Text>
                {usersLoading ? <Spinner animation="border" size="sm" /> : 'Users'}
              </InputGroup.Text>
            </InputGroup>
            {usersError && <div className="text-danger small mt-1">{usersError}</div>}
          </Form.Group>

          <div style={{ maxHeight: 300, overflowY: 'auto' }} className="mb-3">
            {usersLoading ? (
              <div className="text-center py-3"><Spinner animation="border" /></div>
            ) : allUsers.length === 0 ? (
              <div className="text-muted">No users found.</div>
            ) : (
              <ListGroup>
                {allUsers.map((user) => (
                  <ListGroup.Item
                    key={user.id}
                    className="d-flex justify-content-between align-items-center"
                    action
                    onClick={() => toggleSelect(String(user.id))}
                  >
                    <div>
                      <div className="fw-bold">{user.name}</div>
                      <div className="text-muted small">{user.email}</div>
                    </div>
                    <Form.Check
                      type="checkbox"
                      checked={selectedUserIds.includes(String(user.id))}
                      readOnly
                    />
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>

          <Form.Group>
            <Form.Label>Message (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hey, join our trip!"
            />
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
