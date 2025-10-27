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
  const [showModal, setShowModal] = useState(true); // show modal when page loads

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
        setTrip(normalized);
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
          setTrip({
            id: preview.id,
            trip_id: preview.id,
            title: preview.title || preview.name || 'Untitled Trip',
            dates: preview.dates || '',
            notes: preview.notes || ''
          });
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

      {/* Render TripDetailsModal when showModal is true.
          The modal component will fetch events itself. We ensure the trip prop has both id and trip_id to be defensive. */}
      {showModal && trip && (
        <TripDetailsModal
          trip={{
            ...trip,
            // ensure both identifiers exist for backward compatibility
            trip_id: trip.trip_id ?? trip.id ?? tripId,
            id: trip.id ?? trip.trip_id ?? tripId
          }}
          show={showModal}
          onClose={handleModalClose}
        />
      )}

      {/* If you prefer to still render a fallback UI (non-modal) for small screens you can add it here.
          For now, the modal is the primary interface. */}
    </Layout>
  );
}
