// src/pages/TripDetailsPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Container, Row, Col, Button } from 'react-bootstrap';
import Layout from '../../components/Layout.jsx';
import TripDetailsModal from '../../components/TripDetailsModal.jsx'; 

// Import our new Hook and Components
import { useTripDetails } from './useTripDetails.js';
import TripLocalPreview from './components/TripLocalPreview.jsx';
import TripDetailsBox from './components/TripDetailsBox.jsx';
import TripItineraryBox from './components/TripItineraryBox.jsx';
import TripBudgetBox from './components/TripBudgetBox.jsx';
import TripMapBox from '../../components/MapBox.jsx';
import TripMembersBox from './components/TripMembersBox.jsx';
import EditEventModal from './components/EditEventModal.jsx';

export default function TripDetailsPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [eventToEdit, setEventToEdit] = useState(null);

  // 1. Call our custom hook to get all logic and state
  const {
    trip,
    events,
    loading,
    isCreating,
    createError,
    tripLooksLikeServerId,
    createTripOnServer,
    saveTripDetails,
    fetchEvents,
    deleteTrip,
    deleteEvent
  } = useTripDetails(tripId); // NOTE: This assumes 'useTripDetails.js' is in 'src/hooks/'

  const goBack = () => navigate(-1);
  const openEditModal = (event) => setEventToEdit(event);
  const closeEditModal = () => setEventToEdit(null);

  const handleEventUpdated = () => {
    // Just refresh the event list
    fetchEvents(trip.trip_id);
  };

  // Delete handler for the trip
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this trip and all its data? This cannot be undone.')) return;
    setDeleteError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const auth = token.toLowerCase().startsWith('bearer ') ? token : `Bearer ${token}`;
      const id = encodeURIComponent(trip.trip_id ?? trip.id ?? tripId);
      const res = await fetch(`/api/trips/${id}`, { method: 'DELETE', headers: { Authorization: auth } });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Delete failed (status ${res.status})`);
      }
      // On success, navigate back to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Delete trip error', err);
      setDeleteError(err.message || 'Failed to delete trip.');
    }
  };

  // 2. Render simple loading state
  if (loading) {
    return (
      <Layout>
        <div className="container-fluid p-3"><p className="text-muted">Loading trip...</p></div>
      </Layout>
    );
  }

  // 3. Render error state
  if (!trip) {
    return (
      <Layout>
        <div className="container-fluid p-3">
          <Alert variant="warning">Could not find the trip details.</Alert>
          <Button variant="secondary" onClick={goBack}>Go Back</Button>
        </div>
      </Layout>
    );
  }

  // 4. Render the main page content
 return (
    <Layout>
      <Container fluid>
        <h1 className="h3 mb-4 text-gray-800">Welcome to {trip.title || 'Your Trip'}</h1>

        {/* Show the "Save" card if it's a local preview */}
        {!tripLooksLikeServerId(trip) && (
          <TripLocalPreview
            trip={trip}
            createTripOnServer={createTripOnServer}
            isCreating={isCreating}
            createError={createError}
          />
        )}

        {/* Show the main details if it's a saved trip */}
        {tripLooksLikeServerId(trip) && (
          <>
            <Row>
              <Col lg={8}>
                {/* === USE OUR NEW COMPONENTS === */}
                <TripDetailsBox trip={trip} saveTripDetails={saveTripDetails} />
                <TripItineraryBox
                  events={events}
                  fetchError={false} // You can pass fetchError here
                  canAddEvents={tripLooksLikeServerId(trip)}
                  onAddEventClick={() => setShowAddModal(true)}
                  onEditEventClick={openEditModal} // Pass edit handler
                  deleteEvent={deleteEvent} // Pass delete handler
                />
              </Col>
              <Col lg={4}>
                <TripBudgetBox trip={trip} />
                <TripMapBox trip={trip} events={events} />
                <TripMembersBox trip={trip} />
              </Col>
            </Row>

            {/* Error message for delete failure */}
            {deleteError && <Alert variant="danger" className="mt-4">{deleteError}</Alert>}

            {/* Bottom Buttons */}
            <div className="d-flex justify-content-between mt-4">
              <Button variant="secondary" onClick={goBack}>Go Back</Button>
              <Button variant="danger" onClick={handleDelete}>Delete Trip</Button>
            </div>
          </>
        )}
      </Container>

      {/* "Add Event" Modal (existing) */}
      <TripDetailsModal
        show={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          fetchEvents(trip.trip_id); 
        }}
        trip={trip}
        deleteEvent={deleteEvent} 
      />

      <EditEventModal
        show={!!eventToEdit}
        onClose={closeEditModal}
        tripId={trip?.trip_id}
        event={eventToEdit}
        onEventUpdated={handleEventUpdated}
      />
    </Layout>
  );
}