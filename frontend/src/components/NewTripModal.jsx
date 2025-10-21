// src/components/NewTripModal.jsx
import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap'; // Import Form and Alert

// We receive a new prop 'onTripCreated' to tell the dashboard to refresh
function NewTripModal({ show, onClose, onTripCreated }) {
  // 1. Add state for form fields
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // State for error/success messages
  const [message, setMessage] = useState('');
  const [messageVariant, setMessageVariant] = useState('danger'); // 'danger' or 'success'
  const [isLoading, setIsLoading] = useState(false);

  // 2. Implement the form submission logic
  const handleSubmit = async (event) => {
    event.preventDefault(); // Stop the form from reloading the page
    setIsLoading(true);
    setMessage('');

    // Get the auth token from browser storage
    const token = localStorage.getItem('token'); 

    try {
      // Call your backend API
      const response = await fetch('http://localhost:3000/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token // Send the token
        },
        body: JSON.stringify({
          name: tripName,
          start_date: startDate || null, // Send null if the date is empty
          end_date: endDate || null
        })
      });

      const data = await response.json();

      if (response.ok) { // Status 201
        // --- Success ---
        setMessageVariant('success');
        setMessage('Trip created successfully!');
        setIsLoading(false);
        onTripCreated(); // Tell the dashboard to refresh its trip list
        
        // Clear form and close modal after a 1-second delay
        setTimeout(() => {
          setTripName('');
          setStartDate('');
          setEndDate('');
          setMessage('');
          onClose(); // Call the parent's close function
        }, 1000);

      } else {
        // --- Handle server errors ---
        throw new Error(data.message || 'Failed to create trip');
      }

    } catch (error) {
      // --- Handle fetch or other errors ---
      setIsLoading(false);
      setMessageVariant('danger');
      setMessage(error.message);
    }
  };
  
  // Helper to clear form state when modal is closed
  const handleClose = () => {
    setTripName('');
    setStartDate('');
    setEndDate('');
    setMessage('');
    setIsLoading(false);
    onClose();
  };

  return (
    // 3. Update JSX to use React-Bootstrap Form components
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Create a New Trip</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="tripName">
            <Form.Label>Trip Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Summer Getaway"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="tripStartDate">
            <Form.Label>Start Date</Form.Label>
            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="tripEndDate">
            <Form.Label>End Date</Form.Label>
            <Form.Control
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Form.Group>

          {/* Show success/error messages */}
          {message && (
            <Alert variant={messageVariant} className="mt-3">
              {message}
            </Alert>
          )}

          <Button variant="primary" type="submit" className="w-100" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Trip'}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default NewTripModal;