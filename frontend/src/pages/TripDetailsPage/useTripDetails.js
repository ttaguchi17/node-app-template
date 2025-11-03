// src/hooks/useTripDetails.js
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// --- Helper Functions (Copied from TripDetailsPage) ---
const PREVIEWS_KEY = 'tripPreviews';

const buildAuthHeader = (raw) => {
  if (!raw) return undefined;
  if (raw.toLowerCase().startsWith('bearer ')) return raw;
  return `Bearer ${raw}`;
};

function fetchTripPreviewFromLocal(tripId) {
  try {
    const raw = localStorage.getItem(PREVIEWS_KEY);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return null;
    return arr.find((p) => String(p.id) === String(tripId)) || null;
  } catch (e) {
    console.warn('fetchTripPreviewFromLocal', e);
    return null;
  }
}

function upsertLocalPreview(tripId, patch) {
  try {
    const raw = localStorage.getItem(PREVIEWS_KEY);
    let arr = [];
    if (raw) arr = JSON.parse(raw) || [];
    const idx = arr.findIndex(p => String(p.id) === String(tripId));
    if (idx >= 0) {
      arr[idx] = { ...arr[idx], ...patch };
    } else {
      arr.push({ id: String(tripId), ...patch });
    }
    localStorage.setItem(PREVIEWS_KEY, JSON.stringify(arr));
    return true;
  } catch (e) {
    console.warn('upsertLocalPreview error', e);
    return false;
  }
}

function extractDates(serverTrip = {}) {
  if (!serverTrip) return { start_date: null, end_date: null };
  if (serverTrip.start_date || serverTrip.end_date) {
    return { start_date: serverTrip.start_date ?? null, end_date: serverTrip.end_date ?? null };
  }
  if (serverTrip.startDate || serverTrip.endDate) {
    return { start_date: serverTrip.startDate ?? null, end_date: serverTrip.endDate ?? null };
  }
  const d = serverTrip.dates ?? serverTrip.date_range ?? serverTrip.dateRange;
  if (!d) return { start_date: null, end_date: null };
  if (typeof d === 'string') {
    const match = d.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2}).*?(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
    if (match) return { start_date: match[1], end_date: match[2] };
    return { start_date: d, end_date: null };
  }
  if (typeof d === 'object') {
    return { start_date: d.start ?? d.start_date ?? d.from ?? null, end_date: d.end ?? d.end_date ?? d.to ?? null };
  }
  return { start_date: null, end_date: null };
}

function extractLocation(serverTrip = {}) {
  if (!serverTrip) return '';

  if (serverTrip.location_display_name) {
    return serverTrip.location_display_name;
  }

  if (serverTrip.location_input) {
    return serverTrip.location_input;
  }

  return (
    serverTrip.location ??
    serverTrip.destination ??
    serverTrip.place ??
    serverTrip.city ??
    serverTrip.country ??
    serverTrip.where ??
    serverTrip.location_name ??
    (typeof serverTrip.address === 'string' ? serverTrip.address : '') ??
    ''
  );
}

