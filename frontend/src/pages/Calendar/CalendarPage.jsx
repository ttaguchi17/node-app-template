import React, { useState } from "react";
import { Button, Spinner, Alert } from "react-bootstrap";
import { Calendar, Download, Mail } from "lucide-react";
import Layout from "../../components/Layout.jsx";

// Import from local folder
import { useCalendarEvents } from "./usecalendarEvents.js";
import MonthView from "./components/MonthView";
import ListView from "./components/ListView";
import AddEventModal from "./components/AddEventModal";
import EmailModal from "./components/EmailModal";

export default function CalendarPage() {
  const [isSidebarToggled, setIsSidebarToggled] = useState(false);
  const toggleSidebar = () => setIsSidebarToggled(!isSidebarToggled);
  
  // Custom Hook (The Brain)
  const { events, trips, loading, error, addEvent, eventsByDate, tripRanges } = useCalendarEvents();
  
  // Local UI State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  // Handlers
  const handleSaveEvent = async (payload) => {
    try {
      const success = await addEvent(payload);
      if (success) setIsAddOpen(false);
    } catch (e) {
      alert("Failed to save event: " + e.message);
    }
  };

  const exportToIcs = () => {
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\n";
    events.forEach((ev) => {
      const f = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      ics += `BEGIN:VEVENT\nUID:${ev.id}@voyago\nDTSTART:${f(ev.startDate)}\nDTEND:${f(ev.endDate)}\nSUMMARY:${ev.tripName} - ${ev.eventName}\nEND:VEVENT\n`;
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

  const handleSendEmail = (email) => {
    exportToIcs(); // Trigger download as fallback
    window.location.href = `mailto:${email}?subject=Voyago%20Calendar&body=See%20attached.`;
    setIsEmailOpen(false);
  };

  return (
    <Layout isSidebarToggled={isSidebarToggled} onToggleSidebar={toggleSidebar}>
      {loading && <div className="text-center py-5"><Spinner animation="border" /></div>}
      
      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && (
        <>
          {/* Header Controls */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center gap-2">
              <Button variant={view === "month" ? "primary" : "outline-secondary"} size="sm" onClick={() => setView("month")}>
                <Calendar size={16} className="me-1" /> Month
              </Button>
              <Button variant={view === "list" ? "primary" : "outline-secondary"} size="sm" onClick={() => setView("list")}>
                List
              </Button>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Button variant="outline-secondary" size="sm" onClick={exportToIcs}>
                <Download size={16} className="me-1" /> Export
              </Button>
              <Button variant="outline-secondary" size="sm" onClick={() => setIsEmailOpen(true)}>
                <Mail size={16} className="me-1" /> Email
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)}>
                + Add Event
              </Button>
            </div>
          </div>

          {/* Conditional View Rendering */}
          {view === "month" ? (
            <MonthView 
              currentDate={currentDate} 
              setCurrentDate={setCurrentDate} 
              eventsByDate={eventsByDate} 
              tripRanges={tripRanges} 
            />
          ) : (
            <ListView 
              events={events} 
              onAddClick={() => setIsAddOpen(true)} 
            />
          )}
        </>
      )}

      {/* Modals */}
      <AddEventModal 
        show={isAddOpen} 
        onHide={() => setIsAddOpen(false)} 
        trips={trips} 
        onSave={handleSaveEvent} 
      />

      <EmailModal 
        show={isEmailOpen} 
        onHide={() => setIsEmailOpen(false)} 
        onSend={handleSendEmail} 
      />
    </Layout>
  );
}