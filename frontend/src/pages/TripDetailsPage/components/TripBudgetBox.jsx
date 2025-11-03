// src/components/TripBudgetBox.jsx
import React from 'react';
import { Card } from 'react-bootstrap';

export default function TripBudgetBox({ trip }) {
  // You can pass the trip prop here later to show real data
  return (
    <Card className="shadow mb-4">
      <Card.Header className="py-3">
        <h6 className="m-0 font-weight-bold text-primary">Budget</h6>
      </Card.Header>
      <Card.Body>
        <p className="text-muted small">(Budget feature coming soon...)</p>
      </Card.Body>
    </Card>
  );
}