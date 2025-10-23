// src/components/TripDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Form, Alert, ListGroup, Badge } from 'react-bootstrap';

function TripDetailsModal({ trip, show, onClose }) {
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
  
  // --- Helper Function to Reset Form ---
  const resetForm = () => {
    setTitle('');
    setType('Activity');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setDetails('');
  };

  // --- Function to Fetch Events ---
  const fetchEvents = async (tripId) => {
    if (!tripId) return; // Don't fetch if there's no trip

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3000/api/trips/${tripId}/events`, {
        headers: { 'Authorization': token }
      });
      if (!response.ok) {
        throw new Error('Could not fetch events.');
      }
      const data = await response.json();
      setEvents(data); // Set the events list
    } catch (err) {
      setMessage(err.message);
    }
  };

  // --- UseEffect to Fetch Events ---
  // This runs when the modal is shown or when the 'trip' prop changes.
  useEffect(() => {
    if (show && trip) {
      fetchEvents(trip.trip_id);
    }
  }, [show, trip]); // Dependencies

  // --- Form Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    setIsLoading(true);
    setMessage('');
    
    if (addType === 'Event') {
      // 1. Validation
      if (!title || !startTime) {
        setMessage('Event Name and Start Time are required.');
        setIsLoading(false);
        return;
      }
      
      // 2. Send ALL data from the form
      try {
        const response = await fetch(`http://localhost:3000/api/trips/${trip.trip_id}/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify({
            title: title,
            details: details || null,
            type: type,
            start_time: startTime,
            end_time: endTime || null,
            location: location || null
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Failed to add event');
        }

        // 3. Success
        setMessage('Event added successfully!');
        setShowAddSection(false); // Hide the form
        resetForm(); // Clear the form fields
        fetchEvents(trip.trip_id); // 4. REFRESH the event list!
        
      } catch (err) {
        setMessage(err.message);
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
        {/* We replaced 'input-group' with 'mb-3' for correct spacing */}
        <Form.Group className="mb-3" controlId="eventName">
          <Form.Label>Event Name</Form.Label>
          <Form.Control type="text" placeholder="Enter event name" value={title} onChange={(e) => setTitle(e.target.value)} required />
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
            {/* 'mb-3' is also used here */}
            <Form.Group className="mb-3" controlId="eventStartTime">
              <Form.Label>Start Time</Form.Label>
              <Form.Control type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="eventEndTime">
              <Form.Label>End Time (Optional)</Form.Label>
              <Form.Control type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3" controlId="eventLocation">
          <Form.Label>Location (Optional)</Form.Label>
          <Form.Control type="text" placeholder="e.g., Eiffel Tower" value={location} onChange={(e) => setLocation(e.target.value)} />
        </Form.Group>

        <Form.Group className="mb-3" controlId="eventDetails">
          <Form.Label>Description / Details (Optional)</Form.Label>
          <Form.Control as="textarea" rows={3} placeholder="e.g., Confirmation #12345" value={details} onChange={(e) => setDetails(e.target.value)} />
        </Form.Group>
      </>
    );
  };

  if (!trip) return null; // Render nothing if no trip

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{trip.name}</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {/* --- Add to Trip Section --- */}
        <div className="actions">
          <h3>Add to Trip</h3>
          <button id="addBtn" onClick={() => setShowAddSection(!showAddSection)}>
            {showAddSection ? '− Cancel' : '+ Add'}
          </button>
        </div>

        {/* --- Dynamic Form Section --- */}
        {showAddSection && (
          <Form className="add-section" style={{display: 'block'}} onSubmit={handleSubmit}>
            <Form.Select id="addType" value={addType} onChange={(e) => setAddType(e.target.value)} className="mb-2">
              <option value="">Choose what to add</option>
              <option value="Event">Event</option>
              <option value="Budget" disabled>Expense (coming soon)</option>
              <option value="People" disabled>Attendees (coming soon)</option>
            </Form.Select>

            <div id="fields" className="mt-2">
              {renderFields()}
            </div>
            
            {message && <Alert variant={message.includes('success') ? 'success' : 'danger'} className="mt-3">{message}</Alert>}
            
            {/* Only show submit button if a type is selected */}
            {addType && (
              <button className="submit" id="submitBtn" type="submit" disabled={isLoading}>
                {isLoading ? 'Adding...' : `Submit ${addType}`}
              </button>
            )}
          </Form>
        )}

        {/* --- Trip Details Section (Now shows event list) --- */}
        <div className="details">
          <h3>Itinerary</h3>
          <ListGroup id="detailList" variant="flush">
            {events.length > 0 ? (
              events.map(event => (
                <ListGroup.Item key={event.event_id} className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fw-bold text-dark">{event.title}</div>
                    <small className="text-muted">{new Date(event.start_time).toLocaleString()}</small>
                  </div>
                  <Badge bg="info">{event.type}</Badge>
                </ListGroup.Item>
              ))
            ) : (
              <p>(No events added yet.)</p>
            )}
          </ListGroup>
        </div>
        {/* We can add your "see more" link here later */}

      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default TripDetailsModal;