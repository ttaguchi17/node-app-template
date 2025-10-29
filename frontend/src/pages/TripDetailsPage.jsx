// src/pages/TripDetailsPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import TripDetailsModal from '../components/TripDetailsModal.jsx';

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
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [showModal, setShowModal] = useState(false); // show modal only once trip is ready
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setFetchError(false);

      // Try server endpoint for trip (and events if returned)
      try {
        const res = await fetch(`/api/trips/${encodeURIComponent(tripId)}`);
        if (!res.ok) {
          // treat non-OK as failure and fall back to local
          throw new Error(`server returned ${res.status}`);
        }
        const json = await res.json();
        if (cancelled) return;

        // server may return { trip, events } or trip object
        const serverTrip = json.trip || json;
        // normalize to contain id and trip_id for downstream code
        const normalized = {
          id: serverTrip.id ?? serverTrip.trip_id ?? serverTrip.tripId ?? tripId,
          trip_id: serverTrip.trip_id ?? serverTrip.id ?? serverTrip.tripId ?? tripId,
          title: serverTrip.title ?? serverTrip.name ?? serverTrip.trip_name ?? '',
          dates: serverTrip.dates ?? serverTrip.date_range ?? '',
          notes: serverTrip.notes ?? serverTrip.description ?? ''
        };
        console.log('📘 TripDetailsPage: loaded trip from server:', normalized);
        setTrip(normalized);
        // server trip is authoritative — show modal
        setShowModal(true);
        setLoading(false);
        return;
      } catch (err) {
        console.info('Could not fetch trip from API, falling back to localPreview', err);
        setFetchError(true);
      }

      // Fallback to local preview
      const preview = fetchTripPreviewFromLocal(tripId);
      if (preview) {
        if (!cancelled) {
          const local = {
            id: preview.id,
            trip_id: preview.id,
            title: preview.title || preview.name || 'Untitled Trip',
            dates: preview.dates || '',
            notes: preview.notes || ''
          };
          console.log('📘 TripDetailsPage: using local preview:', local);
          setTrip(local);
          // Do NOT auto-open modal for local previews (so user can choose to save first)
          setShowModal(false);
          setLoading(false);
        }
      } else {
        if (!cancelled) {
          setTrip(null);
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  // Small helper to check if trip id is a server id (numeric)
  function tripLooksLikeServerId(t) {
    if (!t) return false;
    const id = String(t.trip_id ?? t.id ?? '');
    // Adjust this regex if your backend uses UUIDs (hex + dashes)
    return /^\d+$/.test(id);
  }

  // Close modal: go back or to dashboard
  function close() {
    if (window.history.length > 1) navigate(-1);
    else navigate('/dashboard');
  }

  // onClose handler passed to modal
  function handleModalClose() {
    setShowModal(false);
    // keep consistent navigation behavior
    close();
  }

  // Create the trip on the server using preview data, then open modal
  async function createTripOnServer() {
    if (!trip) return;
    setCreateError('');
    setIsCreating(true);

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

      // Send minimal payload; adjust fields to match your API
      const payload = {
        title: trip.title,
        dates: trip.dates,
        notes: trip.notes
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
      // server may return { trip } or the trip object directly
      const serverTrip = created.trip || created;
      const normalized = {
        id: serverTrip.id ?? serverTrip.trip_id ?? serverTrip.tripId ?? String(serverTrip.id ?? serverTrip.trip_id ?? trip.id),
        trip_id: serverTrip.trip_id ?? serverTrip.id ?? serverTrip.tripId ?? String(serverTrip.id ?? serverTrip.trip_id ?? trip.id),
        title: serverTrip.title ?? serverTrip.name ?? trip.title,
        dates: serverTrip.dates ?? trip.dates,
        notes: serverTrip.notes ?? serverTrip.description ?? trip.notes
      };

      // Update local preview store: replace preview id with server id if present
      try {
        const raw = localStorage.getItem(PREVIEWS_KEY);
        if (raw) {
          const arr = JSON.parse(raw);
          const idx = arr.findIndex(p => p.id === trip.id);
          if (idx >= 0) {
            arr.splice(idx, 1); // remove preview
            localStorage.setItem(PREVIEWS_KEY, JSON.stringify(arr));
          }
        }
      } catch (e) {
        console.warn('Could not update previews localStorage', e);
      }

      setTrip(normalized);
      setShowModal(true);
      setIsCreating(false);
      setCreateError('');
      console.log('📘 TripDetailsPage: created trip on server:', normalized);
    } catch (err) {
      console.error('createTripOnServer error', err);
      setCreateError(err.message || 'Failed to create trip on server.');
      setIsCreating(false);
    }
  }

  // Render
  return (
    <Layout>
      {/* Optionally show a small loader while we fetch the trip metadata */}
      {loading && (
        <div className="p-3">
          <div className="small text-muted">Loading trip...</div>
        </div>
      )}

      {/* If trip failed to load and no preview exists, show an error before opening modal */}
      {!loading && !trip && (
        <div className="p-3">
          <div className="alert alert-warning">Could not find the trip details.</div>
        </div>
      )}

      {/* If we have a local preview (non-server id), prompt user to save it */}
      {!loading && trip && !tripLooksLikeServerId(trip) && (
        <div className="p-3">
          <div className="mb-3">
            <h5>{trip.title || 'Unsaved Trip'}</h5>
            <div className="small text-muted mb-2">This trip exists only in your browser (preview).</div>

            {createError && <div className="alert alert-danger">{createError}</div>}

            <button className="btn btn-primary me-2" onClick={createTripOnServer} disabled={isCreating}>
              {isCreating ? 'Saving...' : 'Save Trip to Server'}
            </button>
            <button className="btn btn-outline-secondary" onClick={() => { close(); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* If trip is a server trip (or we've just created it), show the modal */}
      {trip && tripLooksLikeServerId(trip) && showModal && (
        <TripDetailsModal
          trip={{
            ...trip,
            trip_id: trip.trip_id ?? trip.id ?? tripId,
            id: trip.id ?? trip.trip_id ?? tripId
          }}
          show={showModal}
          onClose={handleModalClose}
        />
      )}
    </Layout>
  );
}
