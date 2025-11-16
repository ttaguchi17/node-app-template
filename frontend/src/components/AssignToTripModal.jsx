// src/components/AssignToTripModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';

// Helper to get the auth token
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token ? `Bearer ${token}` : null;
};

export default function AssignToTripModal({ show, onClose, bookingsToImport }) {
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTripId, setSelectedTripId] = useState('');

  // 1. Fetch the user's existing trips when the modal opens
  useEffect(() => {
    if (show) {
      const fetchUserTrips = async () => {
        setIsLoading(true);
        setError('');
        try {
          const token = getAuthToken();
          if (!token) throw new Error('Authentication token not found.');

          const response = await axios.get('http://localhost:3000/api/trips', {
            headers: { Authorization: token }
          });
          
          setTrips(response.data || []);
          
          // Pre-select the first trip if one exists
          if (response.data && response.data.length > 0) {
            setSelectedTripId(response.data[0].trip_id);
          }
        } catch (err) {
          setError('Could not fetch your trips. ' + (err.response?.data?.message || err.message));
        } finally {
          setIsLoading(false);
        }
      };
      fetchUserTrips();
    }
  }, [show]); // Re-run every time the modal is shown

  // 2. Handle the final "Add to Trip" submission
  const handleSubmit = async () => {
    if (!selectedTripId) {
      setError('Please select a trip.');
      return;
    }

    setIsLoading(true);
    setError('');
    const token = getAuthToken();
    let successCount = 0;
    let failCount = 0;

    // Loop over each selected booking and add it as an event
    for (const booking of bookingsToImport) {
      try {
        // --- THIS IS THE FIX ---
        // We don't create a new 'eventPayload'.
        // We send the original 'booking' object directly.
        // Your backend 'trips.js' route is already built to handle this.
        await axios.post(
          `http://localhost:3000/api/trips/${selectedTripId}/events`,
          booking, // <-- Send the original booking object
          { headers: { Authorization: token } }
        );
        successCount++;
      } catch (err) {
        console.error('Failed to import booking:', booking, err);
        failCount++;
      }
    }

    setIsLoading(false);
    if (failCount > 0) {
      alert(`Successfully imported ${successCount} bookings. Failed to import ${failCount}.`);
    } else {
      alert(`Successfully imported ${successCount} new bookings!`);
    }
    onClose(); // Close the modal
  };

  // 3. Render the content
  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center"><Spinner animation="border" /></div>;
    }
    if (error) {
      return <Alert variant="danger">{error}</Alert>;
    }
    if (trips.length === 0) {
      return (
        <Alert variant="info">
          You have no trips to add this to. Please create a trip from the dashboard first.
          {/* We can add a "Create New Trip" button here later */}
        </Alert>
      );
    }
    return (
      <Form.Group controlId="tripSelect">
        <Form.Label>Select a trip to add these {bookingsToImport.length} bookings to:</Form.Label>
        <Form.Select 
          value={selectedTripId} 
          onChange={(e) => setSelectedTripId(e.target.value)}
        >
          {trips.map(trip => (
            <option key={trip.trip_id} value={trip.trip_id}>
              {trip.name}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
    );
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Assign {bookingsToImport?.length || 0} Bookings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {renderContent()}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={isLoading || trips.length === 0}
        >
          {isLoading ? 'Adding...' : 'Add to Trip'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}