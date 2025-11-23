// src/pages/DashboardPage/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Alert, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import NewTripModal from './components/NewTripModal.jsx';
import TripList from './components/TripList.jsx';
import TripDetailsModal from '../../components/TripDetailsModal.jsx';
import GmailConnector from '../../components/GmailConnector.jsx';
import { useDashboard } from './useDashboard.js';

import voyagoLogo from '../../assets/voyagologo.png';

function StatCard({ title, value, subtitle, icon }) {
  return (
    <Card className="shadow-sm rounded-lg h-100">
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="text-muted" style={{ fontSize: 14 }}>{title}</div>
          </div>
          <div style={{ width: 48, height: 48 }}>
            {icon}
          </div>
        </div>
        <div className="mt-3 flex-grow-1">
          <div style={{ fontSize: 34, fontWeight: 600 }}>{value}</div>
          {subtitle && <div className="text-muted" style={{ fontSize: 13 }}>{subtitle}</div>}
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
    padding: '36px 28px',
    boxShadow: '0 8px 30px rgba(18,22,70,0.08)',
  };
  return (
    <div style={style} className="mb-4">
      <h1 style={{ fontSize: 44, margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ opacity: 0.95, marginTop: 8 }}>{subtitle}</p>}
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
      await apiDelete(`/api/trips/${encodeURIComponent(tripId)}/events/${eventId}`);
      return true;
    } catch (err) {
      console.error('Dashboard deleteEvent error:', err);
      return false;
    }
  };

  // keep sidebar toggle support in case Layout uses it
  const [isSidebarToggled, setIsSidebarToggled] = useState(false);
  const toggleSidebar = () => setIsSidebarToggled(!isSidebarToggled);
  useEffect(() => {
    if (isSidebarToggled) document.body.classList.add('sidebar-toggled');
    else document.body.classList.remove('sidebar-toggled');
    return () => document.body.classList.remove('sidebar-toggled');
  }, [isSidebarToggled]);

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

  const heroImage = '/mnt/data/a3261ea1-79f6-4fa6-a6b9-c5ba45b04cfd.png';

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
        {/* Main content */}
        <div style={{ display: 'flex', gap: 24 }}>
          <main style={{ flex: 1 }}>
            {/* Top toolbar: only shows GmailConnector on the right now */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <img src={voyagoLogo} alt="Voyago" style={{ width: 52, height: 52, borderRadius: 8 }} />
                <div>
                  <h1 className="h3 mb-0 text-gray-800">Dashboard</h1>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>Welcome — here's your summary</div>
                </div>
              </div>

              {/* Top-right: only GmailConnector (no Refresh / New Trip here) */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <GmailConnector />
              </div>
            </div>

            <HeroBanner
              backgroundImage={heroImage}
              title="Welcome Back!"
              subtitle="Ready for your next adventure?"
            />

            <Row className="g-3 mb-4">
              {stats.map((s) => (
                <Col key={s.title} xs={12} md={6} lg={3}>
                  <StatCard {...s} icon={<div style={{ width: 40, height: 40, borderRadius: 8, background: '#eef2ff' }} />} />
                </Col>
              ))}
            </Row>

            <Row>
              <Col lg={8}>
                <Card className="shadow-sm mb-4">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="m-0">Upcoming Trips</h5>
                      <div>
                        {/* keep New Trip here (inside content) */}
                        <Button variant="outline-primary" size="sm" onClick={openNewTripModal}>+ New Trip</Button>
                      </div>
                    </div>

                    <div id="trips-list">
                      {renderContent()}
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={4}>
                <Card className="shadow-sm mb-4">
                  <Card.Body>
                    <h6>Quick Actions</h6>
                    <div className="d-flex flex-column gap-2 mt-3">
                      <Button onClick={() => window.alert('Add Event — wire to modal')} variant="outline-primary">+ Add Event</Button>
                      <Button onClick={() => go('/calendar')} variant="outline-secondary">View Calendar</Button>
                    </div>
                  </Card.Body>
                </Card>

                <Card className="shadow-sm">
                  <Card.Body>
                    <h6>Recent Activity</h6>
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
