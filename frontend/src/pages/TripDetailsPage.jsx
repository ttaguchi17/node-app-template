// src/pages/TripDetailsPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, ListGroup, Badge } from 'react-bootstrap'; // Import components needed for display
import Layout from '../components/Layout.jsx';
// We NO LONGER import TripDetailsModal here

const PREVIEWS_KEY = 'tripPreviews';

// Helper: build auth header
const buildAuthHeader = (raw) => {
  if (!raw) return undefined;
  if (raw.toLowerCase().startsWith('bearer ')) return raw;
  return `Bearer ${raw}`;
};

// Helper: fetch local preview data
function fetchTripPreviewFromLocal(tripId) {
  try {
    const raw = localStorage.getItem(PREVIEWS_KEY);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return null;
    return arr.find((p) => p.id === tripId) || null;
  } catch (e) {
    console.warn('fetchTripPreviewFromLocal', e);
    return null;
  }
}

export default function TripDetailsPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [events, setEvents] = useState([]); // State to hold events
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // --- Data Loading Effect ---
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setFetchError(false);
      setEvents([]); // Reset events on load

      // Try server endpoint for trip
      try {
        const token = localStorage.getItem('token');
        const auth = buildAuthHeader(token);
        const res = await fetch(`/api/trips/${encodeURIComponent(tripId)}`, {
          headers: auth ? { Authorization: auth } : undefined
        });

        if (!res.ok) {
           if (res.status === 401 || res.status === 403) { // Handle auth errors specifically
             localStorage.removeItem('token');
             navigate('/login'); // Redirect to login if unauthorized
             return;
           }
           throw new Error(`Server returned ${res.status}`);
        }

        const json = await res.json();
        if (cancelled) return;

        const serverTrip = json.trip || json;
        const normalized = {
          id: serverTrip.id ?? serverTrip.trip_id ?? serverTrip.tripId ?? tripId,
          trip_id: serverTrip.trip_id ?? serverTrip.id ?? serverTrip.tripId ?? tripId,
          title: serverTrip.title ?? serverTrip.name ?? serverTrip.trip_name ?? '',
          dates: serverTrip.dates ?? serverTrip.date_range ?? serverTrip.start_date ?? '', // Use start_date as fallback
          notes: serverTrip.notes ?? serverTrip.description ?? ''
        };
        console.log('📘 TripDetailsPage: loaded trip from server:', normalized);
        setTrip(normalized);

        // --- Fetch Events Separately ---
        // Now that we have the trip, fetch its events
        try {
            const eventsRes = await fetch(`/api/trips/${encodeURIComponent(normalized.trip_id)}/events`, {
                headers: auth ? { Authorization: auth } : undefined
            });
            if (!eventsRes.ok) {
                throw new Error(`Could not fetch events (status ${eventsRes.status})`);
            }
            const eventsData = await eventsRes.json();
            const eventList = Array.isArray(eventsData) ? eventsData : Array.isArray(eventsData.events) ? eventsData.events : [];
            if (!cancelled) setEvents(eventList);
        } catch(eventErr) {
            console.warn("Could not fetch events:", eventErr);
            setFetchError(true); // Show an error if events fail
        }
        // --- End Fetch Events ---

        setLoading(false);
        return; // Success!

      } catch (err) {
        console.info('Could not fetch trip from API, falling back to localPreview', err);
        setFetchError(true); // Indicate general fetch error
      }

      // Fallback to local preview (if API failed)
      const preview = fetchTripPreviewFromLocal(tripId);
      if (preview && !cancelled) {
        const local = {
          id: preview.id,
          trip_id: preview.id, // Treat local preview ID as trip_id for consistency
          title: preview.title || preview.name || 'Untitled Trip',
          dates: preview.dates || '',
          notes: preview.notes || ''
        };
        console.log('📘 TripDetailsPage: using local preview:', local);
        setTrip(local);
        // Local previews don't have events stored
        setEvents([]);
      } else if (!cancelled) {
        setTrip(null); // No trip found locally either
      }

      if (!cancelled) setLoading(false);
    }

    load();

    return () => { cancelled = true; };
  }, [tripId, navigate]); // Add navigate to dependency array

  // Helper to check if trip id looks like a server id
  function tripLooksLikeServerId(t) {
    if (!t) return false;
    const id = String(t.trip_id ?? t.id ?? '');
    return /^\d+$/.test(id);
  }

  // Go back or to dashboard
  function goBack() {
    if (window.history.length > 1) navigate(-1);
    else navigate('/dashboard');
  }

  // --- Create Trip on Server (Same logic as before) ---
  async function createTripOnServer() {
      if (!trip) return;
      setCreateError('');
      setIsCreating(true);
      try {
          const token = localStorage.getItem('token');
          const auth = buildAuthHeader(token);
          const headers = {
              'Content-Type': 'application/json',
              ...(auth ? { Authorization: auth } : {})
          };
          const payload = {
              name: trip.title,
              start_date: trip.dates,
              // end_date: ... // Add if needed
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
          const normalized = {
              id: serverTrip.id ?? serverTrip.trip_id ?? String(serverTrip.id ?? serverTrip.trip_id),
              trip_id: serverTrip.trip_id ?? serverTrip.id ?? String(serverTrip.id ?? serverTrip.trip_id),
              title: serverTrip.title ?? serverTrip.name ?? trip.title,
              dates: serverTrip.dates ?? serverTrip.start_date ?? trip.dates,
              notes: serverTrip.notes ?? serverTrip.description ?? trip.notes
          };
          // Update local storage (remove preview)
          try {
              const raw = localStorage.getItem(PREVIEWS_KEY);
              if (raw) {
                  const arr = JSON.parse(raw);
                  const updatedArr = arr.filter(p => p.id !== trip.id); // Filter out old preview
                  localStorage.setItem(PREVIEWS_KEY, JSON.stringify(updatedArr));
              }
          } catch (e) { console.warn('Could not update previews localStorage', e); }

          setTrip(normalized); // Update state with server trip data
          setIsCreating(false);
          setCreateError('');
          console.log('📘 TripDetailsPage: created trip on server:', normalized);
          // Now fetch events for the newly created trip
          await fetchEvents(normalized.trip_id);

      } catch (err) {
          console.error('createTripOnServer error', err);
          setCreateError(err.message || 'Failed to create trip on server.');
          setIsCreating(false);
      }
  }


  // --- Render Logic ---
  return (
    <Layout>
      {/* 1. Loading State */}
      {loading && (
        <div className="container-fluid p-3">
          <p className="text-muted">Loading trip...</p>
        </div>
      )}

      {/* 2. Error State (after loading, if no trip found) */}
      {!loading && !trip && (
        <div className="container-fluid p-3">
          <Alert variant="warning">Could not find the trip details.</Alert>
          <button className="btn btn-secondary" onClick={goBack}>Go Back</button>
        </div>
      )}

      {/* 3. Trip Loaded - Display Content */}
      {!loading && trip && (
        <div className="container-fluid p-3">

          {/* 3a. Handle Local Preview */}
          {!tripLooksLikeServerId(trip) && (
            <div className="mb-4 p-3 border rounded bg-light">
              <h5>{trip.title || 'Unsaved Trip'}</h5>
              <p className="small text-muted mb-2">This trip exists only in your browser (preview).</p>
              {createError && <Alert variant="danger">{createError}</Alert>}
              <button className="btn btn-primary me-2" onClick={createTripOnServer} disabled={isCreating}>
                {isCreating ? 'Saving...' : 'Save Trip to Server'}
              </button>
              <button className="btn btn-outline-secondary" onClick={goBack}>
                Cancel
              </button>
            </div>
          )}

          {/* 3b. Display Trip Details (for both local and server trips) */}
          <div className="mb-4">
            <h2>{trip.title}</h2>
            {trip.dates && <p className="text-muted">{trip.dates}</p>}
            {trip.notes && <p>{trip.notes}</p>}
          </div>

          {/* 3c. Display Itinerary (Events List) */}
          <div className="details mt-4">
            <h5>Itinerary</h5>
             {fetchError && <Alert variant="danger">Could not load itinerary details.</Alert>}
            <ListGroup id="detailList" variant="flush">
              {events.length > 0 ? (
                events.map(event => (
                  <ListGroup.Item
                    key={event.event_id ?? event.id ?? `${event.title}-${Math.random()}`}
                    className="d-flex justify-content-between align-items-start px-0" // px-0 for flush look
                  >
                    <div>
                      <div className="fw-bold text-dark">{event.title ?? event.name ?? 'Untitled Event'}</div>
                      <small className="text-muted">
                        {event.start_time ? new Date(event.start_time).toLocaleString() : event.time ?? ''}
                      </small>
                      {event.location && <div className="small text-muted mt-1">{event.location}</div>}
                      {event.details && <div className="small mt-1">{event.details}</div>}
                      {event.description && !event.details && <div className="small mt-1">{event.description}</div>}
                    </div>
                    <Badge bg="info" pill>{event.type ?? 'Event'}</Badge>
                  </ListGroup.Item>
                ))
              ) : (
                 // Only show 'no events' if not loading and not a local preview before saving
                !loading && tripLooksLikeServerId(trip) && <div className="small text-muted">(No events added yet.)</div>
              )}
            </ListGroup>
          </div>

          {/* Back Button */}
          <div className='mt-4'>
             <button className="btn btn-secondary" onClick={goBack}>Go Back</button>
          </div>
        </div>
      )}

      {/* NO LONGER RENDERING <TripDetailsModal /> HERE */}

    </Layout>
  );
}