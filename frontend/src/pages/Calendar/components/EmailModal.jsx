import React, { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";

export default function EmailModal({ show, onHide, onSend }) {
  const [email, setEmail] = useState("");

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton><Modal.Title>Email Calendar</Modal.Title></Modal.Header>
      <Modal.Body>
        <Form.Group>
          <Form.Label>Email address</Form.Label>
          <Form.Control value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={() => onSend(email)} disabled={!email}>Send Email</Button>
      </Modal.Footer>
    </Modal>
  );
}