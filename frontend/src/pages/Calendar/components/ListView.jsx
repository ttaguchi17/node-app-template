import React from "react";
import { Card, Badge, Button } from "react-bootstrap";
import { Lock, Calendar } from "lucide-react";

export default function ListView({ events, onAddClick }) {
  if (events.length === 0) {
    return (
      <Card className="shadow-sm text-center py-5">
        <Card.Body>
          <Calendar size={48} className="text-muted mb-3" />
          <h5 className="text-muted">No events scheduled</h5>
          <p className="text-muted">Add your first event to get started</p>
          <Button variant="primary" onClick={onAddClick}>+ Add Event</Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      {events.map((event) => (
        <Card className="shadow-sm mb-3" key={event.id}>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Badge bg="primary" pill style={{ background: event.color, border: "none" }}>{event.tripName}</Badge>
                  {event.isPrivate && <Badge bg="light" text="dark" pill className="d-flex gap-1 border"><Lock size={12} /> Private</Badge>}
                  <Badge bg="light" text="dark" className="border">{event.type}</Badge>
                </div>
                <h5 className="mb-2">{event.eventName}</h5>
                <div className="text-muted small">
                  <strong>Start:</strong> {event.startDate.toLocaleString()}<br/>
                  <strong>End:</strong> {event.endDate.toLocaleString()}
                </div>
                {event.location && <div className="text-muted small mt-2">📍 {event.location}</div>}
              </div>
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}