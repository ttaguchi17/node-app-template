import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, InputGroup } from 'react-bootstrap';
import { apiPatch, apiPost } from '../../../utils/api'; // Added apiPost

// Helper: Format date for datetime-local input
const formatDateTimeLocal = (isoString) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (e) {
    return '';
  }
};

const defaultFormState = {
  title: '',
  type: 'Activity',
  start_time: '',
  end_time: '',
  location_input: '',
  cost: 0,
  is_private: false, // <--- Added Privacy Default
  
  // Detailed fields
  booking_reference: '',
  airline: '',
  departure_airport: '',
  arrival_airport: '',
  hotel_name: '',
  address: '',
  check_in_date: '',
  check_out_date: '',
  manual_details_text: '',
};

export default function EditEventModal({ event, tripId, show, onClose, onEventUpdated, currentUserId }) {
  const [formData, setFormData] = useState(defaultFormState);
  const [isImported, setIsImported] = useState(false); 
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if current user is the creator of this event
  const isCreator = !event || !event.event_id || String(event.created_by) === String(currentUserId);

  useEffect(() => {
    setMessage('');
    if (event && (event.event_id || event.id)) { 
      let details = {};
      let isImportedEvent = false;

      // --- 1. ROBUST JSON PARSING ---
      try {
        const parsed = JSON.parse(event.details);
        // It is only "Imported" if it is a real object with keys
        if (typeof parsed === 'object' && parsed !== null) {
            details = parsed;
            // Check for specific keys to decide if it's a rich object
            isImportedEvent = !!(parsed.airline || parsed.hotel_name || parsed.booking_reference || parsed.departure_airport);
        } else {
            details = { manual_details_text: String(parsed) };
        }
      } catch (e) {
        details = { manual_details_text: event.details || '' };
      }
      
      setIsImported(isImportedEvent);

      setFormData({
        ...defaultFormState,
        ...details, 
        title: event.title || event.name || '',
        type: event.type || 'Activity',
        start_time: formatDateTimeLocal(event.start_time),
        end_time: formatDateTimeLocal(event.end_time),
        location_input: event.location_input || event.location_display_name || '',
        cost: event.cost || 0,
        manual_details_text: details.manual_details_text || details.notes || '',
        is_private: event.is_private === 1 || event.is_private === true, // <--- Load Privacy
      });
    } else {
      setFormData(defaultFormState);
      setIsImported(false);
    }
  }, [event, show]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' || type === 'switch' ? checked : value; // Handle Switch/Checkbox
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!formData.title || !formData.start_time) {
      setMessage('Event Name and Start Time are required.');
      setIsLoading(false);
      return;
    }
    
    // --- 2. BUILD PAYLOAD ---
    const payload = {
      title: formData.title,
      type: formData.type,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
      location_input: formData.location_input,
      cost: Number(formData.cost) || 0,
      is_private: formData.is_private, // <--- Send Privacy Flag
      details: '' 
    };

    // --- 3. SMART SAVE LOGIC ---
    // Collect all possible detail fields
    const detailsObj = {
        booking_reference: formData.booking_reference,
        airline: formData.airline,
        departure_airport: formData.departure_airport,
        arrival_airport: formData.arrival_airport,
        hotel_name: formData.hotel_name,
        address: formData.address,
        check_in_date: formData.check_in_date,
        check_out_date: formData.check_out_date,
        nights: formData.nights,
        notes: formData.manual_details_text 
    };

    // Filter out empty keys
    const cleanDetails = Object.fromEntries(
        Object.entries(detailsObj).filter(([_, v]) => v && String(v).trim() !== '')
    );

    // If we have structured data (more than just notes), save as JSON
    if (Object.keys(cleanDetails).length > 0) {
         payload.details = JSON.stringify(cleanDetails);
    } else {
         payload.details = formData.manual_details_text;
    }

    try {
      if (event && (event.event_id || event.id)) {
        await apiPatch(`/api/trips/${tripId}/events/${event.event_id || event.id}`, payload);
      } else {
        await apiPost(`/api/trips/${tripId}/events`, payload);
      }

      setIsLoading(false);
      onEventUpdated();
      onClose();

    } catch (err) {
      console.error('Update event error:', err);
      setMessage(err.message);
      setIsLoading(false);
    }
  };

  if (!show) return null;

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{event ? 'Edit Event' : 'Create New Event'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {message && <Alert variant="danger">{message}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label>Event Name</Form.Label>
            <Form.Control type="text" name="title" value={formData.title} onChange={handleChange} required />
          </Form.Group>

          <Row>
            <Col md={6}>
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
            </Col>
            <Col md={6}>
                {/* --- PRIVACY TOGGLE UI --- */}
                <Form.Group className="mb-3 bg-light p-2 rounded border h-75 d-flex align-items-center">
                    <Form.Check 
                        type="switch"
                        id="privacy-switch"
                        name="is_private"
                        label={formData.is_private ? "🔒 Private" : "🌍 Public"}
                        checked={formData.is_private}
                        onChange={handleChange}
                        disabled={!isCreator}
                    />
                    <span className="ms-2 text-muted small">
                        {!isCreator 
                          ? "(Only the creator can change this)" 
                          : formData.is_private ? "(Only you can see this)" : "(Visible to group)"}
                    </span>
                </Form.Group>
            </Col>
          </Row>

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

          {/* --- DYNAMIC DETAILS SECTION --- */}
          <hr />
          <Form.Label className="text-muted small fw-bold text-uppercase">Detailed Info</Form.Label>
          <div className="p-3 mb-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            
              {/* FLIGHT FIELDS */}
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

              {/* HOTEL FIELDS */}
              {formData.type === 'Hotel' && (
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Hotel Name</Form.Label>
                      <Form.Control type="text" name="hotel_name" value={formData.hotel_name} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control type="text" name="address" value={formData.address} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Booking Reference</Form.Label>
                      <Form.Control type="text" name="booking_reference" value={formData.booking_reference} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                </Row>
              )}

            {/* GENERIC NOTES (Always visible) */}
            <Form.Group controlId="editEventDetails" className="mt-2">
              <Form.Label>Notes / Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Additional details..."
                name="manual_details_text"
                value={formData.manual_details_text}
                onChange={handleChange}
              />
            </Form.Group>
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