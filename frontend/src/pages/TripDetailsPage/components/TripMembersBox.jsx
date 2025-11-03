// src/components/TripMembersBox.jsx
import React from 'react';
import { Card, Button } from 'react-bootstrap';

export default function TripMembersBox({ trip }) {
  return (
    <Card className="shadow mb-4">
      <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
        <h6 className="m-0 font-weight-bold text-primary">Members</h6>
        <Button variant="primary" size="sm" disabled>+ Add People</Button>
      </Card.Header>
      <Card.Body>
        <p className="text-muted small">(Members feature coming soon...)</p>
      </Card.Body>
    </Card>
  );
}