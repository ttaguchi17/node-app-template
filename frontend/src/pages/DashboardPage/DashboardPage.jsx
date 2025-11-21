// src/pages/DashboardPage/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Alert } from 'react-bootstrap';
import Layout from '../../components/Layout.jsx';
import NewTripModal from './components/NewTripModal.jsx';
import TripList from './components/TripList.jsx';
import TripDetailsModal from '../../components/TripDetailsModal.jsx';
import GmailConnector from '../../components/GmailConnector.jsx';


// 1. Import our new custom hook
import { useDashboard } from './useDashboard.js';

export default function DashboardPage() {
  
  // 2. Call the hook to get all state and logic
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

  // Note: useDashboard doesn't provide deleteEvent for modal-level event deletions.
  // We'll implement a local handler that knows the currently selected trip.

  const handleDeleteEvent = async (eventId) => {
    if (!selectedTrip) return false;
    const tripId = selectedTrip.trip_id ?? selectedTrip.id;
    if (!tripId) return false;
    const token = localStorage.getItem('token');
    const auth = token && token.toLowerCase().startsWith('bearer ') ? token : token ? `Bearer ${token}` : undefined;
    try {
      const res = await fetch(`/api/trips/${encodeURIComponent(tripId)}/events/${eventId}`, {
        method: 'DELETE',
        headers: auth ? { Authorization: auth } : undefined
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Delete failed (status ${res.status})`);
      }
      return true;
    } catch (err) {
      console.error('Dashboard deleteEvent error:', err);
      return false;
    }
  };
  // 3. Keep layout-specific state in the page component
  const [isSidebarToggled, setIsSidebarToggled] = useState(false);
  const toggleSidebar = () => setIsSidebarToggled(!isSidebarToggled);

  // 4. Keep layout-specific effects in the page component
  useEffect(() => {
    if (isSidebarToggled) document.body.classList.add('sidebar-toggled');
    else document.body.classList.remove('sidebar-toggled');
    return () => document.body.classList.remove('sidebar-toggled');
  }, [isSidebarToggled]);
  
  // 5. The render helper is now clean, just using state from the hook
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
    // Pass the openDetailsModal function to the TripList
    return <TripList trips={trips} onCardClick={openDetailsModal} onDeleteClick={deleteTrip} />;
  };

  // 6. The final JSX is just an assembler
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
          <GmailConnector />
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
        deleteEvent={handleDeleteEvent}
      />
    </>
  );
}