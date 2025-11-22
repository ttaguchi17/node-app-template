// src/components/TripDetailsModal.jsx
import React, { useState, useEffect, useRef } from 'react';
// 1. IMPORT LINK
import { Link } from 'react-router-dom';
import { Modal, Button, Row, Col, Form, Alert, ListGroup, Badge, CloseButton } from 'react-bootstrap';
import { apiGet, apiPost } from '../utils/api';

function TripDetailsModal({ trip, show, onClose, deleteEvent }) {
  // --- State for the "Add" Form ---
  const [showAddSection, setShowAddSection] = useState(false);
  const [addType, setAddType] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- State for the "Event" Form Fields ---
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Activity');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');

  // --- State for the Event List ---
  const [events, setEvents] = useState([]);

  const firstFieldRef = useRef(null);

  // Helper: build auth header value safely (adds Bearer if missing)
  const buildAuthHeader = (raw) => {
    if (!raw) return undefined;
    if (raw.toLowerCase().startsWith('bearer ')) return raw;
    return `Bearer ${raw}`;
  };

  // Normalize trip id (works with either trip.trip_id or trip.id)
  const getTripId = () => {
    if (!trip) return null;
    return trip.trip_id ?? trip.id ?? trip.tripId ?? null;
  };

  // --- Helper Function to Reset Form ---
  const resetForm = () => {
    setTitle('');
    setType('Activity');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setDetails('');
    setAddType(''); // Also reset the selected type
  };

  // --- Function to Fetch Events ---
  const fetchEvents = async (tripId) => {
    if (!tripId) return; // Don't fetch if there's no trip
    try {
      const data = await apiGet(`/api/trips/${encodeURIComponent(tripId)}/events`);
      const list = Array.isArray(data) ? data : Array.isArray(data.events) ? data.events : [];
      setEvents(list);
      setMessage('');
    } catch (err) {
      console.warn('fetchEvents error', err);
      setMessage(err.message || 'Failed to load events.');
      setEvents([]);
    }
  };

  // --- UseEffect to Fetch Events ---
  useEffect(() => {
    if (show && getTripId()) {
      setMessage('');
      fetchEvents(getTripId());
    }
    // focus first input if add section visible
    if (show && showAddSection && firstFieldRef.current) {
      firstFieldRef.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, trip]); // Rerun when show or trip changes

  // --- UseEffect to focus input when add section opens ---
  useEffect(() => {
    if (showAddSection && firstFieldRef.current) {
       firstFieldRef.current.focus();
    }
  }, [showAddSection]);

  // --- Form Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    const tripId = getTripId();
    if (!tripId) {
      setMessage('No trip selected.');
      setIsLoading(false);
      return;
    }

    // Guard against local IDs
    if (!/^\d+$/.test(String(tripId))) {
      setMessage('This trip only exists locally. Save it to the server before adding events.');
      setIsLoading(false);
      return;
    }

    const raw = localStorage.getItem('token');
    const auth = buildAuthHeader(raw);

    if (addType === 'Event') {
      // Validation: only title is required; times are optional
      if (!title) {
        setMessage('Event Name is required.');
        setIsLoading(false);
        return;
      }
      if (startTime && endTime && new Date(endTime) < new Date(startTime)) {
        setMessage('End time must be after start time.');
        setIsLoading(false);
        return;
      }

      console.log('🧭 TripDetailsModal: tripId being used for fetch =', tripId);

      // Send data
      try {
        const created = await apiPost(`/api/trips/${encodeURIComponent(tripId)}/events`, {
          title: title,
          details: details || null,
          type: type,
          start_time: startTime,
          end_time: endTime || null,
          location_input: location || null
        });

        setMessage('Event added successfully!');
        setShowAddSection(false);
        resetForm();

        // Update UI instantly - apiPost returns the created event
        if (created && (created.event_id || created.id)) {
          setEvents(prev => [created, ...prev]);
        } else {
          fetchEvents(tripId);
        }
      } catch (err) {
        console.error('add event error', err);
        setMessage(err.message || 'Failed to add event.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setMessage(`'${addType}' feature is not implemented yet.`);
      setIsLoading(false);
    }
  };

  // Renders the correct form fields
  const renderFields = () => {
    if (addType !== 'Event') return null;

    return (
      <>
        <Form.Group className="mb-3" controlId="eventName">
          <Form.Label>Event Name</Form.Label>
          <Form.Control
            ref={firstFieldRef} // Assign ref to the first field
            type="text"
            placeholder="Enter event name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="eventType">
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
            <Form.Group className="mb-3" controlId="eventStartTime">
              <Form.Label>Start Time</Form.Label>
              <Form.Control
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="eventEndTime">
              <Form.Label>End Time (Optional)</Form.Label>
              <Form.Control
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3" controlId="eventLocation">
          <Form.Label>Location (Optional)</Form.Label>
          <Form.Control
            type="text"
            placeholder="e.g., Eiffel Tower"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="eventDetails">
          <Form.Label>Description / Details (Optional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="e.g., Confirmation #12345"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </Form.Group>
      </>
    );
  };

  if (!trip) return null; // Render nothing if no trip

  // 2. GET THE TRIP ID for the link
  const tripId = getTripId();

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{trip.name ?? trip.title ?? 'Trip Details'}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* --- Add to Trip Section --- */}
        <div className="actions d-flex align-items-center justify-content-between mb-3">
          <h5 className="m-0">Add to Trip</h5>
          <Button variant="link" onClick={() => { setShowAddSection(v => !v); setMessage(''); }}>
            {showAddSection ? '− Cancel' : '+ Add'}
          </Button>
        </div>

        {/* --- Dynamic Form Section --- */}
        {showAddSection && (
          <Form className="add-section mb-3" onSubmit={handleSubmit}>
            <Form.Select
              id="addType"
              value={addType}
              onChange={(e) => { setAddType(e.target.value); setMessage(''); }}
              className="mb-2"
              aria-label="Choose what to add"
            >
              <option value="">Choose what to add</option>
              <option value="Event">Event</option>
              <option value="Budget" disabled>Expense (coming soon)</option>
              <option value="People" disabled>Attendees (coming soon)</option>
            </Form.Select>

            <div id="fields" className="mt-2">
              {renderFields()}
            </div>

            {message && <Alert variant={message.includes('success') ? 'success' : 'danger'} className="mt-3">{message}</Alert>}

            {addType && (
              <div className="mt-3">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : `Submit ${addType}`}
                </Button>
              </div>
            )}
          </Form>
        )}

        {/* --- Trip Details Section (Itinerary List) --- */}
        <div className="details">
          <h5>Itinerary</h5>
<ListGroup id="detailList" variant="flush">
      {events.length > 0 ? (
    events.map(event => (
      <ListGroup.Item
        key={event.event_id ?? event.id ?? `${event.title}-${Math.random()}`}
        className="d-flex justify-content-between align-items-start"
      >
        {/* Event Details (Title, Time, Location) */}
        <div>
          <div className="fw-bold text-dark">{event.title ?? event.name ?? 'Untitled Event'}</div>
          <small className="text-muted">
            {event.start_time ? new Date(event.start_time).toLocaleString() : event.time ?? ''}
          </small>
          {event.location && <div className="small text-muted mt-1">{event.location}</div>}
          {event.details && <div className="small text-muted mt-1">{event.details}</div>}
          {event.description && !event.details && <div className="small text-muted mt-1">{event.description}</div>}
        </div>
        
        {/* Badge and Delete Button */}
        <div className="d-flex align-items-center">
          <Badge bg="info" pill className="me-3">{event.type ?? 'Event'}</Badge>
          {deleteEvent && (
            <CloseButton onClick={async () => {
              if (typeof deleteEvent !== 'function') return;
              const ok = await deleteEvent(event.event_id);
              if (ok) fetchEvents(getTripId());
            }} />
          )}
                    </div>
                  </ListGroup.Item>
                ))
              ) : (
                <div className="small text-muted">(No events added yet.)</div>
              )}
            </ListGroup>
        </div>
      </Modal.Body>

      <Modal.Footer>
        {/* 3. ADD THE LINK TO THE FULL PAGE */}
        <Link
          to={`/trips/${tripId}`}
          className="btn btn-primary me-auto" // 'me-auto' pushes it to the left
          onClick={onClose} // Also close the modal when we navigate
        >
          View Full Page...
        </Link>

        {/* 4. KEEP THE ORIGINAL CLOSE BUTTON */}
        <Button variant="outline-secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default TripDetailsModal;