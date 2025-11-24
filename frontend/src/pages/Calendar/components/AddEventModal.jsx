import React, { useState } from "react";
import { Modal, Form, Button, Row, Col } from "react-bootstrap";
import { Lock } from "lucide-react";

export default function AddEventModal({ show, onHide, trips, onSave }) {
  // Internal state ensures the main page doesn't re-render on every keystroke
  const [formData, setFormData] = useState({
    tripId: "", eventName: "", startDate: "", startTime: "",
    endDate: "", endTime: "", location: "", type: "Activity", isPrivate: false
  });

  const handleSubmit = () => {
    // Basic validation
    if (!formData.tripId || !formData.eventName || !formData.startDate || !formData.endDate) return;

    // Formatting
    const start = new Date(`${formData.startDate}T${formData.startTime || '09:00'}`).toISOString();
    const end = new Date(`${formData.endDate}T${formData.endTime || '17:00'}`).toISOString();

    onSave({
      tripId: formData.tripId,
      title: formData.eventName,
      type: formData.type,
      start_time: start,
      end_time: end,
      location_input: formData.location,
      is_private: formData.isPrivate,
    });
    
    // Reset handled by parent or manual
    setFormData({ tripId: "", eventName: "", startDate: "", startTime: "", endDate: "", endTime: "", location: "", type: "Activity", isPrivate: false });
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton><Modal.Title>Add Event</Modal.Title></Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Trip <span className="text-danger">*</span></Form.Label>
            <Form.Select value={formData.tripId} onChange={(e) => setFormData({...formData, tripId: e.target.value})}>
              <option value="">Select a trip...</option>
              {trips.map(t => <option key={t.trip_id} value={t.trip_id}>{t.name}</option>)}
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Event Name <span className="text-danger">*</span></Form.Label>
            <Form.Control value={formData.eventName} onChange={(e) => setFormData({...formData, eventName: e.target.value})} placeholder="Flight to Istanbul" />
          </Form.Group>

          <Row className="mb-3">
            <Col><Form.Label>Start Date</Form.Label><Form.Control type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} /></Col>
            <Col><Form.Label>Time</Form.Label><Form.Control type="time" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} /></Col>
          </Row>

          <Row className="mb-3">
             <Col><Form.Label>End Date</Form.Label><Form.Control type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} /></Col>
             <Col><Form.Label>Time</Form.Label><Form.Control type="time" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} /></Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Location</Form.Label>
            <Form.Control value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Location" />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Type</Form.Label>
            <Form.Select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
              <option value="Flight">Flight</option>
              <option value="Hotel">Hotel</option>
              <option value="Activity">Activity</option>
              <option value="Transport">Transport</option>
              <option value="Other">Other</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
             <Form.Check 
               type="checkbox"
               id="private-check"
               label={<span className="d-flex align-items-center gap-2"><Lock size={14} /> Private (Visible only to me)</span>}
               checked={formData.isPrivate}
               onChange={(e) => setFormData({...formData, isPrivate: e.target.checked})}
             />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!formData.tripId || !formData.eventName}>Add Event</Button>
      </Modal.Footer>
    </Modal>
  );
}