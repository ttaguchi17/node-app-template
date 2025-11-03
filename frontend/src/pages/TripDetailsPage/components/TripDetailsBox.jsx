// src/components/TripDetailsBox.jsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';

// ... (keep your fmtDate helper function) ...
const fmtDate = (s) => {
  if (!s) return '—';
  // ...
  return String(s);
};

// 1. Accept the new 'saveTripDetails' prop
export default function TripDetailsBox({ trip, saveTripDetails }) {
  
  // 2. Add state for all editable fields
  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [message, setMessage] = useState('');

  // 3. This useEffect now "resets" all form fields when the trip data changes
  useEffect(() => {
    if (trip) {
      setTitleInput(trip.title || '');
      setLocationInput(trip.location || '');
      // Format dates for the date input
      setStartDateInput(trip.start_date ? trip.start_date.split('T')[0] : '');
      setEndDateInput(trip.end_date ? trip.end_date.split('T')[0] : '');
    }
    setMessage('');
    setIsEditing(false);
  }, [trip]);

  // 4. This handler now saves *all* fields
  const handleSave = async () => {
    const detailsToSave = {
      name: titleInput,
      location: locationInput,
      start_date: startDateInput || null,
      end_date: endDateInput || null,
    };
    
    const { success, message } = await saveTripDetails(detailsToSave);
    setMessage(message);
    if (success) {
      setIsEditing(false);
    }
  };

  // 5. This handler now resets *all* fields
  const handleCancel = () => {
    setIsEditing(false);
    setTitleInput(trip.title || '');
    setLocationInput(trip.location || '');
    setStartDateInput(trip.start_date ? trip.start_date.split('T')[0] : '');
    setEndDateInput(trip.end_date ? trip.end_date.split('T')[0] : '');
    setMessage('');
  };

  // 6. The JSX is updated to toggle between text and inputs
  return (
    <Card className="shadow mb-4">
      <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
        <h6 className="m-0 font-weight-bold text-primary">Trip Details</h6>
        {!isEditing ? (
          <Button variant="outline-primary" size="sm" onClick={() => setIsEditing(true)}>Edit Trip</Button>
        ) : (
          <div>
            <Button variant="success" size="sm" className="me-2" onClick={handleSave}>Save Changes</Button>
            <Button variant="outline-secondary" size="sm" onClick={handleCancel}>Cancel</Button>
          </div>
        )}
      </Card.Header>
      <Card.Body>
        {message && <Alert variant={message.includes('Failed') ? 'danger' : 'success'}>{message}</Alert>}
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="trip-title">
              <Form.Label className="text-muted small">Trip Name</Form.Label>
              {!isEditing ? (
                <h5 className="text-gray-800">{trip.title}</h5>
              ) : (
                <Form.Control
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                />
              )}
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="trip-location">
              <Form.Label className="text-muted small">Location</Form.Label>
              {!isEditing ? (
                <h5 className="text-gray-800">{trip.location || '—'}</h5>
              ) : (
                <Form.Control
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="City, Country"
                />
              )}
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="trip-start">
              <Form.Label className="text-muted small">Start Date</Form.Label>
              {!isEditing ? (
                <h5 className="text-gray-800">{fmtDate(trip.start_date ?? trip.dates)}</h5>
              ) : (
                <Form.Control
                  type="date"
                  value={startDateInput}
                  onChange={(e) => setStartDateInput(e.target.value)}
                />
              )}
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="trip-end">
              <Form.Label className="text-muted small">End Date</Form.Label>
              {!isEditing ? (
                <h5 className="text-gray-800">{fmtDate(trip.end_date)}</h5>
              ) : (
                <Form.Control
                  type="date"
                  value={endDateInput}
                  onChange={(e) => setEndDateInput(e.target.value)}
                />
              )}
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}