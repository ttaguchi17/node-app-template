// src/components/TripList.jsx
import React from 'react';
import TripCard from './TripCard.jsx'; // Import the card component we just made
import { Row } from 'react-bootstrap';    // Import Row for proper grid layout

// This component receives the 'trips' array as a prop
function TripList({ trips, onCardClick, onDeleteClick }) {
  return (
    // Use React-Bootstrap's <Row> to ensure cards align correctly
    <Row>
      {trips.map((trip) => (
        <TripCard key={trip.trip_id} trip={trip} onCardClick={onCardClick} onDeleteClick={onDeleteClick} />
      ))}
    </Row>
  );
}

export default TripList;