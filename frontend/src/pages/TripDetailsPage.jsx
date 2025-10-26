// src/pages/TripDetailsPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';

const PREVIEWS_KEY = 'tripPreviews';

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
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setFetchError(false);

      // Try server endpoint
      try {
        const res = await fetch(`/api/trips/${encodeURIComponent(tripId)}/events`);
        if (!res.ok) {
          // treat non-OK as failure and fall back to local
          throw new Error(`server returned ${res.status}`);
        }
        const json = await res.json();
        if (cancelled) return;

        // server may return { trip, events } or events array
        if (json.trip) setTrip(json.trip);
        if (Array.isArray(json.events)) setEvents(json.events);
        else if (Array.isArray(json)) setEvents(json);
        else setEvents([]);

        setLoading(false);
        return;
      } catch (err) {
        console.info('Could not fetch events from API, falling back to localPreview', err);
        setFetchError(true);
      }

      // Fallback to local preview
      const preview = fetchTripPreviewFromLocal(tripId);
      if (preview) {
        if (!cancelled) {
          setTrip({
            id: preview.id,
            title: preview.title || preview.name || 'Untitled Trip',
            dates: preview.dates || '',
            notes: preview.notes || ''
          });
          // No structured events in preview - show placeholder
          setEvents([]);
          setLoading(false);
        }
      } else {
        if (!cancelled) {
          setTrip(null);
          setEvents([]);
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  // Close modal: go back or to dashboard
  function close() {
    if (window.history.length > 1) navigate(-1);
    else navigate('/dashboard');
  }

  return (
    <Layout>
      {/* "Modal" overlay — using Bootstrap modal markup but rendered by React */}
      <div className="modal-backdrop fade show" style={{ opacity: 0.45 }} />

      <div className="modal fade show" tabIndex="-1" role="dialog" style={{ display: 'block' }} aria-modal="true">
        <div className="modal-dialog modal-xl modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{trip ? trip.title : 'Trip Details'}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={close} />
            </div>

            <div className="modal-body">
              {/* Add to Trip area */}
              <h4 className="h5 mb-3">Add to Trip</h4>

              <div className="mb-3">
                <select className="form-select" aria-label="Add to trip select">
                  <option value="">Choose what to add</option>
                  <option value="flight">Flight</option>
                  <option value="hotel">Hotel</option>
                  <option value="activity">Activity</option>
                </select>
              </div>

              {/* Fetch error alert */}
              {fetchError && (
                <div className="alert alert-danger" role="alert">
                  Could not fetch events.
                </div>
              )}

              <h4 className="h5 mt-4">Itinerary</h4>
              {loading && <div className="small text-muted mb-3">Loading events...</div>}

              {!loading && events.length === 0 && (
                <div className="small text-muted mb-3">(No events added yet.)</div>
              )}

              {!loading && events.length > 0 && (
                <div className="list-group mb-3">
                  {events.map((ev, i) => (
                    <div key={ev.id ?? i} className="list-group-item">
                      <div className="d-flex justify-content-between">
                        <div>
                          <div className="fw-bold">{ev.title ?? ev.name ?? 'Event'}</div>
                          {ev.location && <div className="small text-muted">{ev.location}</div>}
                          {ev.description && <div className="small mt-1">{ev.description}</div>}
                        </div>
                        <div className="text-end small text-muted">
                          {ev.time ?? ev.when ?? ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={close}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
