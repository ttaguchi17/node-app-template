// src/pages/DashboardPage/hooks/useDashboard.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- Helper Functions (Moved from DashboardPage) ---
const PREVIEWS_KEY = 'tripPreviews';

function extractLocationFromTrip(t) {
  // ... (copy and paste your full extractLocationFromTrip function here) ...
  if (!t) return '';
  const simpleCandidates = [ 'location', 'destination', 'place', 'where', 'location_name', 'city', 'country', 'address', 'venue' ];
  for (const k of simpleCandidates) {
    const v = t[k];
    if (v && typeof v === 'string' && v.trim()) return v.trim();
  }
  // ... (rest of the function) ...
  return '';
}

function normalizeTrip(t) {
  // ... (copy and paste your full normalizeTrip function here) ...
  if (!t) return t;
  const location = extractLocationFromTrip(t) || '';
  const title = t.name ?? t.title ?? t.trip_name ?? '';
  const start_date = t.start_date ?? t.startDate ?? null;
  const end_date = t.end_date ?? t.endDate ?? null;
  return { ...t, location, title, start_date, end_date };
}
// --- (End of Helper Functions) ---


// This is our new hook
export function useDashboard() {
  // All state is managed here
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const navigate = useNavigate();

  // All handlers are managed here
  const openNewTripModal = () => setIsModalOpen(true);
  const closeNewTripModal = () => setIsModalOpen(false);
  const closeDetailsModal = () => setSelectedTrip(null);
  const openDetailsModal = (trip) => setSelectedTrip(trip); // Renamed for clarity

  // All data fetching is managed here
  const fetchTrips = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      // ... (copy/paste your entire fetchTrips 'try' block here) ...
      // ... (it includes fetching, normalizing, merging local data) ...
      const response = await fetch('http://localhost:3000/api/trips', {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch trips. Are you logged in?');
      }
      const data = await response.json();
      let arr = [];
      if (Array.isArray(data)) arr = data;
      else if (Array.isArray(data.trips)) arr = data.trips;
      else if (Array.isArray(data.data)) arr = data.data;
      else arr = [];
      const normalized = arr.map(normalizeTrip);
      // ... (all the localStorage merge logic) ...
      setTrips(normalized);
    } catch (err) {
      setError(err.message || 'Failed to load trips');
    } finally {
      setIsLoading(false);
    }
  };

const deleteTrip = async (tripId) => {
    // Ask for confirmation
    if (!window.confirm('Are you sure you want to delete this trip and all its data? This cannot be undone.')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to delete trips.');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete trip.');
      }

      // Success! Remove the trip from the local state to update the UI
      setTrips(prevTrips => prevTrips.filter(trip => (trip.trip_id ?? trip.id) !== tripId));

    } catch (err) {
      // Show the error to the user
      setError(err.message);
    }
  };

  const deleteEvent = async (eventId, tripId) => {
    // This function will be passed to the modal.
    // It just needs to call the API. The modal will refresh itself.
    
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return false; // User cancelled
    }

    const token = localStorage.getItem('token');
    const auth = buildAuthHeader(token);

    try {
      const res = await fetch(`/api/trips/${tripId}/events/${eventId}`, {
        method: 'DELETE',
        headers: auth ? { Authorization: auth } : undefined,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete event.');
      }
      
      return true; // Return true on success

    } catch (err) {
      console.error('deleteEvent error:', err);
      setError(err.message); // Set the main dashboard error
      return false; // Return false on failure
    }
  };
  // All effects are managed here
  useEffect(() => {
    fetchTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Runs once on mount

  useEffect(() => {
    const onTripUpdated = (e) => {
      // ... (copy/paste your trip-updated listener logic here) ...
      try {
        const detail = e?.detail || {};
        const id = String(detail.id ?? '');
        const location = detail.location;
        if (!id) return;
        setTrips(prev => prev.map(t => (String(t.trip_id ?? t.id ?? '') === id ? { ...t, location: location ?? t.location } : t)));
      } catch (err) {
        console.warn('trip-updated handler error', err);
      }
    };
    window.addEventListener('trip-updated', onTripUpdated);
    return () => window.removeEventListener('trip-updated', onTripUpdated);
  }, []); // Runs once on mount

  // Other page-level handlers
  const handleRefresh = () => fetchTrips();
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleTripCreated = (created) => {
    if (!created) {
      fetchTrips(); // Do a full refresh if something weird happens
      return;
    }
    const n = normalizeTrip(created);
    setTrips(prev => [n, ...prev]);
    setIsModalOpen(false);
  };

  // This is the "Control Panel" we return to the page
  return {
    // State
    trips,
    isLoading,
    error,
    isModalOpen,
    selectedTrip,
    // Functions
    openNewTripModal,
    closeNewTripModal,
    openDetailsModal,
    closeDetailsModal,
    handleRefresh,
    handleLogout,
    handleTripCreated,
    deleteTrip,
    deleteEvent
  };
}