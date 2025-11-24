import React from 'react';
import { Card, Button, Alert, ListGroup, Badge, CloseButton, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { Lock, Globe, DollarSign, Edit2 } from 'lucide-react';

// Date formatter
const fmtDate = (s) => {
  if (!s) return '—';
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return (
        <div className="text-center" style={{ lineHeight: '1.2' }}>
          <div className="fw-bold">{timeStr}</div>
          <small className="text-muted">{dateStr}</small>
        </div>
      );
    }
    return String(s);
  } catch (e) { return String(s); }
};

export default function TripItineraryBox({ 
  events, 
  fetchError, 
  onAddEventClick, 
  canAddEvents, 
  deleteEvent, 
  onEditEventClick,
  onAddExpenseFromEvent // <--- NEW PROP: Function to open AddExpenseDialog pre-filled
}) {

  return (
    <Card className="shadow mb-4 border-0">
      <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0 text-primary fw-bold">Itinerary</h5>
        {canAddEvents && (
          <Button variant="primary" size="sm" onClick={onAddEventClick} className="rounded-pill px-3">
            + Add Event
          </Button>
        )}
      </Card.Header>
      
      <Card.Body className="p-0">
        {fetchError && (
          <div className="p-3">
            <Alert variant="warning" className="mb-0">
              Could not load events. Please try refreshing.
            </Alert>
          </div>
        )}
        
        {events.length > 0 ? (
          <ListGroup variant="flush">
            {events.map(ev => (
              <ListGroup.Item 
                key={ev.event_id ?? ev.id} 
                className="d-flex align-items-center p-3 border-bottom"
              >
                {/* 1. Date/Time Column */}
                <div className="me-3" style={{ minWidth: '60px' }}>
                  {ev.start_time ? fmtDate(ev.start_time) : <span className="text-muted small">TBD</span>}
                </div>

                {/* 2. Main Content */}
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center mb-1">
                    <span className="fw-bold text-dark me-2" style={{ fontSize: '1.05rem' }}>
                      {ev.title ?? ev.name ?? 'Untitled Event'}
                    </span>
                    
                    {/* --- PRIVACY BADGES --- */}
                    {ev.is_private ? (
                      <Badge bg="secondary" className="d-flex align-items-center gap-1 py-1" title="Only visible to you">
                        <Lock size={10} /> Private
                      </Badge>
                    ) : (
                      // Optional: Show Globe only if you want to emphasize it's public
                      // <Badge bg="light" text="dark" className="border d-flex align-items-center gap-1 py-1"><Globe size={10}/> Public</Badge>
                      null
                    )}
                  </div>

                  <div className="text-muted small d-flex align-items-center gap-2">
                    <Badge bg="light" text="dark" className="border fw-normal">
                        {ev.type ?? 'Activity'}
                    </Badge>
                    {ev.location_display_name && (
                        <span className="text-truncate" style={{ maxWidth: '200px' }}>
                            📍 {ev.location_display_name}
                        </span>
                    )}
                    {ev.cost > 0 && (
                        <span className="text-success fw-bold">
                            ${parseFloat(ev.cost).toFixed(2)}
                        </span>
                    )}
                  </div>
                </div>
                
                {/* 3. Actions */}
                <div className="d-flex align-items-center gap-2">
                  
                  {/* NEW: Convert to Expense Button */}
                  {/* Only show if it has a cost and we have the handler */}
                  {onAddExpenseFromEvent && (
                    <OverlayTrigger overlay={<Tooltip>Add to Budget</Tooltip>}>
                        <Button 
                            variant="outline-success" 
                            size="sm" 
                            className="border-0"
                            onClick={() => onAddExpenseFromEvent(ev)}
                        >
                            <DollarSign size={16} />
                        </Button>
                    </OverlayTrigger>
                  )}

                  {canAddEvents && (
                    <>
                      <OverlayTrigger overlay={<Tooltip>Edit</Tooltip>}>
                        <Button 
                            variant="outline-secondary" 
                            size="sm" 
                            className="border-0"
                            onClick={() => onEditEventClick(ev)}
                        >
                            <Edit2 size={16} />
                        </Button>
                      </OverlayTrigger>

                      <CloseButton 
                        aria-label="Delete event"
                        onClick={() => { if (typeof deleteEvent === 'function') deleteEvent(ev.event_id ?? ev.id); }} 
                      />
                    </>
                  )}
                </div>

              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
           <div className="text-center py-5">
             <p className="text-muted small mb-0">
               {canAddEvents ? "No events yet. Click '+ Add Event' to start planning!" : "No itinerary events yet."}
             </p>
           </div>
        )}
      </Card.Body>
    </Card>
  );
}