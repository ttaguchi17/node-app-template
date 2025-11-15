// src/components/BookingReviewModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

// 1. Accept the 'onSubmit' prop from GmailConnector
export default function BookingReviewModal({ show, onClose, scanResults, onSubmit }) {
  
  const [selectedBookings, setSelectedBookings] = useState(new Set());

  useEffect(() => {
    if (show) {
      setSelectedBookings(new Set());
    }
  }, [show]);

  const handleCheckboxChange = (bookingId) => {
    const newSelection = new Set(selectedBookings);
    if (newSelection.has(bookingId)) {
      newSelection.delete(bookingId);
    } else {
      newSelection.add(bookingId);
    }
    setSelectedBookings(newSelection);
  };

  // 2. This handler now calls 'onSubmit' instead of alerting and closing
  const handleSubmit = () => {
    const bookingsToImport = scanResults.filter(b => 
      selectedBookings.has(b.id || b.booking_reference)
    );
    
    // This passes the selected items back to GmailConnector
    onSubmit(bookingsToImport); 
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      {/* 3. Added Modal.Header for a title */}
      <Modal.Header closeButton>
        <Modal.Title>Found {scanResults?.length || 0} Bookings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Please review the bookings found in your inbox and select the ones you'd like to import.</p>
        
        {/* 4. Added check for empty results to prevent crashing */}
        {(!scanResults || scanResults.length === 0) ? (
          <Alert variant="info">No new bookings were found.</Alert>
        ) : (
          <Form>
            {scanResults.map((booking, index) => (
              <Form.Check 
                type="checkbox"
                key={booking.id || booking.booking_reference || index}
                id={`booking-${booking.id || booking.booking_reference || index}`}
                checked={selectedBookings.has(booking.id || booking.booking_reference)} 
                onChange={() => handleCheckboxChange(booking.id || booking.booking_reference)}
                label={
                  <div>
                    <strong>{booking.type}: {booking.title || booking.hotel_name || booking.airline || 'Booking'}</strong>
                    <div className="small text-muted">
                      {booking.departure?.date || booking.check_in || 'No date'}
                    </div>
                  </div>
                }
                className="mb-3"
              />
            ))}
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={!scanResults || scanResults.length === 0 || selectedBookings.size === 0}
        >
          Next ({selectedBookings.size} selected)
        </Button>
      </Modal.Footer>
    </Modal>
  );
}