// This is our new hook
export function useTripDetails(tripId) {
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Helper to check if trip id looks like a server id
  const tripLooksLikeServerId = (t) => {
    if (!t) return false;
    const id = String(t.trip_id ?? t.id ?? '');
    return /^\d+$/.test(id);
  };

  // --- All Data Functions ---

  // Function to Fetch Events
  const fetchEvents = async (serverTripId) => {
    if (!serverTripId) return;
    const token = localStorage.getItem('token');
    const auth = buildAuthHeader(token);
    try {
      const res = await fetch(`/api/trips/${encodeURIComponent(serverTripId)}/events`, { headers: auth ? { Authorization: auth } : undefined });
      if (!res.ok) throw new Error(`Could not fetch events (status ${res.status})`);
      const body = await res.json();
      const list = Array.isArray(body) ? body : Array.isArray(body.events) ? body.events : [];
      setEvents(list);
      setFetchError(false); // Clear any previous fetch errors
    } catch (err) {
      console.warn('fetchEvents', err);
      setFetchError(true); // Set fetch error for events
      setEvents([]);
    }
  };


  
const deleteEvent = async (eventId) => {
    if (!trip) return; // Make sure we have a trip

    // Ask for confirmation
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    const currentTripId = trip.trip_id ?? trip.id;
    const token = localStorage.getItem('token');
    const auth = buildAuthHeader(token); // Use your existing helper

    try {
      const res = await fetch(`/api/trips/${currentTripId}/events/${eventId}`, {
        method: 'DELETE',
        headers: auth ? { Authorization: auth } : undefined,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete event.');
      }

      // Success! Remove the event from our local state (the UI)
     setEvents(prevEvents => prevEvents.filter(event => 
  (event.event_id ?? event.id) !== eventId
));
    } catch (err) {
      console.error('deleteEvent error:', err);
      // You could set an error message here
      // setFetchError(err.message); 
    }
  };

  // Function to Create Trip on Server
  const createTripOnServer = async () => {
    if (!trip) return;
    setCreateError('');
    setIsCreating(true);
    try {
      const token = localStorage.getItem('token');
      const auth = buildAuthHeader(token);
      const headers = { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) };

      const payload = {
        name: trip.title,
        start_date: trip.start_date ?? trip.dates ?? undefined,
        ...(trip.end_date ? { end_date: trip.end_date } : {}),
        ...(trip.location ? { location_input: trip.location } : {}) // backend expects location_input
      };

      const res = await fetch('/api/trips', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let msg = `Create failed (status ${res.status})`;
        try {
          const body = await res.json();
          if (body?.message) msg = body.message;
        } catch (e) {}
        throw new Error(msg);
      }

      const created = await res.json();
      const serverTrip = created.trip || created;
      const { start_date: createdStart, end_date: createdEnd } = extractDates(serverTrip);
      const createdLocation = extractLocation(serverTrip);

      const normalized = {
        id: serverTrip.id ?? serverTrip.trip_id ?? String(serverTrip.id ?? serverTrip.trip_id),
        trip_id: serverTrip.trip_id ?? serverTrip.id ?? String(serverTrip.id ?? serverTrip.trip_id),
        title: serverTrip.title ?? serverTrip.name ?? trip.title,
        dates: serverTrip.dates ?? serverTrip.start_date ?? createdStart ?? trip.dates,
        start_date: createdStart ?? serverTrip.start_date ?? trip.start_date ?? null,
        end_date: createdEnd ?? serverTrip.end_date ?? trip.end_date ?? null,
        location: createdLocation ?? serverTrip.location ?? trip.location ?? '',
        notes: serverTrip.notes ?? serverTrip.description ?? trip.notes,
        latitude: serverTrip.latitude,
          longitude: serverTrip.longitude,
          bbox_sw_lat: serverTrip.bbox_sw_lat,
          bbox_sw_lon: serverTrip.bbox_sw_lon,
          bbox_ne_lat: serverTrip.bbox_ne_lat,
          bbox_ne_lon: serverTrip.bbox_ne_lon
        };

      try {
        const raw = localStorage.getItem(PREVIEWS_KEY);
        if (raw) {
          const arr = JSON.parse(raw);
          const updatedArr = arr.filter(p => p.id !== trip.id);
          localStorage.setItem(PREVIEWS_KEY, JSON.stringify(updatedArr));
        }
      } catch (e) { console.warn('Could not update previews localStorage', e); }

      setTrip(normalized);
      setIsCreating(false);
      setCreateError('');
      await fetchEvents(normalized.trip_id); // Fetch events for the new trip
    } catch (err) {
      console.error('createTripOnServer error', err);
      setCreateError(err.message || 'Failed to create trip on server.');
      setIsCreating(false);
    }
  };

  // Function to Save Location
  const saveTripDetails = async (details) => {
    if (!trip) return { success: false, message: 'No trip loaded.' };

    const isPreview = !tripLooksLikeServerId(trip);

    // 1. Handle Local Preview
    if (isPreview) {
      try {
        // We can update any part of the preview now
        upsertLocalPreview(trip.id, details);
        setTrip(prev => ({ ...prev, ...details }));
        return { success: true, message: 'Saved locally.' };
      } catch (e) {
        return { success: false, message: 'Failed to save locally.' };
      }
    }
    
    // 2. Handle Server Trip
    const id = encodeURIComponent(trip.trip_id ?? trip.id);
    const token = localStorage.getItem('token');
    const auth = buildAuthHeader(token);

    try {
      // Transform frontend field names to the backend's expected names
      const payload = {
        ...details,
        // Transform location to location_input as expected by backend
        ...(details.location && { location_input: details.location })
      };

      const res = await fetch(`/api/trips/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        let updated = null;
        try { updated = await res.json(); } catch (e) {}

        const updatedState = { ...details };
        if (details.name) {
          updatedState.title = details.name;
        }
        setTrip(prev => ({ ...prev, ...updatedState }));
        return { success: true, message: 'Trip details saved.' };
      } else {
        let bodyTxt = `Update failed (status ${res.status})`;
        try { const b = await res.json(); bodyTxt = b?.message ? `: ${b.message}` : ''; } catch (e) {}
        throw new Error(bodyTxt);
      }
    } catch (err) {
      return { success: false, message: err.message || 'Failed to update trip.' };
    }
  };

// --- ADD THIS NEW FUNCTION ---
  const deleteTrip = async () => {
    if (!trip) return; // No trip loaded to delete

    // Confirm with the user
    if (!window.confirm('Are you sure you want to delete this trip and all its data? This cannot be undone.')) {
      return;
    }

    const tripIdToDelete = trip.trip_id ?? trip.id;
    const token = localStorage.getItem('token');
    const auth = buildAuthHeader(token); // Use your existing helper

    try {
      const response = await fetch(`/api/trips/${tripIdToDelete}`, {
        method: 'DELETE',
        headers: auth ? { Authorization: auth } : undefined
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete trip.');
      }

      // Success! Navigate back to the dashboard.
      navigate('/dashboard');

    } catch (err) {
      console.error('deleteTrip error:', err);
      // Show an error on the page
      setCreateError(err.message); // We can re-use the createError state for this
    }
  };

  // --- Main Loading useEffect ---
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setFetchError(false);
      setEvents([]);
      
      try {
        // This is the authentication fix:
        const token = localStorage.getItem('token');
        const auth = buildAuthHeader(token);
        
        const res = await fetch(`/api/trips/${encodeURIComponent(tripId)}`, { 
          headers: auth ? { Authorization: auth } : undefined 
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) { 
            localStorage.removeItem('token'); 
            navigate('/login'); 
            return; 
          }
          throw new Error(`Server returned ${res.status}`);
        }

        const json = await res.json();
        if (cancelled) return;
        
        const serverTrip = json.trip || json || {};
        const { start_date, end_date } = extractDates(serverTrip);
        const location = extractLocation(serverTrip);

        const normalized = {
          id: serverTrip.id ?? serverTrip.trip_id ?? serverTrip.tripId ?? tripId,
          trip_id: serverTrip.trip_id ?? serverTrip.id ?? serverTrip.tripId ?? tripId,
          title: serverTrip.title ?? serverTrip.name ?? serverTrip.trip_name ?? '',
          dates: serverTrip.dates ?? serverTrip.date_range ?? start_date ?? '',
          start_date: start_date ?? null,
          end_date: end_date ?? null,
          location: location ?? '',
          notes: serverTrip.notes ?? serverTrip.description ?? '',
          latitude: serverTrip.latitude,
          longitude: serverTrip.longitude,
          bbox_sw_lat: serverTrip.bbox_sw_lat,
          bbox_sw_lon: serverTrip.bbox_sw_lon,
          bbox_ne_lat: serverTrip.bbox_ne_lat,
          bbox_ne_lon: serverTrip.bbox_ne_lon
        };

        setTrip(normalized);
        await fetchEvents(normalized.trip_id); // Fetch events
        setLoading(false);
        return;

      } catch (err) {
        console.info('Could not fetch trip from API, falling back to localPreview', err);
        setFetchError(true);
      }

      // Fallback to local preview
      const preview = fetchTripPreviewFromLocal(tripId);
      if (preview && !cancelled) {
        const local = {
          id: preview.id,
          trip_id: preview.id,
          title: preview.title || preview.name || 'Untitled Trip',
          dates: preview.dates || '',
          start_date: preview.start_date ?? null,
          end_date: preview.end_date ?? null,
          location: preview.location ?? preview.destination ?? preview.place ?? '',
          notes: preview.notes ?? ''
        };
        setTrip(local);
        setEvents([]); // Local previews don't have events
      } else if (!cancelled) {
        setTrip(null);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [tripId, navigate]);

  // --- Return all the state and functions ---
  return {
    trip,
    events,
    loading,
    fetchError,
    isCreating,
    createError,
    tripLooksLikeServerId,
    createTripOnServer,
    saveTripDetails,
    fetchEvents,
    deleteTrip,
    deleteEvent
  };
}