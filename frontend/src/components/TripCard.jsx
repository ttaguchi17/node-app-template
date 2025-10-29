// src/components/TripCard.jsx
import React from 'react';
import { Card, Badge, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom'; // 1. We need this for navigation

// We accept the 'onCardClick' prop from TripList (which gets it from DashboardPage)
function TripCard({ trip, onCardClick }) {
  
  // 2. Get the trip ID for the <Link>
  const tripId = trip.trip_id ?? trip.id;

  // 3. This is CRITICAL. It stops the "More..." button
  //    from also triggering the card's onClick handler.
  const handleButtonStop = (e) => {
    e.stopPropagation();
  };

  // Helper to format dates (from your file)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };
  const dates = formatDate(trip.start_date) && formatDate(trip.end_date)
    ? `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`
    : 'No dates set';
  
  return (
    <Col xl={4} md={6} className="mb-4">
      {/* 4. This onClick will open the modal */}
      <Card 
        className="h-100 shadow-sm" 
        style={{ cursor: 'pointer' }} 
        onClick={() => onCardClick(trip)}
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
          
          {/* 5. This <Link> navigates to the full page */}
          <Link
            to={`/trips/${tripId}`}
            className="btn btn-outline-primary btn-sm"
            onClick={handleButtonStop} // Use our helper here
          >
            More...
          </Link>

        </Card.Footer>
      </Card>
    </Col>
  );
}

export default TripCard;