// src/pages/DashboardPage/hooks/useDashboard.js
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiDelete } from '../../utils/api';

// --- Helper Functions (Moved from DashboardPage) ---
const PREVIEWS_KEY = 'tripPreviews';

function extractLocationFromTrip(t) {
  if (!t) return '';
  const simpleCandidates = [
    'location', 'destination', 'place', 'where',
    'location_name', 'city', 'country', 'address', 'venue'
  ];
  for (const k of simpleCandidates) {
    const v = t[k];
    if (v && typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function normalizeTrip(t) {
  if (!t) return t;
  const location = extractLocationFromTrip(t) || '';
  const title = t.name ?? t.title ?? t.trip_name ?? '';
  const start_date = t.start_date ?? t.startDate ?? null;
  const end_date = t.end_date ?? t.endDate ?? null;
  return { ...t, location, title, start_date, end_date };
}

// --- Main Hook ---
export function useDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const navigate = useNavigate();

  // --- Handlers ---
  const openNewTripModal = () => setIsModalOpen(true);
  const closeNewTripModal = () => setIsModalOpen(false);
  const closeDetailsModal = () => setSelectedTrip(null);
  const openDetailsModal = (trip) => setSelectedTrip(trip);

  // --- Fetch Trips (memoized) ---
  const fetchTrips = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGet('/api/trips');
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data.trips)
        ? data.trips
        : Array.isArray(data.data)
        ? data.data
        : [];

      const normalized = arr.map(normalizeTrip);
      setTrips(normalized);
      localStorage.setItem('cachedTrips', JSON.stringify(normalized)); // ✅ cache locally
    } catch (err) {
      setError(err.message || 'Failed to load trips');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]); // ✅ stable reference

  // --- Load Trips (only once) ---
  useEffect(() => {
    const cached = localStorage.getItem('cachedTrips');
    if (cached) {
      setTrips(JSON.parse(cached));
      setIsLoading(false);
    }

    // Fetch latest in background
    fetchTrips();
  }, [fetchTrips]);

  // --- Delete Trip ---
  const deleteTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip and all its data?')) return;

    try {
      await apiDelete(`/api/trips/${tripId}`);
      // ✅ Remove from state
      setTrips(prev => prev.filter(t => (t.trip_id ?? t.id) !== tripId));
    } catch (err) {
      setError(err.message);
    }
  };

  // --- Delete Event ---
  const deleteEvent = async (eventId, tripId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return false;

    try {
      await apiDelete(`/api/trips/${tripId}/events/${eventId}`);
      return true;
    } catch (err) {
      console.error('deleteEvent error:', err);
      setError(err.message);
      return false;
    }
  };

  // --- Event Listener: trip-updated ---
  useEffect(() => {
    const onTripUpdated = (e) => {
      try {
        const detail = e?.detail || {};
        const id = String(detail.id ?? '');
        const location = detail.location;
        if (!id) return;
        setTrips(prev =>
          prev.map(t =>
            String(t.trip_id ?? t.id ?? '') === id
              ? { ...t, location: location ?? t.location }
              : t
          )
        );
      } catch (err) {
        console.warn('trip-updated handler error', err);
      }
    };

    window.addEventListener('trip-updated', onTripUpdated);
    return () => window.removeEventListener('trip-updated', onTripUpdated);
  }, []);

  // --- Other handlers ---
  const handleRefresh = useCallback(() => fetchTrips(), [fetchTrips]);
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    navigate('/login');
  }, [navigate]);

  const handleTripCreated = useCallback(
    (created) => {
      if (!created) {
        fetchTrips();
        return;
      }
      const n = normalizeTrip(created);
      setTrips(prev => [n, ...prev]);
      setIsModalOpen(false);
    },
    [fetchTrips]
  );

  // --- Expose state + handlers ---
  return {
    trips,
    isLoading,
    error,
    isModalOpen,
    selectedTrip,
    openNewTripModal,
    closeNewTripModal,
    openDetailsModal,
    closeDetailsModal,
    handleRefresh,
    handleLogout,
    handleTripCreated,
    deleteTrip,
    deleteEvent,
  };
}
