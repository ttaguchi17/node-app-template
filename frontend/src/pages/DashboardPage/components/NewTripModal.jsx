// src/components/NewTripModal.jsx
import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { apiPost } from '../../../utils/api';

// We receive a new prop 'onTripCreated' to tell the dashboard to refresh (or insert)
function NewTripModal({ show, onClose, onTripCreated }) {
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState(''); // required now
  const [message, setMessage] = useState('');
  const [messageVariant, setMessageVariant] = useState('danger');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setIsLoading(true);

    // client-side validation: location is required
    if (!tripName?.trim()) {
      setMessageVariant('danger');
      setMessage('Trip name is required.');
      setIsLoading(false);
      return;
    }
    if (!location?.trim()) {
      setMessageVariant('danger');
      setMessage('Location is required.');
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiPost('/api/trips', {
        name: tripName,
        start_date: startDate || null,
        end_date: endDate || null,
        location_input: location || null // Changed from location to location_input to match backend
      });

      // Success - apiPost only returns on 2xx status
      const createdTrip = data.trip || data;
      setMessageVariant('success');
      setMessage('Trip created successfully!');

      // notify parent (dashboard) so it can insert the trip immediately
      if (typeof onTripCreated === 'function') {
        try { onTripCreated(createdTrip); } catch (e) { console.warn('onTripCreated callback error', e); }
      }

      // clear & close
      setTimeout(() => {
        setTripName(''); setStartDate(''); setEndDate(''); setLocation('');
        setMessage('');
        onClose();
      }, 700);

    } catch (err) {
      console.error('NewTripModal.create error', err);
      setMessageVariant('danger');
      setMessage(err.message || 'Failed to create trip');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTripName(''); setStartDate(''); setEndDate(''); setLocation('');
    setMessage(''); setIsLoading(false);
    onClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Create a New Trip</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="tripName">
            <Form.Label>Trip Name</Form.Label>
            <Form.Control type="text" placeholder="e.g., Summer Getaway" value={tripName} onChange={(e) => setTripName(e.target.value)} required />
          </Form.Group>

          <Form.Group className="mb-3" controlId="tripStartDate">
            <Form.Label>Start Date</Form.Label>
            <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Form.Group>

          <Form.Group className="mb-3" controlId="tripEndDate">
            <Form.Label>End Date</Form.Label>
            <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Form.Group>

          <Form.Group className="mb-3" controlId="tripLocation">
            <Form.Label>Location <span style={{color:'#c00'}}>*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="City, Country (e.g., Tokyo, Japan)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
            <Form.Text className="text-muted">Location is required and is shown on the dashboard tiles.</Form.Text>
          </Form.Group>

          {message && <Alert variant={messageVariant}>{message}</Alert>}

          <Button variant="success" type="submit" className="w-100" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Trip'}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default NewTripModal;
