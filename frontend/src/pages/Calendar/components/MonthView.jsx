import React from "react";
import { Card, Row, Col, Button } from "react-bootstrap";
import { Lock } from "lucide-react";

export default function MonthView({ currentDate, setCurrentDate, eventsByDate, tripRanges }) {
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  
  const isToday = (d) => {
    const today = new Date();
    return d === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  };

  const getTripsForDate = (day) => {
    const check = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return tripRanges.filter((trip) => {
      const start = new Date(trip.startDate); start.setHours(0,0,0,0);
      const end = new Date(trip.endDate); end.setHours(23,59,59,999);
      return check >= start && check <= end;
    });
  };

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h5>
          <div className="d-flex align-items-center gap-2">
            <Button variant="outline-secondary" size="sm" onClick={prevMonth}>◀</Button>
            <Button variant="outline-secondary" size="sm" onClick={nextMonth}>▶</Button>
          </div>
        </div>

        <Row className="g-2 text-center" style={{ fontWeight: 600, color: "#6b7280" }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <Col key={d} xs={1}>{d}</Col>)}
        </Row>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12, marginTop: 12 }}>
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} style={{ minHeight: 120 }} />)}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const eventsForDay = eventsByDate[dateObj.toDateString()] || [];
            const tripsForDay = getTripsForDate(day);

            return (
              <div key={day} style={{
                  minHeight: 120, borderRadius: 8, padding: 10,
                  border: isToday(day) ? "2px solid var(--bs-primary)" : "1px solid #e5e7eb",
                  background: tripsForDay.length ? "#f8fafc" : "#fff",
                  overflow: "hidden"
                }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span style={{ fontWeight: isToday(day) ? 600 : 400 }}>{day}</span>
                  {isToday(day) && <div style={{ width: 8, height: 8, background: "var(--bs-primary)", borderRadius: 999 }} />}
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {eventsForDay.slice(0, 3).map(ev => (
                    <div key={ev.id} style={{ 
                        padding: "4px 6px", borderRadius: 4, background: `${ev.color}15`, 
                        borderLeft: `3px solid ${ev.color}`, display: "flex", alignItems: "center", gap: 4, fontSize: 11
                      }}>
                      <span className="text-truncate flex-grow-1" style={{color: ev.color, fontWeight: 500}}>{ev.eventName}</span>
                      {ev.isPrivate && <Lock size={9} className="text-muted" />}
                    </div>
                  ))}
                  {eventsForDay.length > 3 && <div className="text-muted" style={{fontSize: 10}}>+{eventsForDay.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-4 pt-3 border-top">
           <h6>Upcoming Trips</h6>
           <div className="d-flex gap-3 flex-wrap">
             {tripRanges.map(t => (
               <div key={t.name} className="d-flex align-items-center gap-2">
                 <div style={{width: 12, height: 12, background: t.color, borderRadius: 4}} />
                 <small>{t.name}</small>
               </div>
             ))}
           </div>
        </div>
      </Card.Body>
    </Card>
  );
}