// src/pages/DashboardPage/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Alert, Row, Col, Card, Button, Form, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import NewTripModal from './components/NewTripModal.jsx';
import TripList from './components/TripList.jsx';
import TripDetailsModal from '../../components/TripDetailsModal.jsx';
import { useDashboard } from './useDashboard.js';
// NOTE: GmailConnector import removed on purpose to avoid the old UI duplication
// import GmailConnector from '../../components/GmailConnector.jsx';

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

  const stats = [
    { title: 'Upcoming Trips', value: trips ? trips.length : 0, subtitle: '+2 this month' },
    { title: 'Total Events', value: 12, subtitle: '+5 this week' },
    { title: 'Destinations', value: 8, subtitle: 'Across 4 countries' },
    { title: 'Travel Buddies', value: 15, subtitle: '+3 new members' },
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

                {/* Recent activity remains unchanged */}
                <Card className="shadow-sm">
                  <Card.Body>
                    <h5 className="fw-bold" style={{ fontSize: 22 }}>Recent Activity</h5>
                    <div className="mt-3">
                      <div className="mb-2 p-2 border rounded bg-light">Added event — Flight to Istanbul (2 hours ago)</div>
                      <div className="mb-2 p-2 border rounded bg-light">Updated trip — Hotel booking confirmed (5 hours ago)</div>
                      <div className="mb-2 p-2 border rounded bg-light">Invited member — Sarah joined the trip (1 day ago)</div>
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
