// src/components/EditEventModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';

// Helper: build auth header
const buildAuthHeader = (raw) => {
  if (!raw) return undefined;
  if (raw.toLowerCase().startsWith('bearer ')) return raw;
  return `Bearer ${raw}`;
};

// Helper: Format date for datetime-local input
const formatDateTimeLocal = (isoString) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    // Format to "YYYY-MM-DDTHH:mm"
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
  } catch (e) {
    return '';
  }
};

export default function EditEventModal({ event, tripId, show, onClose, onEventUpdated }) {
  // --- State for the Form Fields ---
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Activity');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- useEffect to pre-fill the form when 'event' changes ---
  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setType(event.type || 'Activity');
      setStartTime(formatDateTimeLocal(event.start_time));
      setEndTime(formatDateTimeLocal(event.end_time));
      setLocation(event.location_input || '')
      setDetails(event.details || '');
      setMessage('');
    }
  }, [event, show]); // Re-fill form every time modal is shown

  // --- Form Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!title || !startTime) {
      setMessage('Event Name and Start Time are required.');
      setIsLoading(false);
      return;
    }
    
    const payload = {
      title,
      type,
      start_time: new Date(startTime).toISOString(), // Convert back to ISO string
      end_time: endTime ? new Date(endTime).toISOString() : null,
      location_input: location,
      details
    };

    const token = localStorage.getItem('token');
    const auth = buildAuthHeader(token);

    try {
      const res = await fetch(`/api/trips/${tripId}/events/${event.event_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(auth ? { Authorization: auth } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update event.');
      }

      // Success!
      setIsLoading(false);
      onEventUpdated(); // Tell the parent page to refresh its event list
      onClose(); // Close this modal

    } catch (err) {
      console.error('Update event error:', err);
      setMessage(err.message);
      setIsLoading(false);
    }
  };

  if (!event) return null; // Don't render if no event is selected

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Event: {event.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {message && <Alert variant={message.includes('Failed') ? 'danger' : 'success'}>{message}</Alert>}

          <Form.Group className="mb-3" controlId="editEventName">
            <Form.Label>Event Name</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="editEventType">
            <Form.Label>Event Type</Form.Label>
            <Form.Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="Activity">Activity</option>
              <option value="Flight">Flight</option>
              <option value="Hotel">Hotel</option>
              <option value="Transport">Transport</option>
              <option value="Other">Other</option>
            </Form.Select>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="editEventStartTime">
                <Form.Label>Start Time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="editEventEndTime">
                <Form.Label>End Time (Optional)</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3" controlId="editEventLocation">
            <Form.Label>Location (Optional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Eiffel Tower"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="editEventDetails">
            <Form.Label>Description / Details (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="e.g., Confirmation #12345"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </Form.Group>
          
          <div className="d-flex justify-content-end">
             <Button variant="outline-secondary" onClick={onClose} className="me-2">
                Cancel
             </Button>
             <Button variant="primary" type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
             </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}