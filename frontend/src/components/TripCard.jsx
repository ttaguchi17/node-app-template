// src/components/TripCard.jsx
import React from 'react';
import { Card, Badge, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// TripCard renders a single trip in the dashboard grid.
// It accepts a `trip` object and an `onCardClick` callback (used to open modal).
function TripCard({ trip, onCardClick }) {
  // robust id getter
  const tripId = trip.trip_id ?? trip.id ?? trip.tripId;

  // prevent the More... button from also triggering the card click
  const handleButtonStop = (e) => {
    e.stopPropagation();
  };

  // Title fallback: prefer name, then title
  const title = trip.name ?? trip.title ?? trip.trip_name ?? 'Untitled Trip';

  // Format a date string (accepts full ISO datetime or plain date)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      // If it looks like an ISO datetime, use Date to localize
      if (String(dateString).includes('T') || String(dateString).match(/^\d{4}-\d{2}-\d{2}/)) {
        const d = new Date(dateString);
        if (!isNaN(d.getTime())) return d.toLocaleDateString();
      }
    } catch (e) {
      // ignore and fall through
    }
    // fallback: try simple split on T, or return raw
    return String(dateString).split('T')[0] || String(dateString);
  };

  // Build the displayed date range. Try many possible fields for compatibility.
  const start = trip.start_date ?? trip.startDate ?? (typeof trip.dates === 'string' ? trip.dates.split(/[-–—]/)[0]?.trim() : null);
  const end = trip.end_date ?? trip.endDate ?? (typeof trip.dates === 'string' ? trip.dates.split(/[-–—]/)[1]?.trim() : null);

  const dates =
    start && end
      ? `${formatDate(start)} - ${formatDate(end)}`
      : (start ? formatDate(start) : (trip.dates ? String(trip.dates) : 'No dates set'));

  // Location fallback: try common property names
  const location =
    trip.location ??
    trip.destination ??
    trip.place ??
    trip.where ??
    trip.location_name ??
    trip.city ??
    '';

  return (
    <Col xl={4} md={6} className="mb-4">
      <Card
        className="h-100 shadow-sm"
        style={{ cursor: 'pointer' }}
        onClick={() => onCardClick && onCardClick(trip)}
      >
        <Card.Body>
          <div className="d-flex justify-content-between">
            <div style={{ minWidth: 0 }}>
              <h5 className="card-title text-gray-800" style={{ marginBottom: 6 }}>{title}</h5>

              <p className="card-text small text-muted" style={{ marginBottom: 4 }}>
                {dates}
              </p>

              {/* NEW: display location if available */}
              <p className="card-text small text-muted" style={{ marginBottom: 0 }}>
                <strong style={{ fontWeight: 600, color: '#333', marginRight: 8 }}>Location</strong>
                <span style={{ fontWeight: 400, color: '#6c757d' }}>
                  {location || '—'}
                </span>
              </p>
            </div>

            <Badge bg="primary" className="align-self-start">Planned</Badge>
          </div>
        </Card.Body>

        <Card.Footer className="bg-white border-top-0 d-flex justify-content-end">
          <Link
            to={`/trips/${encodeURIComponent(tripId)}`}
            className="btn btn-outline-primary btn-sm"
            onClick={handleButtonStop}
          >
            More...
          </Link>
        </Card.Footer>
      </Card>
    </Col>
  );
}

export default TripCard;
