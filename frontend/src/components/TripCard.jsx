// src/components/TripCard.jsx
import React from 'react';
import { Card, Badge, Col, Button } from 'react-bootstrap';
// We no longer import useNavigate. This is the main change.

// Step 1: Accept the 'onCardClick' prop from TripList
function TripCard({ trip, onCardClick }) {
  
  // Helper to format dates
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };
  const dates = formatDate(trip.start_date) && formatDate(trip.end_date)
    ? `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`
    : 'No dates set';
  
  // Step 2: This handler now calls the 'onCardClick' prop,
  // passing the 'trip' object back up to the DashboardPage.
  const handleCardClick = (e) => {
    e.stopPropagation(); // Prevents multiple clicks if needed
    onCardClick(trip);
  };

  return (
    <Col xl={4} md={6} className="mb-4">
      {/* Step 3: Make the entire Card clickable */}
      <Card 
        className="h-100 shadow-sm" 
        style={{ cursor: 'pointer' }} 
        onClick={handleCardClick}
      >
        <Card.Body>
          <div className="d-flex justify-content-between">
            <div>
              <h5 className="card-title text-gray-800">{trip.name}</h5>
              <p className="card-text small text-muted">
                {dates}
              </p>
            </div>
            <Badge bg="primary" className="align-self-start">Planned</Badge>
          </div>
        </Card.Body>
        <Card.Footer className="bg-white border-top-0 d-flex justify-content-end">
          {/* Step 4: The button does the exact same thing */}
          <Button variant="outline-primary" size="sm" onClick={handleCardClick}>
            View Details
          </Button>
        </Card.Footer>
      </Card>
    </Col>
  );
}

export default TripCard;