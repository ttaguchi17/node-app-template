// src/components/EditEventModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, InputGroup } from 'react-bootstrap';
import { apiPatch } from '../../../utils/api';// Helper: Format date for datetime-local input
const formatDateTimeLocal = (isoString) => {
  if (!isoString) return '';
  try {
    // This correctly handles local timezones from an ISO string
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    // Returns YYYY-MM-DDTHH:mm
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (e) {
    console.error("Failed to format date:", isoString, e);
    return '';
  }
};

// This is the default "empty" state for a new event
const defaultFormState = {
  // Top-level SQL fields
  title: '',
  type: 'Activity',
  start_time: '',
  end_time: '',
  location_input: '',
  cost: 0,
  
  // Fields that live inside the 'details' JSON
  booking_reference: '',
  airline: '',
  departure_airport: '',
  arrival_airport: '',
  hotel_name: '',
  address: '',
  check_in_date: '',
  check_out_date: '',
  manual_details_text: '', // For non-imported events
};


export default function EditEventModal({ event, tripId, show, onClose, onEventUpdated }) {
  // --- State for the Form Fields ---
  const [formData, setFormData] = useState(defaultFormState);
  const [isImported, setIsImported] = useState(false); // Is this a Gmail event?
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- useEffect to pre-fill the form when 'event' changes ---
  useEffect(() => {
    setMessage('');
    if (event && event.event_id) { // Check if we are editing an existing event
      let details = {};
      let isImportedEvent = false;

      // 1. Try to parse 'details'
      try {
        details = JSON.parse(event.details);
        isImportedEvent = true;
      } catch (e) {
        // It's not JSON, just a manual string
        details = { manual_details_text: event.details || '' };
      }
      setIsImported(isImportedEvent);

      // 2. Set the "flattened" form data
      setFormData({
        ...defaultFormState, // Start with defaults
        ...details, // Add all keys from the parsed JSON
        
        // 3. Override with top-level SQL data (the "source of truth")
        title: event.title || '',
        type: event.type || 'Activity',
        start_time: formatDateTimeLocal(event.start_time), // <-- This will now work
        end_time: formatDateTimeLocal(event.end_time),     // <-- This will now work
        location_input: event.location_input || '',
        cost: event.cost || 0,
        manual_details_text: details.manual_details_text || '',
      });
    } else {
      // We are creating a NEW manual event
      setFormData(defaultFormState);
      setIsImported(false);
    }
  }, [event, show]); // Re-fill form every time modal is shown

  // Single change handler for all fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Form Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!formData.title || !formData.start_time) {
      setMessage('Event Name and Start Time are required.');
      setIsLoading(false);
      return;
    }
    
    // 1. Build the top-level payload for our SQL columns
    const payload = {
      title: formData.title,
      type: formData.type,
      start_time: new Date(formData.start_time).toISOString(), // Convert local time back to ISO
      end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
      location_input: formData.location_input,
      cost: Number(formData.cost) || 0,
      details: '' // We will build this next
    };

    // 2. Re-build the 'details' field
    if (isImported) {
      // Re-create the JSON object from the form state
      const detailsObj = {
        // We only save *details* data here, not top-level data
        booking_reference: formData.booking_reference,
        airline: formData.airline,
        departure_airport: formData.departure_airport,
        arrival_airport: formData.arrival_airport,
        hotel_name: formData.hotel_name,
        address: formData.address,
        check_in_date: formData.check_in_date,
        check_out_date: formData.check_out_date,
        nights: formData.nights
      };
      // Only add keys that have a value
      const cleanDetails = Object.fromEntries(
        Object.entries(detailsObj).filter(([_, v]) => v)
      );
      payload.details = JSON.stringify(cleanDetails, null, 2);
    } else {
      // It's a manual event, just save the text
      payload.details = formData.manual_details_text;
    }

    try {
      await apiPatch(`/api/trips/${tripId}/events/${event.event_id}`, payload);

      // Success!
      setIsLoading(false);
      onEventUpdated(); // Tell the parent page to refresh
      onClose(); // Close this modal

    } catch (err) {
      console.error('Update event error:', err);
      setMessage(err.message);
      setIsLoading(false);
    }
  };  if (!event) return null;

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        {/* Title is now dynamic */}
        <Modal.Title>{event.event_id ? 'Edit Event' : 'Create New Event'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {message && <Alert variant="danger">{message}</Alert>}

          {/* --- TOP-LEVEL FIELDS (Always Editable) --- */}
          <Form.Group className="mb-3">
            <Form.Label>Event Name</Form.Label>
            <Form.Control type="text" name="title" value={formData.title} onChange={handleChange} required />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Event Type</Form.Label>
            <Form.Select name="type" value={formData.type} onChange={handleChange} disabled={isImported}>
              <option value="Activity">Activity</option>
              <option value="Flight">Flight</option>
              <option value="Hotel">Hotel</option>
              <option value="Transport">Transport</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Other">Other</option>
            </Form.Select>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Start Time</Form.Label>
                <Form.Control type="datetime-local" name="start_time" value={formData.start_time} onChange={handleChange} required />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>End Time (Optional)</Form.Label>
                <Form.Control type="datetime-local" name="end_time" value={formData.end_time} onChange={handleChange} />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Location (Optional)</Form.Label>
            <Form.Control type="text" placeholder="e.g., Eiffel Tower" name="location_input" value={formData.location_input} onChange={handleChange} />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Cost (for Budgeting)</Form.Label>
            <InputGroup>
              <InputGroup.Text>$</InputGroup.Text>
              <Form.Control type="number" name="cost" value={formData.cost} onChange={handleChange} placeholder="0.00" step="0.01" />
            </InputGroup>
           </Form.Group>

          {/* --- "SMART" DETAILS SECTION --- */}
          <Form.Label>{isImported ? 'Imported Details' : 'Description / Details (Optional)'}</Form.Label>
          <div className="p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            {isImported ? (
            <>
              {/* Show special fields for imported types */}
              {formData.type === 'Flight' && (
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Airline</Form.Label>
                      <Form.Control type="text" name="airline" value={formData.airline} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Booking Reference</Form.Label>
                      <Form.Control type="text" name="booking_reference" value={formData.booking_reference} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Departure Airport</Form.Label>
                      <Form.Control type="text" name="departure_airport" value={formData.departure_airport} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Arrival Airport</Form.Label>
                      <Form.Control type="text" name="arrival_airport" value={formData.arrival_airport} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                </Row>
              )}
              {formData.type === 'Hotel' && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Hotel Name</Form.Label>
                    <Form.Control type="text" name="hotel_name" value={formData.hotel_name} onChange={handleChange} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control type="text" name="address" value={formData.address} onChange={handleChange} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Booking Reference</Form.Label>
                    <Form.Control type="text" name="booking_reference" value={formData.booking_reference} onChange={handleChange} />
                  </Form.Group>
                </>
              )}
              {/* You can add more 'if' blocks here for other types */}
            </>
            ) : (
            // It's a manual event, show a simple text area
            <Form.Group controlId="editEventDetails">
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="e.g., Confirmation #12345"
                name="manual_details_text"
                value={formData.manual_details_text}
                onChange={handleChange}
              />
            </Form.Group>
            )}
          </div>
          
          <div className="d-flex justify-content-end mt-4">
             <Button variant="outline-secondary" onClick={onClose} className="me-2">
                Cancel
             </Button>
             <Button variant="primary" type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
             </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}