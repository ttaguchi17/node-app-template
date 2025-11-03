// src/pages/TripDetailsPage/components/TripItineraryBox.jsx
import React from 'react';
import { Card, Button, Alert, ListGroup, Badge, CloseButton } from 'react-bootstrap';

// Date formatter — This is your new version, it looks great!
const fmtDate = (s) => {
  if (!s) return '—';
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const dateStr = d.toLocaleDateString();
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return (
        <>
          {dateStr}
          <br />
          {timeStr}
        </>
      );
    }
    return String(s);
  } catch (e) { return String(s); }
};

// 1. We must accept the 'deleteEvent' function as a prop
export default function TripItineraryBox({ events, fetchError, onAddEventClick, canAddEvents, deleteEvent, onEditEventClick }) {
  return (
    <Card className="shadow mb-4">
      <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
        <h6 className="m-0 font-weight-bold text-primary">Events</h6>
        <Button variant="primary" size="sm" onClick={onAddEventClick} disabled={!canAddEvents}>
          + Add Event
        </Button>
      </Card.Header>
      <Card.Body>
        {fetchError && <Alert variant="danger">Could not load itinerary details.</Alert>}
        {events.length > 0 ? (
          <ListGroup variant="flush">
            {events.map(ev => (
              // Use the database event_id as the key
              <ListGroup.Item key={ev.event_id ?? ev.id} className="d-flex justify-content-between align-items-start px-0">
                <div>
                  <div className="fw-bold text-dark">{ev.title ?? ev.name ?? 'Untitled Event'}</div>
                  <small className="text-muted">{ev.start_time ? fmtDate(ev.start_time) : ev.time ?? ''}</small>
                  {ev.location && <div className="small text-muted mt-1">{ev.location}</div>}
                </div>
                
                {/* 2. Wrap the Badge and CloseButton in a flex container */}
                <div className="d-flex align-items-center">
                  <Badge bg="info" pill className="me-3">{ev.type ?? 'Event'}</Badge>
                  <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => onEditEventClick(ev)}>
                    Edit
                  </Button>
                  {/* 3. Add the delete button and connect it to the prop (safe-guard) */}
                  <CloseButton onClick={() => { if (typeof deleteEvent === 'function') deleteEvent(ev.event_id); }} />
                </div>

              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <p className="text-muted small">
            {canAddEvents ? "(No events added yet.)" : "Save the trip to add events."}
          </p>
        )}
      </Card.Body>
    </Card>
  );
}