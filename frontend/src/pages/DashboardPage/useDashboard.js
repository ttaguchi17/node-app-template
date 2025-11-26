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

// utility to read common token keys from localStorage
function readAuthToken() {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('auth_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    null
  );
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

    // helper to parse response shapes into array
    const normalizeResponseToArray = (data) => {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.trips)) return data.trips;
      if (Array.isArray(data.data)) return data.data;
      // some apis return { result: [...] }
      if (Array.isArray(data.result)) return data.result;
      return [];
    };

    try {
      // Primary: prefer your apiGet util (keeps existing behavior)
      try {
        const data = await apiGet('/api/trips');
        const arr = normalizeResponseToArray(data);
        const normalized = arr.map(normalizeTrip);
        setTrips(normalized);
        localStorage.setItem('cachedTrips', JSON.stringify(normalized));
        setIsLoading(false);
        return;
      } catch (primaryErr) {
        // log primary error, then attempt fallback
        console.warn('apiGet(/api/trips) failed:', primaryErr);
      }

      // Fallback: attempt direct fetch with Authorization header from localStorage
      try {
        const token = readAuthToken();
        const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
        console.debug('Fallback fetching /api/trips with headers:', { hasToken: !!token });
        const res = await fetch('/api/trips', { method: 'GET', headers });
        if (!res.ok) {
          // try to get response body for diagnosis
          const txt = await res.text().catch(() => '');
          const msg = `Fallback fetch /api/trips returned ${res.status}. ${txt ? `Body: ${txt}` : ''}`;
          throw new Error(msg);
        }
        const data = await res.json().catch(() => null);
        const arr = normalizeResponseToArray(data);
        const normalized = arr.map(normalizeTrip);
        setTrips(normalized);
        localStorage.setItem('cachedTrips', JSON.stringify(normalized));
        setIsLoading(false);
        return;
      } catch (fallbackErr) {
        console.error('Fallback fetch /api/trips failed:', fallbackErr);
        throw fallbackErr; // fall through to outer catch
      }
    } catch (err) {
      // Provide helpful error for UI and console
      const message = (err && err.message) ? err.message : 'Failed to load trips';
      console.error('fetchTrips error:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // --- Load Trips (only once) ---
  useEffect(() => {
    const cached = localStorage.getItem('cachedTrips');
    if (cached) {
      try {
        setTrips(JSON.parse(cached));
        setIsLoading(false);
      } catch (e) {
        console.warn('Failed to parse cachedTrips, will refetch', e);
      }
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
      setTrips(prev => prev.filter(t => (String(t.trip_id ?? t.id) !== String(tripId))));
    } catch (err) {
      console.error('deleteTrip error:', err);
      setError(err.message || 'Failed to delete trip');
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
      setError(err.message || 'Failed to delete event');
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
    // remove several common token keys to be safe
    try {
      ['auth_token', 'token', 'authToken', 'voyago_user', 'cachedTrips'].forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('handleLogout localStorage cleanup failed', e);
    }
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
