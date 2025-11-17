// src/pages/TripDetailsPage/components/TripItineraryBox.jsx
import React from 'react';
import { Card, Button, Alert, ListGroup, Badge, CloseButton } from 'react-bootstrap';

// Date formatter
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

// 1. Added 'isOrganizer' to props
export default function TripItineraryBox({ events, fetchError, onAddEventClick, canAddEvents, deleteEvent, onEditEventClick, isOrganizer }) {
  return (
    <Card className="shadow mb-4">
      {/* ... Header remains same ... */}
      
      <Card.Body>
        {/* ... Error handling remains same ... */}
        
        {events.length > 0 ? (
          <ListGroup variant="flush">
            {events.map(ev => (
              <ListGroup.Item key={ev.event_id ?? ev.id} className="d-flex justify-content-between align-items-start px-0">
                {/* ... Content div remains same ... */}
                <div>
                  <div className="fw-bold text-dark">{ev.title ?? ev.name ?? 'Untitled Event'}</div>
                  <small className="text-muted">{ev.start_time ? fmtDate(ev.start_time) : ev.time ?? ''}</small>
                  {ev.location && <div className="small text-muted mt-1">{ev.location}</div>}
                </div>
                
                <div className="d-flex align-items-center">
                  <Badge bg="info" pill className="me-3">{ev.type ?? 'Event'}</Badge>
                  <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => onEditEventClick(ev)}>
                    Edit
                  </Button>
                  
                  <CloseButton 
                    aria-label="Delete event"
                    onClick={() => { if (typeof deleteEvent === 'function') deleteEvent(ev.event_id); }} 
                  />
                </div>

              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
           // ... empty state ...
           <p className="text-muted small">
             {canAddEvents ? "(No events added yet.)" : "Save the trip to add events."}
           </p>
        )}
      </Card.Body>
    </Card>
  );
}