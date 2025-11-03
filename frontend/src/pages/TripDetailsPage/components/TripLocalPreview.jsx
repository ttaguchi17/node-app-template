// src/components/TripLocalPreview.jsx
import React from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function TripLocalPreview({ trip, createTripOnServer, isCreating, createError }) {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);

  return (
    <Card className="shadow mb-4">
      <Card.Header className="py-3">
        <h6 className="m-0 font-weight-bold text-primary">{trip.title || 'Unsaved Trip'}</h6>
      </Card.Header>
      <Card.Body>
        <p className="text-muted small">This trip exists only in your browser (preview).</p>
        {createError && <Alert variant="danger">{createError}</Alert>}
        <Button className="me-2" onClick={createTripOnServer} disabled={isCreating}>
          {isCreating ? 'Saving...' : 'Save Trip to Server'}
        </Button>
        <Button variant="outline-secondary" onClick={goBack}>Cancel</Button>
      </Card.Body>
    </Card>
  );
}