// frontend/src/pages/SupportPage.jsx
import React from "react";
import { Container, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function SupportPage() {
  const navigate = useNavigate();

  return (
    <Container fluid style={{ padding: 24 }}>
      <Card style={{ borderRadius: 12, padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 10 }}>Support</h1>
        <p style={{ color: "#6b7280", marginBottom: 25 }}>
          Need help? We're here for you. More support features are coming soon.
        </p>

        <Card style={{ padding: 20, borderRadius: 12, background: "#f8fafc" }}>
          <h4>Contact Options</h4>
          <p className="text-muted">
            Choose how you would like to reach us:
          </p>

          <div className="d-flex flex-column" style={{ gap: 12, marginTop: 10 }}>
            <Button variant="primary" onClick={() => window.location.href = "mailto:support@voyago.com"}>
              Email Support
            </Button>

            <Button variant="outline-secondary" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </Card>

        <div style={{ marginTop: 30, textAlign: "center", color: "#64748b" }}>
          <p>More help resources coming soon!</p>
        </div>
      </Card>
    </Container>
  );
}
