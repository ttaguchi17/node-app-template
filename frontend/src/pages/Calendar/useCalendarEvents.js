import { useState, useEffect, useMemo } from "react";
import { apiGet, apiPost } from "../../utils/api"; 

export function useCalendarEvents() {
  const [events, setEvents] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tripsData, calendarData] = await Promise.all([
          apiGet('/api/trips'),
          apiGet('/api/calendar/events')
        ]);

        setTrips(tripsData || []);
        
        if (calendarData && calendarData.success) {
          // Parse strings to Date objects immediately
          const parsed = calendarData.events.map(event => ({
            ...event,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
          }));
          setEvents(parsed);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Add Event Logic
  const addEvent = async (payload) => {
    try {
      const response = await apiPost(`/api/trips/${payload.tripId}/events`, payload);
      
      if (response && response.success) {
        // Refresh from API to get correct colors from backend
        const calendarData = await apiGet('/api/calendar/events');
        if (calendarData && calendarData.success) {
          const parsed = calendarData.events.map(event => ({
            ...event,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
          }));
          setEvents(parsed);
        }
        return true;
      }
    } catch (e) {
      throw e;
    }
    return false;
  };

  // 3. Memoized Trip Ranges (for colored bars in legend/calendar)
  const tripRanges = useMemo(() => {
    const tripMap = new Map();
    events.forEach((e) => {
      if (!tripMap.has(e.tripName)) {
        tripMap.set(e.tripName, { startDate: e.startDate, endDate: e.endDate, color: e.color || "#4A6CF7" });
      } else {
        const t = tripMap.get(e.tripName);
        if (e.startDate < t.startDate) t.startDate = e.startDate;
        if (e.endDate > t.endDate) t.endDate = e.endDate;
      }
    });
    return Array.from(tripMap.entries()).map(([name, data]) => ({ name, ...data }));
  }, [events]);

  // 4. Fast Date Lookup (Optimization)
  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach(ev => {
      const key = ev.startDate.toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  return { events, trips, loading, error, addEvent, tripRanges, eventsByDate };
}