// src/pages/DashboardPage/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Alert, Row, Col, Card, Button, Form, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import NewTripModal from './components/NewTripModal.jsx';
import TripList from './components/TripList.jsx';
import TripDetailsModal from '../../components/TripDetailsModal.jsx';
import { useDashboard } from './useDashboard.js';

// small helper to safely parse token
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

function StatCard({ title, value, subtitle, icon }) {
  return (
    <Card className="shadow-sm rounded-lg h-100">
      <Card.Body className="d-flex flex-column">
        <div>
          <div className="text-muted fw-semibold" style={{ fontSize: 16 }}>{title}</div>
        </div>

        <div className="mt-3 flex-grow-1">
          <div style={{ fontSize: 38, fontWeight: 700 }}>{value}</div>
          {subtitle && <div className="text-muted" style={{ fontSize: 15 }}>{subtitle}</div>}
        </div>
      </Card.Body>
    </Card>
  );
}

function HeroBanner({ backgroundImage, title, subtitle }) {
  const style = {
    backgroundImage: `linear-gradient(135deg, rgba(70,66,200,0.9) 0%, rgba(117,125,255,0.85) 100%), url("${backgroundImage}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: 'white',
    borderRadius: 14,
    padding: '42px 32px',
    boxShadow: '0 8px 30px rgba(18,22,70,0.08)',
  };
  return (
    <div style={style} className="mb-4">
      <h1 style={{ fontSize: 48, fontWeight: 700, margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ opacity: 0.95, marginTop: 10, fontSize: 18 }}>{subtitle}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const {
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
    deleteEvent
  } = useDashboard();

  const handleDeleteEvent = async (eventId) => {
    if (!selectedTrip) return false;
    const tripId = selectedTrip.trip_id ?? selectedTrip.id;
    if (!tripId) return false;
    try {
      await fetch(`/api/trips/${encodeURIComponent(tripId)}/events/${eventId}`, { method: 'DELETE' });
      return true;
    } catch (err) {
      console.error('Dashboard deleteEvent error:', err);
      return false;
    }
  };

  const [isSidebarToggled, setIsSidebarToggled] = useState(false);
  const toggleSidebar = () => setIsSidebarToggled(!isSidebarToggled);
  useEffect(() => {
    if (isSidebarToggled) document.body.classList.add('sidebar-toggled');
    else document.body.classList.remove('sidebar-toggled');
    return () => document.body.classList.remove('sidebar-toggled');
  }, [isSidebarToggled]);

  const [manualSearchQuery, setManualSearchQuery] = useState('');

  const handleScanLast30Days = async () => {
    try {
      await handleRefresh();
      window.alert('Scan requested (placeholder). Replace with real scan API call.');
    } catch (err) {
      console.error('Scan error', err);
      window.alert('Scan failed (placeholder). Check console.');
    }
  };

  const handleManualSearch = async () => {
    window.alert(`Manual search requested for: "${manualSearchQuery}" (placeholder)`);
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
    return <TripList trips={trips} onCardClick={openDetailsModal} onDeleteClick={deleteTrip} />;
  };

  // ---------- helpers for robust stats extraction ----------
  const countEventsInTrip = (t) => {
    if (!t) return 0;

    // direct numeric counters
    if (typeof t.event_count === 'number') return t.event_count;
    if (typeof t.events_count === 'number') return t.events_count;
    if (typeof t.total_events === 'number') return t.total_events;

    // look for arrays whose key implies events/itinerary/timeline
    const eventKeys = Object.keys(t).filter((k) =>
      /event|events|itinerar|timeline|trip_events|schedule|itinerary|items/i.test(k)
    );

    for (const k of eventKeys) {
      const v = t[k];
      if (Array.isArray(v)) return v.length;
      // if it's an object with list inside
      if (v && typeof v === 'object') {
        // try common nested arrays
        const nestedKeys = Object.keys(v).filter((nk) => Array.isArray(v[nk]) && /event|items|list|itinerar/i.test(nk));
        if (nestedKeys.length) return v[nestedKeys[0]].length;
      }
    }

    // fallback: maybe events stored under 'events' but undefined due to fetch; return 0
    return 0;
  };

  /**
   * Robust member extraction:
   * - Accepts many shapes: arrays of strings, arrays of objects, object with nested user, single object with email/id/name, or keys like 'members', 'participants', 'trip_membership', etc.
   * - Normalizes members by preferred identifier (email if present, else id, else name).
   * - We use a Set to dedupe across trips (counts unique users across all trips).
   */
  const addMemberIdentifiersFromValue = (val, set) => {
    if (!val) return;
    // If it's an array, iterate
    if (Array.isArray(val)) {
      for (const entry of val) addMemberIdentifiersFromValue(entry, set);
      return;
    }

    // If it's a string, treat as email/identifier
    if (typeof val === 'string') {
      const id = val.trim().toLowerCase();
      if (id) set.add(id);
      return;
    }

    // If it's an object, try to find common identifier fields
    if (typeof val === 'object' && val !== null) {
      // If object looks like { user: { ... } } or { member: {...} }, recursively inspect common nested props
      const nestedCandidateKeys = ['user', 'member', 'attendee', 'traveler', 'participant', 'person'];
      for (const nk of nestedCandidateKeys) {
        if (val[nk]) {
          addMemberIdentifiersFromValue(val[nk], set);
        }
      }

      // Common identifier fields
      const possibleIdFields = [
        'email', 'user_email', 'member_email',
        'id', 'user_id', 'member_id',
        'uuid', 'uid',
        'name', 'full_name', 'displayName', 'display_name',
        'username'
      ];

      for (const field of possibleIdFields) {
        if (val[field]) {
          let raw = String(val[field]).trim();
          if (!raw) continue;
          // prefer email normalization
          if (field.toLowerCase().includes('email') && raw) {
            set.add(raw.toLowerCase());
            return;
          }
          // if id-like
          if (['id', 'user_id', 'member_id', 'uuid', 'uid'].includes(field)) {
            set.add(`id:${raw}`);
            return;
          }
          // fallback to name
          if (['name', 'full_name', 'displayName', 'display_name', 'username'].includes(field)) {
            set.add(`name:${raw.toLowerCase()}`);
            return;
          }
        }
      }

      // If object is a map of keys where values look like identifiers, try to scan a bit
      for (const k of Object.keys(val)) {
        const v = val[k];
        if (!v) continue;
        if (typeof v === 'string' && /\S+@\S+\.\S+/.test(v)) {
          set.add(v.toLowerCase());
          return;
        }
      }

      // If nothing matched, stringify as last resort (avoid collisions by prefix)
      try {
        const s = JSON.stringify(val);
        if (s) set.add(`obj:${s}`);
      } catch (e) {
        // ignore
      }
    }
  };

  /**
   * Collect buddies/members from a trip object.
   * This looks for commonly used keys and also inspects the whole object defensively.
   */
  const collectBuddiesFromTrip = (t, set) => {
    if (!t || typeof t !== 'object') return;

    // Common keys which often hold member lists or single member info
    const memberKeys = [
      'members', 'participants', 'attendees', 'travel_buddies', 'guests', 'memberships', 'trip_members',
      'trip_membership', 'trip_memberships', 'members_list', 'people', 'users'
    ];

    for (const key of memberKeys) {
      if (t[key]) addMemberIdentifiersFromValue(t[key], set);
    }

    // some APIs put members under `membership` or `owner` fields
    if (t.membership) addMemberIdentifiersFromValue(t.membership, set);
    if (t.owner) addMemberIdentifiersFromValue(t.owner, set);
    if (t.created_by) addMemberIdentifiersFromValue(t.created_by, set);
    if (t.creator) addMemberIdentifiersFromValue(t.creator, set);

    // If trip object itself looks like a membership row (e.g., single user fields), inspect a few
    addMemberIdentifiersFromValue(t, set);
  };

  // ---------- new state for totals (so we can update from effect/fallback) ----------
  const [totalEvents, setTotalEvents] = useState(0);
  const [travelBuddies, setTravelBuddies] = useState(0);
  const [destinationsCount, setDestinationsCount] = useState(0);

  // Compute quick totals from trips immediately (fast and offline)
  useEffect(() => {
    try {
      const upcomingTrips = Array.isArray(trips) ? trips.length : 0;

      // events sum
      const eventsCount = (Array.isArray(trips) ? trips : []).reduce((acc, t) => acc + countEventsInTrip(t), 0);

      // destinations
      const destinationCandidates = (Array.isArray(trips) ? trips : []).map((t) => {
        if (!t) return '';
        if (t.destination && typeof t.destination === 'string') return t.destination;
        if (t.place && typeof t.place === 'string') return t.place;
        if (t.location) {
          if (typeof t.location === 'string') return t.location;
          if (typeof t.location === 'object') return t.location.name || t.location.city || t.location.country || '';
        }
        if (t.city && typeof t.city === 'string') return t.city;
        if (t.country && typeof t.country === 'string') return t.country;
        if (t.title && typeof t.title === 'string') return t.title;
        return '';
      }).filter(Boolean);
      const uniqDest = new Set(destinationCandidates.map(d => d.toLowerCase()));
      const destCount = uniqDest.size;

      // members - improved: build a set of unique member identifiers across all trips
      const memberSet = new Set();
      (Array.isArray(trips) ? trips : []).forEach((t) => {
        try {
          collectBuddiesFromTrip(t, memberSet);
        } catch (err) {
          // ignore problem with any single trip
        }
      });
      const buddies = memberSet.size;

      // apply computed values
      setTotalEvents(eventsCount);
      setTravelBuddies(buddies);
      setDestinationsCount(destCount);

      // Debug: show shapes so we can tune heuristics if needed
      console.debug('Dashboard quick totals from trips:', { upcomingTrips, eventsCount, destCount, buddies, trips });
    } catch (err) {
      console.warn('Error computing dashboard totals from trips:', err);
    }
  }, [trips]);

  // If quick totals look wrong (0 when there are trips), attempt a backend fallback
  useEffect(() => {
    const shouldFallback = Array.isArray(trips) && trips.length > 0 && (totalEvents === 0 || travelBuddies === 0);

    if (!shouldFallback) return;

    let cancelled = false;

    const tryBackendCounts = async () => {
      try {
        // --- Fallback: try fetching events per trip and sum them (uses trip-specific route)
        try {
          const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
          const tripArray = Array.isArray(trips) ? trips : [];
          // Build list of trip IDs we can call
          const ids = tripArray
            .map(t => t.trip_id ?? t.id ?? t._id ?? null)
            .filter(Boolean);

          if (ids.length > 0) {
            // fetch events for each trip in parallel, tolerate failures
            const promises = ids.map(async (id) => {
              try {
                const r = await fetch(`/api/trips/${encodeURIComponent(id)}/events`, { headers });
                if (!r.ok) {
                  console.debug(`/api/trips/${id}/events returned`, r.status);
                  return 0;
                }
                const payload = await r.json();
                // payload could be { events: [...] } or an array directly depending on backend
                const arr = Array.isArray(payload) ? payload : Array.isArray(payload.events) ? payload.events : Array.isArray(payload.data) ? payload.data : [];
                return Array.isArray(arr) ? arr.length : 0;
              } catch (err) {
                console.debug(`Failed to fetch events for trip ${id}:`, err && err.message);
                return 0;
              }
            });

            const results = await Promise.all(promises);
            const total = results.reduce((a, b) => a + (Number(b) || 0), 0);
            if (!cancelled) {
              setTotalEvents(total);
              console.debug('Fallback: aggregated events per trip =', total);
            }
          }
        } catch (err) {
          console.warn('Fallback counts (per-trip) error', err);
        }

        // Try GET /api/trips to get fresh trip objects (maybe include members arrays)
        try {
          const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
          const res = await fetch('/api/trips', { headers });
          if (res.ok) {
            const data = await res.json();
            const arr = Array.isArray(data) ? data : Array.isArray(data.trips) ? data.trips : Array.isArray(data.data) ? data.data : [];
            // collect members across returned trips
            const memberSet = new Set();
            (arr || []).forEach((t) => {
              try {
                collectBuddiesFromTrip(t, memberSet);
              } catch (err) { /* ignore per trip */ }
            });
            if (!cancelled) {
              if (memberSet.size > 0) setTravelBuddies(memberSet.size);
              console.debug('Fallback: fetched /api/trips member count =', memberSet.size);
            }
          } else {
            console.debug('/api/trips fallback returned', res.status);
          }
        } catch (e) {
          console.debug('Failed to fetch /api/trips for fallback:', e && e.message);
        }
      } catch (err) {
        console.warn('Fallback counts error', err);
      }
    };

    tryBackendCounts();

    return () => {
      cancelled = true;
    };
  }, [trips, totalEvents, travelBuddies]);

  // Stats array used for rendering
  const stats = [
    { title: 'Upcoming Trips', value: Array.isArray(trips) ? trips.length : 0, subtitle: Array.isArray(trips) && trips.length > 0 ? `+${trips.length} this month` : '' },
    { title: 'Total Events', value: totalEvents, subtitle: totalEvents > 0 ? `+${totalEvents} this week` : '' },
    { title: 'Destinations', value: destinationsCount, subtitle: destinationsCount > 0 ? `Across ${Math.max(1, destinationsCount)} location(s)` : '' },
    { title: 'Travel Buddies', value: travelBuddies, subtitle: travelBuddies > 0 ? `+${travelBuddies} members` : '' },
  ];

  const heroImage = '/mnt/data/11ac7f5c-e625-4d55-81af-0960ef23513f.png'; // uploaded image path

  const go = (path) => {
    if (!path) return;
    navigate(path);
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
        <div style={{ display: 'flex', gap: 24 }}>
          <main style={{ flex: 1 }}>
            {/* HERO */}
            <HeroBanner
              backgroundImage={heroImage}
              title="Welcome Back!"
              subtitle="Ready for your next adventure?"
            />

            {/* STATS */}
            <Row className="g-3 mb-4">
              {stats.map((s) => (
                <Col key={s.title} xs={12} md={6} lg={3}>
                  <StatCard {...s} icon={<div style={{ width: 40, height: 40, borderRadius: 8, background: '#eef2ff' }} />} />
                </Col>
              ))}
            </Row>

            {/* MAIN ROW */}
            <Row>
              <Col lg={8}>
                <Card className="shadow-sm mb-4">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="m-0 fw-bold" style={{ fontSize: 22 }}>Upcoming Trips</h5>
                      <div>
                        <Button variant="outline-primary" size="sm" onClick={openNewTripModal}>+ New Trip</Button>
                      </div>
                    </div>

                    <div id="trips-list">
                      {renderContent()}
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* UPDATED QUICK ACTIONS (modern blue/white design) */}
              <Col lg={4}>
                <Card className="shadow-sm mb-4">
                  <Card.Body style={{ background: '#fff' }}>
                    <h5 className="fw-bold" style={{ fontSize: 20, marginBottom: 12 }}>Quick Actions</h5>

                    {/* Connection / styled pill (keeps the appearance; replace with dynamic data later) */}
                    <div className="mb-3">
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#f1f6ff',
                        borderRadius: 10,
                        padding: '10px 12px',
                        border: '1px solid rgba(74,108,247,0.08)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: '#e6f5ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0b66ff',
                            fontWeight: 700
                          }}>✓</div>
                          <div style={{ fontSize: 14 }}>
                            <div style={{ fontWeight: 700, color: '#0b66ff' }}>Connected</div>
                            <div style={{ fontSize: 13, color: '#334155' }}>tatetaguch0@gmail.com</div>
                          </div>
                        </div>

                        <div>
                          <Button variant="outline-secondary" size="sm" onClick={() => window.alert('Disconnect clicked')}>
                            Disconnect
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Automated Scan - blue button, full width small */}
                    <div className="mb-3" style={{ padding: 12, background: '#fafcff', borderRadius: 8, border: '1px solid rgba(74,108,247,0.06)' }}>
                      <div style={{ fontWeight: 700, color: '#0b66ff', marginBottom: 6 }}>Automated Scan</div>
                      <div style={{ color: '#6b7280', marginBottom: 10 }}>Find all bookings from the last 30 days.</div>
                      <Button
                        onClick={handleScanLast30Days}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(90deg,#4A6CF7,#7BA5FF)',
                          border: 'none',
                          color: '#fff',
                          fontWeight: 600
                        }}
                        size="sm"
                      >
                        Scan Last 30 Days
                      </Button>
                    </div>

                    {/* Manual Search - input group with primary button */}
                    <div style={{ padding: 12, background: '#fff', borderRadius: 8, border: '1px solid rgba(13,27,62,0.04)' }}>
                      <div style={{ fontWeight: 700, color: '#0b66ff', marginBottom: 8 }}>Manual Search</div>
                      <Form onSubmit={(e) => { e.preventDefault(); handleManualSearch(); }}>
                        <InputGroup>
                          <Form.Control
                            type="text"
                            placeholder="e.g., from:united.com or Confirmation #12"
                            value={manualSearchQuery}
                            onChange={(e) => setManualSearchQuery(e.target.value)}
                            aria-label="Manual search"
                          />
                          <Button
                            type="submit"
                            style={{
                              background: '#0b66ff',
                              border: 'none',
                              color: '#fff',
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Search
                          </Button>
                        </InputGroup>
                        <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
                          Search bookings or confirmations manually.
                        </div>
                      </Form>
                    </div>

                    {/* Quick links */}
                    <div className="mt-3 d-flex flex-column align-items-stretch" style={{ gap: 8 }}>
                      <Button variant="link" onClick={() => window.alert('Add Event — wire to modal')} style={{ textAlign: 'left', paddingLeft: 0, fontWeight: 600, color: '#0b66ff' }}>
                        + Add Event
                      </Button>
                      <Button variant="link" onClick={() => go('/calendar')} style={{ textAlign: 'left', paddingLeft: 0, fontWeight: 600, color: '#0b66ff' }}>
                        View Calendar
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </main>
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
        deleteEvent={handleDeleteEvent}
      />
    </>
  );
}
