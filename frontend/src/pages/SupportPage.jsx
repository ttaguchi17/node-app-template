// frontend/src/pages/SupportPage.jsx
import React, { useState } from "react";
import {
  Container,
  Card,
  Button,
  Modal,
  Form,
  Alert,
  Accordion,
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function SupportPage() {
  const navigate = useNavigate();

  // page-level alert
  const [pageAlert, setPageAlert] = useState({ type: null, message: "" });

  // modal state and form
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [file, setFile] = useState(null);
  const [formError, setFormError] = useState("");

  // Basic validation
  function validateForm() {
    setFormError("");
    if (!form.name.trim()) return "Please enter your name.";
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(form.email)) return "Please enter a valid email.";
    if (!form.subject.trim()) return "Please enter a short subject.";
    if (!form.message.trim() || form.message.trim().length < 10)
      return "Please enter a message (at least 10 characters).";
    return null;
  }

  // Simulated API call - replace with real API
  function sendSupportRequest(formData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate success 85% of the time
        if (Math.random() < 0.85) resolve({ ok: true });
        else resolve({ ok: false, error: "Simulated network failure" });
      }, 900);
    });
  }

  async function handleSend(e) {
    e?.preventDefault();
    const v = validateForm();
    if (v) {
      setFormError(v);
      return;
    }

    setFormError("");
    setSending(true);

    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("email", form.email.trim());
      fd.append("subject", form.subject.trim());
      fd.append("message", form.message.trim());
      if (file) fd.append("file", file);

      const res = await sendSupportRequest(fd);

      if (res.ok) {
        setPageAlert({ type: "success", message: "Message sent — we'll reply soon." });
        setShowModal(false);
        // clear form
        setForm({ name: "", email: "", subject: "", message: "" });
        setFile(null);
        // auto-hide alert
        setTimeout(() => setPageAlert({ type: null, message: "" }), 3000);
      } else {
        // fallback: open mail client with mailto
        setPageAlert({ type: "warning", message: "Failed to send via API — opening email client..." });

        const body = encodeURIComponent(
          `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
        );
        const subject = encodeURIComponent(form.subject || "Voyago Support");
        window.location.href = `mailto:support@voyago.com?subject=${subject}&body=${body}`;
      }
    } catch (err) {
      console.error(err);
      setPageAlert({
        type: "danger",
        message: "Unexpected error. Try again or email support@voyago.com.",
      });
    } finally {
      setSending(false);
      // auto-hide non-danger alerts
      if (pageAlert.type && pageAlert.type !== "danger") {
        setTimeout(() => setPageAlert({ type: null, message: "" }), 3000);
      }
    }
  }

  return (
    <Container fluid style={{ padding: 24 }}>
      <Card style={{ borderRadius: 12, padding: 24, maxWidth: 920, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ marginBottom: 10 }}>Support</h1>
            <p style={{ color: "#6b7280", marginBottom: 12 }}>
              Need help? We're here for you. More support features are coming soon.
            </p>
          </div>

          <div>
            <Button variant="outline-secondary" onClick={() => navigate(-1)}>
              ← Back
            </Button>
          </div>
        </div>

        {pageAlert.type && (
          <Alert
            variant={pageAlert.type}
            onClose={() => setPageAlert({ type: null, message: "" })}
            dismissible
            className="mt-3"
          >
            {pageAlert.message}
          </Alert>
        )}

        <Card style={{ padding: 20, borderRadius: 12, background: "#f8fafc", marginTop: 18 }}>
          <h4 style={{ marginBottom: 6 }}>Contact Options</h4>
          <p className="text-muted" style={{ marginBottom: 12 }}>
            Choose how you would like to reach us:
          </p>

          <div className="d-flex flex-column" style={{ gap: 12, marginTop: 6 }}>
            <Button
              variant="primary"
              onClick={() => setShowModal(true)}
              aria-controls="contact-modal"
              aria-expanded={showModal}
            >
              Email Support
            </Button>

            <Button variant="outline-secondary" onClick={() => (window.location.href = "mailto:support@voyago.com")}>
              Open Email Client
            </Button>

            <Button variant="outline-secondary" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </Card>

        <Card style={{ marginTop: 22, padding: 18 }}>
          <h5 style={{ marginBottom: 12 }}>Quick help — FAQs</h5>
          <Accordion defaultActiveKey="0">
            <Accordion.Item eventKey="0">
              <Accordion.Header>How long until I get a response?</Accordion.Header>
              <Accordion.Body>
                Our support team typically responds within 24–48 hours. For urgent booking issues, please include "URGENT" in the subject.
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="1">
              <Accordion.Header>Can I cancel or change a booking?</Accordion.Header>
              <Accordion.Body>
                You can view and manage bookings from your Dashboard → Bookings. If you need help, send us a message and include your booking ID.
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="2">
              <Accordion.Header>How do refunds work?</Accordion.Header>
              <Accordion.Body>
                Refunds depend on the provider's policy. Contact support with your booking details and we will help start the process.
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Card>

        <div style={{ marginTop: 22, textAlign: "center", color: "#64748b" }}>
          <p>More help resources coming soon!</p>
        </div>
      </Card>

      {/* Contact Modal */}
      <Modal
        id="contact-modal"
        show={showModal}
        onHide={() => {
          if (!sending) {
            setShowModal(false);
            setFormError("");
          }
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Contact Support</Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSend}>
          <Modal.Body>
            {formError && <Alert variant="danger">{formError}</Alert>}

            <Form.Group className="mb-3" controlId="supportName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                disabled={sending}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="supportEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                disabled={sending}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="supportSubject">
              <Form.Label>Subject</Form.Label>
              <Form.Control
                type="text"
                placeholder="Short summary"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                required
                disabled={sending}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="supportMessage">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="Describe the issue or question..."
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                required
                disabled={sending}
              />
            </Form.Group>

            <Form.Group controlId="supportFile" className="mb-2">
              <Form.Label className="d-block">Optional: Attach a file</Form.Label>
              <Form.Control
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={sending}
              />
              <Form.Text className="text-muted">
                Screenshots or receipts help us troubleshoot faster. Max 5MB.
              </Form.Text>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={sending}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={sending}>
              {sending ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />{" "}
                  Sending...
                </>
              ) : (
                "Send message"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
