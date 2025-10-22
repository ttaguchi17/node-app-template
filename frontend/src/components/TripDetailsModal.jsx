// src/components/TripDetailsModal.jsx
import React from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';

// Receives 'trip' object, 'show' boolean, and 'onClose' function as props
function TripDetailsModal({ trip, show, onClose }) {
  if (!trip) {
    return null; // Don't render anything if no trip is selected
  }

  // Helper to format dates
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };
  const dates = formatDate(trip.start_date) && formatDate(trip.end_date)
    ? `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`
    : 'No dates set';

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{trip.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          {/* Column for Itinerary */}
          <Col md={6}>
            <h4>Itinerary</h4>
            <p>(Events will go here...)</p>
            {/* TODO: Add 'Add Event' button and list of events */}
          </Col>
          
          {/* Column for Budget, Attendees, etc. */}
          <Col md={6}>
            <h4>Attendees</h4>
            <p>(Attendees list will go here...)</p>
            
            <h4 className="mt-4">Budget</h4>
            <p>(Budget info will go here...)</p>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        {/* The persistent "Details" button (or "Update") */}
        <Button variant="primary">Update Trip</Button>
        <Button variant="outline-secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default TripDetailsModal;