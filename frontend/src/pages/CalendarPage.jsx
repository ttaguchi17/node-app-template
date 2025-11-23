import React, { useState } from "react";
import {
  Button,
  Badge,
  Card,
  Modal,
  Form,
  Row,
  Col,
  Container,
} from "react-bootstrap";

// Mock event data (from your Figma/TSX)
const mockEvents = [
  {
    id: "1",
    tripName: "Turkey Trip",
    eventName: "Flight to Istanbul",
    startDate: new Date(2025, 10, 11, 10, 0),
    endDate: new Date(2025, 10, 11, 14, 0),
    location: "Istanbul Airport",
    type: "flight",
    color: "#4A6CF7",
  },
  {
    id: "2",
    tripName: "Turkey Trip",
    eventName: "Hotel Check-in",
    startDate: new Date(2025, 10, 11, 16, 0),
    endDate: new Date(2025, 10, 11, 17, 0),
    location: "Sultanahmet Hotel",
    type: "hotel",
    color: "#4A6CF7",
  },
  {
    id: "3",
    tripName: "Turkey Trip",
    eventName: "Hagia Sophia Tour",
    startDate: new Date(2025, 10, 12, 9, 0),
    endDate: new Date(2025, 10, 12, 12, 0),
    location: "Hagia Sophia",
    type: "activity",
    color: "#4A6CF7",
  },
  {
    id: "4",
    tripName: "Japan Trip",
    eventName: "Flight to Tokyo",
    startDate: new Date(2025, 11, 18, 8, 0),
    endDate: new Date(2025, 11, 18, 20, 0),
    location: "Narita Airport",
    type: "flight",
    color: "#8B63F0",
  },
  {
    id: "5",
    tripName: "Japan Trip",
    eventName: "Mt. Fuji Day Trip",
    startDate: new Date(2025, 11, 20, 7, 0),
    endDate: new Date(2025, 11, 20, 18, 0),
    location: "Mt. Fuji",
    type: "activity",
    color: "#8B63F0",
  },
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month"); // 'month' | 'list'
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [events, setEvents] = useState(mockEvents);
  const [newEvent, setNewEvent] = useState({
    tripName: "",
    eventName: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    location: "",
    type: "other",
  });

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  // derive trip ranges (start/end) from events
  const getTripRanges = () => {
    const tripMap = new Map();
    events.forEach((e) => {
      if (!tripMap.has(e.tripName)) {
        tripMap.set(e.tripName, {
          startDate: e.startDate,
          endDate: e.endDate,
          color: e.color,
        });
      } else {
        const t = tripMap.get(e.tripName);
        if (e.startDate < t.startDate) t.startDate = e.startDate;
        if (e.endDate > t.endDate) t.endDate = e.endDate;
      }
    });
    return Array.from(tripMap.entries()).map(([name, data]) => ({ name, ...data }));
  };

  const getTripsForDate = (day) => {
    const trips = getTripRanges();
    return trips.filter((trip) => {
      const check = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const start = new Date(trip.startDate.getFullYear(), trip.startDate.getMonth(), trip.startDate.getDate());
      const end = new Date(trip.endDate.getFullYear(), trip.endDate.getMonth(), trip.endDate.getDate());
      return check >= start && check <= end;
    });
  };

  const getEventsForDate = (day) =>
    events.filter((ev) => {
      const d = ev.startDate;
      return (
        d.getDate() === day &&
        d.getMonth() === currentDate.getMonth() &&
        d.getFullYear() === currentDate.getFullYear()
      );
    });

  const handleAddEvent = () => {
    try {
      const start = new Date(`${newEvent.startDate}T${newEvent.startTime}`);
      const end = new Date(`${newEvent.endDate}T${newEvent.endTime}`);
      const id = Date.now().toString();
      setEvents([
        ...events,
        {
          id,
          tripName: newEvent.tripName,
          eventName: newEvent.eventName,
          startDate: start,
          endDate: end,
          location: newEvent.location,
          type: newEvent.type,
          color: newEvent.type === "flight" ? "#4A6CF7" : "#8B63F0",
        },
      ]);
      setIsAddOpen(false);
      setNewEvent({
        tripName: "",
        eventName: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        location: "",
        type: "other",
      });
    } catch (e) {
      console.error("error creating event", e);
    }
  };

  const exportToIcs = () => {
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\n";
    events.forEach((ev) => {
      const f = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      ics += "BEGIN:VEVENT\n";
      ics += `UID:${ev.id}@voyago\n`;
      ics += `DTSTART:${f(ev.startDate)}\n`;
      ics += `DTEND:${f(ev.endDate)}\n`;
      ics += `SUMMARY:${ev.tripName} - ${ev.eventName}\n`;
      if (ev.location) ics += `LOCATION:${ev.location}\n`;
      ics += "END:VEVENT\n";
    });
    ics += "END:VCALENDAR";
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "calendar.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendEmailWithIcs = () => {
    // quick mailto fallback (browser will open client's mail app)
    exportToIcs();
    const mailto = `mailto:${emailAddress || ""}?subject=Voyago%20Calendar&body=See%20attached%20calendar.`;
    window.location.href = mailto;
  };

  // helpers for rendering
  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <Container fluid className="py-4">
      {/* Header area */}
      <div className="mb-4">
        <Card className="p-4" style={{ background: "linear-gradient(90deg,#4A6CF7,#7BA5FF)", color: "white" }}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 style={{ fontSize: 28, margin: 0 }}>📆 My Calendar</h2>
              <div style={{ opacity: 0.9 }}>All your trips and events in one place</div>
            </div>

            <div className="d-flex align-items-center" style={{ gap: 8 }}>
              <Button variant="light" onClick={exportToIcs}>⬇ Export</Button>
              <Button variant="light" onClick={() => setIsAddOpen(true)}>＋ Add Event</Button>
              <Button variant="outline-light" onClick={() => setIsEmailOpen(true)}>✉ Email</Button>
            </div>
          </div>
        </Card>
      </div>

      {/* View toggle */}
      <div className="mb-3">
        <Button variant={view === "month" ? "primary" : "outline-primary"} className="me-2" onClick={() => setView("month")}>Month View</Button>
        <Button variant={view === "list" ? "primary" : "outline-primary"} onClick={() => setView("list")}>List View</Button>
      </div>

      {view === "month" ? (
        <Card className="p-3">
          {/* month controls */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center" style={{ gap: 8 }}>
              <Button size="sm" onClick={prevMonth}>◀</Button>
              <h4 style={{ margin: 0 }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h4>
              <Button size="sm" onClick={nextMonth}>▶</Button>
            </div>
          </div>

          {/* days header */}
          <Row className="g-2 text-center" style={{ fontWeight: 600, color: "#6b7280" }}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
              <Col key={d} xs={1} className="text-center">{d}</Col>
            ))}
          </Row>

          {/* calendar grid - simple flex layout that wraps */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12, marginTop: 12 }}>
            {/* empty slots before first day */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} style={{ minHeight: 120, borderRadius: 8 }} />
            ))}

            {/* days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const tripsForDay = getTripsForDate(day);
              const eventsForDay = getEventsForDate(day);
              return (
                <div
                  key={day}
                  style={{
                    minHeight: 120,
                    borderRadius: 8,
                    border: isToday(day) ? "2px solid #4A6CF7" : "1px solid #e6e6e6",
                    padding: 8,
                    background: tripsForDay.length ? "#fbfdff" : "#fff",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 14, color: tripsForDay.length ? "#333" : "#888" }}>{day}</div>
                    {isToday(day) && <div style={{ width: 8, height: 8, background: "#4A6CF7", borderRadius: 999 }} />}
                  </div>

                  {eventsForDay.length > 0 && (
                    <div style={{ marginTop: 12, fontSize: 12, color: "#555" }}>
                      {eventsForDay.map(ev => (
                        <div key={ev.id} style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <div style={{ width: 8, height: 8, background: ev.color, borderRadius: 999 }} />
                            <div>{ev.eventName}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* legend */}
          <div className="mt-4 pt-3 border-top">
            <h6>Upcoming Trips</h6>
            <div style={{ display: "flex", gap: 12 }}>
              {getTripRanges().map((t) => (
                <div key={t.name} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ width: 12, height: 12, background: t.color, borderRadius: 4 }} />
                  <div>{t.name} ({t.startDate.toLocaleDateString()} - {t.endDate.toLocaleDateString()})</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <div>
          {events.map((event) => (
            <Card className="mb-3" key={event.id}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <Badge bg="primary" pill className="me-2" style={{ background: event.color, color: "white" }}>
                      {event.tripName}
                    </Badge>
                    <h5 style={{ marginTop: 6 }}>{event.eventName}</h5>
                    <div style={{ color: "#6b7280" }}>
                      {event.startDate.toLocaleString()} - {event.endDate.toLocaleString()}
                    </div>
                    {event.location && <div style={{ color: "#6b7280", marginTop: 6 }}>📍 {event.location}</div>}
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Add Event Modal */}
      <Modal show={isAddOpen} onHide={() => setIsAddOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Event</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Trip Name</Form.Label>
              <Form.Control value={newEvent.tripName} onChange={(e) => setNewEvent({...newEvent, tripName: e.target.value})} placeholder="Turkey Trip" />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Event Name</Form.Label>
              <Form.Control value={newEvent.eventName} onChange={(e) => setNewEvent({...newEvent, eventName: e.target.value})} placeholder="Flight to Istanbul" />
            </Form.Group>
            <Row>
              <Col>
                <Form.Group className="mb-2">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control type="date" value={newEvent.startDate} onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})} />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-2">
                  <Form.Label>Start Time</Form.Label>
                  <Form.Control type="time" value={newEvent.startTime} onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})} />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col>
                <Form.Group className="mb-2">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control type="date" value={newEvent.endDate} onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})} />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-2">
                  <Form.Label>End Time</Form.Label>
                  <Form.Control type="time" value={newEvent.endTime} onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-2">
              <Form.Label>Location</Form.Label>
              <Form.Control value={newEvent.location} onChange={(e) => setNewEvent({...newEvent, location: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Type</Form.Label>
              <Form.Select value={newEvent.type} onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}>
                <option value="flight">Flight</option>
                <option value="hotel">Hotel</option>
                <option value="activity">Activity</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setIsAddOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddEvent} disabled={!newEvent.eventName || !newEvent.startDate || !newEvent.endDate}>Add Event</Button>
        </Modal.Footer>
      </Modal>

      {/* Email modal */}
      <Modal show={isEmailOpen} onHide={() => setIsEmailOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Email Calendar</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Email address</Form.Label>
            <Form.Control value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} placeholder="name@example.com" />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setIsEmailOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => { sendEmailWithIcs(); setIsEmailOpen(false); }} disabled={!emailAddress}>Send Email</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
