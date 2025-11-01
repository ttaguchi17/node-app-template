import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Badge } from 'react-bootstrap';
import Layout from '../components/Layout.jsx';

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

export default function TripDetailsPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [isNarrow, setIsNarrow] = useState(typeof window !== 'undefined' ? window.innerWidth < 980 : false);

  const [editingLocation, setEditingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [locationMessage, setLocationMessage] = useState('');

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 980);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (trip && trip.location) setLocationInput(trip.location);
    else setLocationInput('');
    setLocationMessage('');
    setEditingLocation(false);
  }, [trip]);

  const styles = {
    root: { background: '#f6f7f9', minHeight: 'calc(100vh - 0px)', paddingBottom: 40 },
    inner: { maxWidth: 1200, margin: '28px auto', padding: '0 24px' },
    welcome: { color: '#2f39c1', margin: '8px 0 18px', fontSize: 32, fontWeight: 700 },
    grid: isNarrow
      ? { display: 'grid', gridTemplateColumns: '1fr', gridTemplateAreas: `"tripinfo" "budget" "events" "map" "members"`, gap: 18 }
      : { display: 'grid', gridTemplateColumns: '1fr 360px', gridTemplateRows: 'auto auto 84px', gridTemplateAreas: `"tripinfo budget" "events map" "members map"`, gap: 18 },
    box: { background: '#ffffff', border: '6px solid #a7e7f0', padding: 18, borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
    boxTitle: { fontWeight: 700, margin: '0 0 12px', letterSpacing: 0.6, color: '#222', fontSize: 20 },
    twoCol: { display: 'flex', justifyContent: 'space-between', gap: 20 },
    metaLabel: { color: '#9aa0a6', fontSize: 13, marginTop: 8 },
    metaValue: { fontWeight: 600, marginBottom: 6, color: '#333' },
    eventRow: { background: '#efe9f9', padding: 10, marginBottom: 10, borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    mapPlaceholder: { flex: 1, borderRadius: 4, background: 'linear-gradient(180deg,#fff,#f3f6f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b6bbc0', fontWeight: 700, minHeight: 160 },
    membersInner: { border: '6px solid #a7e7f0', background: '#fff', borderRadius: 4, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    memberPill: { display: 'flex', gap: 8, alignItems: 'center', background: '#f7fafb', padding: '6px 10px', borderRadius: 6, border: '1px solid #eef2f4' },
    memberAvatar: { width: 34, height: 34, borderRadius: '50%', background: '#dfe9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#2b3aef' },
    btnAdd: { background: '#b9c9ff', borderRadius: 6, padding: '8px 12px', border: 'none' },
    btnAddPeople: { background: '#9fe07a', color: '#133', borderRadius: 6, padding: '8px 12px', border: 'none', fontWeight: 700 }
  };

  async function fetchEvents(serverTripId) {
    if (!serverTripId) return;
    const token = localStorage.getItem('token');
    const auth = buildAuthHeader(token);
    try {
      const res = await fetch(`/api/trips/${encodeURIComponent(serverTripId)}/events`, { headers: auth ? { Authorization: auth } : undefined });
      if (!res.ok) throw new Error(`Could not fetch events (status ${res.status})`);
      const body = await res.json();
      const list = Array.isArray(body) ? body : Array.isArray(body.events) ? body.events : [];
      setEvents(list);
      setFetchError(false);
    } catch (err) {
      console.warn('fetchEvents', err);
      setFetchError(true);
      setEvents([]);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setFetchError(false);
      setEvents([]);
      try {
        const token = localStorage.getItem('token');
        const auth = buildAuthHeader(token);
        const res = await fetch(`/api/trips/${encodeURIComponent(tripId)}`, { headers: auth ? { Authorization: auth } : undefined });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) { localStorage.removeItem('token'); navigate('/login'); return; }
          throw new Error(`Server returned ${res.status}`);
        }

        const json = await res.json();
        if (cancelled) return;
        const serverTrip = json.trip || json || {};

        // Normalize dates and location
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
          notes: serverTrip.notes ?? serverTrip.description ?? ''
        };

        setTrip(normalized);
        await fetchEvents(normalized.trip_id);
        setLoading(false);
        return;
      } catch (err) {
        console.info('Could not fetch trip from API, falling back to localPreview', err);
        setFetchError(true);
      }

      // fallback to local preview
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
        setEvents([]);
      } else if (!cancelled) {
        setTrip(null);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [tripId, navigate]);

  function tripLooksLikeServerId(t) {
    if (!t) return false;
    const id = String(t.trip_id ?? t.id ?? '');
    return /^\d+$/.test(id);
  }

  function goBack() {
    if (window.history.length > 1) navigate(-1);
    else navigate('/dashboard');
  }

  async function saveLocation() {
    if (!trip) return;
    setLocationMessage('');
    const loc = (locationInput || '').trim();
    if (!loc) {
      setLocationMessage('Location cannot be empty.');
      return;
    }

    const isPreview = !tripLooksLikeServerId(trip);
    if (isPreview) {
      // Save locally and update UI
      try {
        const saved = upsertLocalPreview(trip.id ?? trip.trip_id ?? tripId, { location: loc, updated_at: new Date().toISOString() });
        if (saved) {
          setTrip(prev => ({ ...prev, location: loc }));
          setEditingLocation(false);
          setLocationMessage('Saved locally (preview). Refresh Dashboard to see change.');
          try {
            window.dispatchEvent(new CustomEvent('trip-updated', { detail: { id: String(trip.id ?? trip.trip_id ?? tripId), location: loc } }));
          } catch (e) {}
          return;
        }
      } catch (e) {
        console.warn('Failed to save preview location', e);
        setLocationMessage('Failed to save locally.');
        return;
      }
    }

    // Server-backed trip: try a list of plausible endpoints + methods
    const id = encodeURIComponent(trip.trip_id ?? trip.id);
    const token = localStorage.getItem('token');
    const auth = buildAuthHeader(token);
    const baseHeaders = {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: auth } : {})
    };

    const tries = [
      { method: 'PATCH', url: `/api/trips/${id}`, body: () => ({ location: loc }) },
      { method: 'PUT',   url: `/api/trips/${id}`, body: () => ({ location: loc }) },
      { method: 'POST',  url: `/api/trips/${id}`, body: () => ({ location: loc }) },
      { method: 'POST',  url: `/api/trips/${id}/location`, body: () => ({ location: loc }) },
      { method: 'POST',  url: `/api/trips/${id}/destination`, body: () => ({ destination: loc }) },
      { method: 'PATCH', url: `/api/trips/${id}`, body: () => ({ destination: loc }) },
      { method: 'PUT',   url: `/api/trips/${id}`, body: () => ({ destination: loc }) }
    ];

    let lastErr = null;

    for (const attempt of tries) {
      try {
        console.log(`Trying ${attempt.method} ${attempt.url} ...`);
        const res = await fetch(attempt.url, {
          method: attempt.method,
          headers: baseHeaders,
          body: JSON.stringify(attempt.body())
        });

        if (res.ok) {
          let updated = null;
          try { updated = await res.json(); } catch (e) {}
          const newLoc = (updated && (updated.location ?? updated.destination ?? null)) ?? loc;
          setTrip(prev => ({ ...prev, location: newLoc }));
          setEditingLocation(false);
          setLocationMessage('Location saved.');
          console.log(`Success: ${attempt.method} ${attempt.url}`, updated);
          try {
            window.dispatchEvent(new CustomEvent('trip-updated', { detail: { id: String(trip.trip_id ?? trip.id ?? tripId), location: newLoc } }));
          } catch (e) {}
          return;
        }

        lastErr = `Update failed (status ${res.status}) for ${attempt.method} ${attempt.url}`;
        let bodyTxt = '';
        try {
          const b = await res.json();
          bodyTxt = b?.message ? `: ${b.message}` : (JSON.stringify(b).slice(0,200));
        } catch (e) {
          try { bodyTxt = await res.text(); } catch(e) {}
        }
        console.warn(lastErr, bodyTxt ? bodyTxt : '');
      } catch (err) {
        lastErr = `Network/error for ${attempt.method} ${attempt.url}: ${err.message || err}`;
        console.error(lastErr, err);
      }
    }

    // If none succeeded, save preview fallback
    try {
      const previewSaved = upsertLocalPreview(trip.trip_id ?? trip.id ?? tripId, { location: loc, updated_at: new Date().toISOString() });
      if (previewSaved) {
        setTrip(prev => ({ ...prev, location: loc }));
        setEditingLocation(false);
        setLocationMessage('Saved locally (no server update available). Refresh Dashboard to see change.');
        try {
          window.dispatchEvent(new CustomEvent('trip-updated', { detail: { id: String(trip.trip_id ?? trip.id ?? tripId), location: loc } }));
        } catch (e) {}
        console.warn('Server update not available — stored location as local preview');
        return;
      }
    } catch (e) {
      console.warn('Could not save local preview fallback', e);
    }

    setLocationMessage(lastErr || 'Failed to update location (unknown error).');
  }

  async function createTripOnServer() {
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
        ...(trip.location ? { location: trip.location } : {})
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
        notes: serverTrip.notes ?? serverTrip.description ?? trip.notes
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
      await fetchEvents(normalized.trip_id);
    } catch (err) {
      console.error('createTripOnServer error', err);
      setCreateError(err.message || 'Failed to create trip on server.');
      setIsCreating(false);
    }
  }

  const fmtDate = (s) => {
    if (!s) return '—';
    try {
      const d = new Date(s);
      if (!isNaN(d.getTime())) return d.toLocaleString();
      return String(s);
    } catch (e) { return String(s); }
  };

  return (
    <Layout>
      {loading && <div className="container-fluid p-3"><p className="text-muted">Loading trip...</p></div>}

      {!loading && !trip && <div className="container-fluid p-3"><Alert variant="warning">Could not find the trip details.</Alert><button className="btn btn-secondary" onClick={goBack}>Go Back</button></div>}

      {!loading && trip && (
        <div style={styles.root}>
          <div style={styles.inner}>
            <h1 style={styles.welcome}>Welcome to {trip.title || 'TripName'}</h1>

            <div style={styles.grid}>
              <div style={{ ...styles.box, gridArea: 'tripinfo' }}>
                <h3 style={styles.boxTitle}>TRIP DETAILS</h3>
                <div style={styles.twoCol}>
                  <div>
                    <div style={styles.metaLabel}>Trip Name</div>
                    <div style={styles.metaValue}>{trip.title}</div>

                    {/* Location with inline edit */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      <div style={{ color: '#9aa0a6', fontSize: 13 }}>Location</div>
                      <div>
                        {!editingLocation ? (
                          <button className="btn btn-sm btn-outline-primary" style={{ padding: '4px 8px' }} onClick={() => { setEditingLocation(true); setLocationMessage(''); }}>
                            Edit
                          </button>
                        ) : (
                          <>
                            <button className="btn btn-sm btn-success me-2" style={{ padding: '4px 8px' }} onClick={saveLocation}>Save</button>
                            <button className="btn btn-sm btn-outline-secondary" style={{ padding: '4px 8px' }} onClick={() => { setEditingLocation(false); setLocationInput(trip.location || ''); setLocationMessage(''); }}>
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div style={styles.metaValue}>
                      {!editingLocation ? (
                        trip.location || '—'
                      ) : (
                        <div>
                          <input
                            type="text"
                            className="form-control"
                            value={locationInput}
                            onChange={(e) => setLocationInput(e.target.value)}
                            placeholder="City, Country (e.g., Tokyo, Japan)"
                          />
                          {locationMessage && <div className="small mt-1" style={{ color: locationMessage.includes('Failed') ? '#c00' : '#0a0' }}>{locationMessage}</div>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div style={styles.metaLabel}>Start Date</div>
                    <div style={styles.metaValue}>{fmtDate(trip.start_date ?? trip.dates)}</div>

                    <div style={styles.metaLabel}>End Date</div>
                    <div style={styles.metaValue}>{fmtDate(trip.end_date)}</div>
                  </div>
                </div>
              </div>

              <div style={{ ...styles.box, gridArea: 'budget' }}>
                <h3 style={styles.boxTitle}>BUDGET</h3>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#444', marginBottom: 8 }}>£{trip.budget?.total ?? 0}</div>
                <div>{trip.budget?.recent?.slice(0,3)?.map((b,i) => <div key={i} style={{ fontSize: 14, color: '#666', marginBottom: 6 }}>{b.label} <span style={{ color: '#9aa0a6' }}>{b.amount}</span></div>) || <div style={{ color: '#9aa0a6' }}>No recent expenses</div>}</div>
              </div>

              <div style={{ ...styles.box, gridArea: 'events', display: 'flex', flexDirection: 'column' }}>
                <h3 style={styles.boxTitle}>EVENTS</h3>
                <div style={{ flex: 1 }}>
                  {fetchError && <Alert variant="danger">Could not load itinerary details.</Alert>}
                  {events.length ? events.map((ev,i) => (
                    <div key={ev.event_id ?? ev.id ?? `${ev.title}-${i}`} style={styles.eventRow}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#222' }}>{ev.title ?? ev.name ?? 'Untitled Event'}</div>
                        <div style={{ color: '#666', fontSize: 13 }}>{ev.start_time ? fmtDate(ev.start_time) : ev.time ?? ''}</div>
                        {ev.location && <div style={{ color: '#6b6f73', fontSize: 13, marginTop: 6 }}>{ev.location}</div>}
                        {ev.details && <div style={{ color: '#555', fontSize: 13, marginTop: 6 }}>{ev.details}</div>}
                      </div>
                      <Badge bg="info" pill style={{ marginLeft: 12 }}>{ev.type ?? 'Event'}</Badge>
                    </div>
                  )) : ( tripLooksLikeServerId(trip) ? <div style={{ color: '#9aa0a6', fontSize: 14 }}>(No events added yet.)</div> : <div style={{ color: '#9aa0a6', fontSize: 14 }}>Save the trip to add events.</div>)}
                </div>
                <div style={{ textAlign: 'right', marginTop: 12 }}><button style={styles.btnAdd}>+ Add Event</button></div>
              </div>

              <div style={{ ...styles.box, gridArea: 'map' }}>
                <h3 style={styles.boxTitle}>MAPS</h3>
                <div style={styles.mapPlaceholder}>[ map will go here ]</div>
              </div>

              <div style={{ gridArea: 'members' }}>
                <div style={styles.membersInner}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {(trip.members && trip.members.length) ? trip.members.map((m,idx) => (
                      <div key={idx} style={styles.memberPill}>
                        <div style={styles.memberAvatar}>{(m.name || 'U')[0]}</div>
                        <div style={{ fontWeight: 600, color: '#333' }}>{m.name || `Member ${idx+1}`}</div>
                      </div>
                    )) : <div style={{ color: '#9aa0a6' }}>No members yet</div>}
                  </div>
                  <button style={styles.btnAddPeople}>+ Add people</button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              {!tripLooksLikeServerId(trip) && (
                <div style={{ marginBottom: 16, padding: 12, borderRadius: 6, border: '1px solid #e9ecef', background: '#f8f9fa' }}>
                  <h5 style={{ margin: 0 }}>{trip.title || 'Unsaved Trip'}</h5>
                  <p style={{ margin: '6px 0 10px', color: '#6c757d', fontSize: 13 }}>This trip exists only in your browser (preview).</p>
                  {createError && <Alert variant="danger">{createError}</Alert>}
                  <button className="btn btn-primary me-2" onClick={createTripOnServer} disabled={isCreating}>{isCreating ? 'Saving...' : 'Save Trip to Server'}</button>
                  <button className="btn btn-outline-secondary" onClick={goBack}>Cancel</button>
                </div>
              )}
              <button className="btn btn-secondary" onClick={goBack}>Go Back</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
