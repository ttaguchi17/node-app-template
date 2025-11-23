import React, { useEffect, useState } from 'react';
import { Card, ListGroup, Button, Spinner } from 'react-bootstrap';

export default function DashboardNotifications({ currentUserId, onAcceptDecline }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchNotifications() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/notifications?recipient_user_id=${currentUserId}`);
      if (!res.ok) throw new Error('Failed to load notifications');
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (currentUserId) fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const handleAccept = async (note) => {
    if (!note.metadata?.trip_id) return;
    try {
      await fetch(`/api/trips/${note.metadata.trip_id}/members/${currentUserId}/accept`, { method: 'POST' });
      // optionally mark notification as read
      await fetch(`/api/notifications/${note.id}/read`, { method: 'POST' }).catch(()=>{});
      fetchNotifications();
      if (onAcceptDecline) onAcceptDecline();
    } catch (err) {
      console.error(err);
      alert('Failed to accept invite');
    }
  };

  const handleDecline = async (note) => {
    if (!note.metadata?.trip_id) return;
    try {
      await fetch(`/api/trips/${note.metadata.trip_id}/members/${currentUserId}/decline`, { method: 'POST' });
      await fetch(`/api/notifications/${note.id}/read`, { method: 'POST' }).catch(()=>{});
      fetchNotifications();
      if (onAcceptDecline) onAcceptDecline();
    } catch (err) {
      console.error(err);
      alert('Failed to decline invite');
    }
  };

  if (!currentUserId) return null;

  return (
    <Card className="mb-4">
      <Card.Header>Notifications</Card.Header>
      <Card.Body>
        {loading ? <Spinner animation="border" /> : error ? <div className="text-danger">{error}</div> : notes.length === 0 ? (
          <div className="text-muted">No notifications</div>
        ) : (
          <ListGroup>
            {notes.map((n) => (
              <ListGroup.Item key={n.id} className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="fw-bold">{n.title}</div>
                  <div className="small text-muted">{n.body}</div>
                  {n.type === 'trip_invite' && n.metadata && (
                    <div className="small text-muted">Trip ID: {n.metadata.trip_id}</div>
                  )}
                </div>
                <div className="d-flex flex-column gap-2">
                  {n.type === 'trip_invite' ? (
                    <>
                      <Button size="sm" variant="outline-primary" onClick={() => window.location.href = `/trips/${n.metadata.trip_id}`}>Preview</Button>
                      <Button size="sm" variant="success" onClick={() => handleAccept(n)}>Accept</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDecline(n)}>Decline</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => { /* mark read */ }}>Open</Button>
                  )}
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
}
