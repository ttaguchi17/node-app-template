import React, { useState, useEffect } from 'react';
import { Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import NewTripModal from '../components/NewTripModal.jsx';
import TripList from '../components/TripList.jsx';
import TripDetailsModal from '../components/TripDetailsModal.jsx';

const PREVIEWS_KEY = 'tripPreviews'; // local preview storage key

// Helper: robustly extract a human-readable location from many shapes
function extractLocationFromTrip(t) {
  if (!t) return '';

  const simpleCandidates = [
    'location', 'destination', 'place', 'where', 'location_name', 'city', 'country', 'address', 'venue'
  ];
  for (const k of simpleCandidates) {
    const v = t[k];
    if (v && typeof v === 'string' && v.trim()) return v.trim();
  }

  const nestedPaths = [
    ['location', 'name'],
    ['location', 'label'],
    ['destination', 'name'],
    ['destination', 'label'],
    ['place', 'name'],
    ['place', 'city'],
    ['address', 'city'],
    ['address', 'cityName'],
    ['address', 'line1'],
    ['venue', 'address'],
    ['venue', 'city'],
    ['venue', 'name'],
    ['geo', 'placeName']
  ];

  for (const path of nestedPaths) {
    let cur = t;
    for (const p of path) {
      if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
      else { cur = null; break; }
    }
    if (cur && typeof cur === 'string' && cur.trim()) return cur.trim();
  }

  try {
    const addr = t.address || t.location || t.destination || t.place || null;
    if (addr && typeof addr === 'object') {
      const parts = [];
      if (addr.city) parts.push(addr.city);
      if (addr.state) parts.push(addr.state);
      if (addr.country) parts.push(addr.country);
      if (addr.line1) parts.unshift(addr.line1);
      const joined = parts.filter(Boolean).join(', ');
      if (joined) return joined;
    }
  } catch (e) {}

  for (const k of Object.keys(t)) {
    try {
      const v = t[k];
      if (typeof v === 'string' && v.length > 0 && v.length < 100 && /[A-Za-z]/.test(v)) {
        if (k.toLowerCase().includes('loc') || k.toLowerCase().includes('place') || k.toLowerCase().includes('city') || k.toLowerCase().includes('dest')) {
          return v.trim();
        }
      }
    } catch (e) {}
  }

  return '';
}

function normalizeTrip(t) {
  if (!t) return t;
  const location = extractLocationFromTrip(t) || '';
  const title = t.name ?? t.title ?? t.trip_name ?? '';
  const start_date = t.start_date ?? t.startDate ?? null;
  const end_date = t.end_date ?? t.endDate ?? null;
  return {
    ...t,
    location,
    title,
    start_date,
    end_date
  };
}

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarToggled, setIsSidebarToggled] = useState(false);
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const navigate = useNavigate();

  const openNewTripModal = () => setIsModalOpen(true);
  const closeNewTripModal = () => setIsModalOpen(false);
  const toggleSidebar = () => setIsSidebarToggled(!isSidebarToggled);
  const closeDetailsModal = () => setSelectedTrip(null);

  // Fetch trips and normalize
  const fetchTrips = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/trips', {
        method: 'GET',
        headers: token ? { Authorization: token } : {}
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

      // data might be array or { trips: [...] }
      let arr = [];
      if (Array.isArray(data)) arr = data;
      else if (Array.isArray(data.trips)) arr = data.trips;
      else if (Array.isArray(data.data)) arr = data.data;
      else arr = [];

      // Normalize all server trips
      const normalized = arr.map(normalizeTrip);

      // Merge in local preview overrides (location and any preview-only trips)
      try {
        const rawPre = localStorage.getItem(PREVIEWS_KEY);
        if (rawPre) {
          const previews = JSON.parse(rawPre) || [];
          // Build a map of previews by id for quick lookup
          const previewMap = {};
          previews.forEach(p => {
            if (p && p.id) previewMap[String(p.id)] = p;
          });

          // Apply preview overrides to existing server trips
          for (let i = 0; i < normalized.length; i++) {
            const t = normalized[i];
            const key = String(t.trip_id ?? t.id ?? '');
            if (previewMap[key]) {
              const p = previewMap[key];
              if (p.location) normalized[i] = { ...t, location: p.location };
            }
          }

          // If there are preview-only trips (not present on server), prepend them
          const serverIds = new Set(normalized.map(t => String(t.trip_id ?? t.id ?? '')));
          const previewOnly = previews
            .filter(p => p && p.id && !serverIds.has(String(p.id)))
            .map(p => normalizeTrip(p)); // reuse normalizeTrip so fields are consistent

          if (previewOnly.length) {
            normalized.unshift(...previewOnly);
          }
        }
      } catch (e) {
        console.warn('Could not apply local previews to trips list', e);
      }

      setTrips(normalized);

      // helpful debug
      console.log('DEBUG: raw trips response (first item):', arr && arr[0]);
      console.log('DEBUG: normalized trips (first item):', normalized && normalized[0]);

    } catch (err) {
      setError(err.message || 'Failed to load trips');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSidebarToggled) document.body.classList.add('sidebar-toggled');
    else document.body.classList.remove('sidebar-toggled');
    return () => document.body.classList.remove('sidebar-toggled');
  }, [isSidebarToggled]);

  useEffect(() => {
    fetchTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for trip-updated events (so detail page can update dashboard instantly)
  useEffect(() => {
    const onTripUpdated = (e) => {
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
  }, []);

  const handleRefresh = () => fetchTrips();
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleTripCreated = (created) => {
    if (!created) {
      fetchTrips();
      return;
    }
    const n = normalizeTrip(created);
    setTrips(prev => [n, ...prev]);
    setIsModalOpen(false);
  };

  const renderContent = () => {
    if (isLoading) return <p>Loading trips...</p>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!trips || trips.length === 0) {
      return (
        <div className="col-12">
          <Alert variant="info">
            You have no trips yet. Click{' '}
            <em onClick={openNewTripModal} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
              New Trip
            </em>{' '}
            to create one.
          </Alert>
        </div>
      );
    }
    return <TripList trips={trips} onCardClick={setSelectedTrip} />;
  };

  return (
    <>
      <Layout
        isSidebarToggled={isSidebarToggled}
        onToggleSidebar={toggleSidebar}
        onNewTripClick={openNewTripModal}
        onRefreshClick={handleRefresh}
        onLogoutClick={handleLogout}
      >
        <div className="d-sm-flex align-items-center justify-content-between mb-4">
          <h1 className="h3 mb-0 text-gray-800">Dashboard</h1>
        </div>

        <div className="row" id="trips-container">
          {renderContent()}
        </div>
      </Layout>

      <NewTripModal
        show={isModalOpen}
        onClose={closeNewTripModal}
        onTripCreated={handleTripCreated}
      />

      <TripDetailsModal
        show={selectedTrip !== null}
        onClose={closeDetailsModal}
        trip={selectedTrip}
      />
    </>
  );
}
