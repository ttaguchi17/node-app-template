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

import AIAssistant from '../../components/AIAssistant.jsx';

export default function TripDetailsPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  // --- 1. SAFER USER PARSING (The Fix) ---
  const rawUser = localStorage.getItem('user');

  let user = null;
  try {
    // Check if it is valid JSON and not the string "undefined"
    if (rawUser && rawUser !== "undefined") {
      user = JSON.parse(rawUser);
    }
  } catch (e) {
    console.error("❌ Error parsing user JSON:", e);
    localStorage.removeItem('user'); // Clear bad data
  }
  // ---------------------------------------

  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [eventToEdit, setEventToEdit] = useState(null);

  const [aiPrefill, setAiPrefill] = useState(null);

  // 2. Call our custom hook
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
    deleteTrip, // We use the deleteTrip from the hook now
    deleteEvent,
    accessError // Assuming you added this in the previous step
  } = useTripDetails(tripId); 


  console.log("DEBUG TRIP ROLE:", trip?.my_role);

  
  const goBack = () => navigate(-1);
  const openEditModal = (event) => setEventToEdit(event);
  const closeEditModal = () => setEventToEdit(null);

  const handleEventUpdated = () => {
    fetchEvents(trip.trip_id);
  };

  const handleAIRecommendation = (rec) => {
    // Format the AI data to match what your Modal expects
    const prefillData = {
      title: rec.name,
      location: rec.location, // AI provides address/area
      type: rec.type === "Food" ? "Activity" : "Activity", // Map "Food" to "Activity" if needed
      description: rec.description
    };
    
    setAiPrefill(prefillData); // Set the data
    setShowAddModal(true);     // Open the modal
  };

  // Wrapper to close modal and clear AI data
  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setAiPrefill(null); // Clear the pre-fill so next time it's empty
    // Refresh events list to show newly added event
    if (trip?.trip_id) {
      fetchEvents(trip.trip_id);
    }
  };
  // Check if current user is the organizer (for the Delete Trip button)
  const isOrganizer = trip?.my_role === 'organizer' || trip?.my_role === 'owner';

  // 3. Render simple loading state
  if (loading) {
    return (
      <Layout>
        <div className="container-fluid p-3"><p className="text-muted">Loading trip...</p></div>
      </Layout>
    );
  }

  // 4. Render error state
  if (!trip) {
    return (
      <Layout>
        <div className="container-fluid p-3">
          {/* Show a helpful message if it's an access error */}
          {accessError ? (
            <Alert variant="info">
              <h4>Trip Access Restricted</h4>
              <p>You have been invited to this trip, but you haven't accepted the invitation yet.</p>
              <p>Please check your <strong>Notifications (Bell Icon)</strong> to accept.</p>
            </Alert>
          ) : (
            <Alert variant="warning">Could not find the trip details.</Alert>
          )}
          <Button variant="secondary" onClick={goBack}>Go Back</Button>
        </div>
      </Layout>
    );
  }

  // 5. Render the main page content
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
                <TripDetailsBox trip={trip} saveTripDetails={saveTripDetails} />
                
                <TripItineraryBox
                  events={events}
                  fetchError={false}
                  canAddEvents={tripLooksLikeServerId(trip)}
                  onAddEventClick={() => setShowAddModal(true)}
                  onEditEventClick={openEditModal}
                  deleteEvent={deleteEvent}
                  isOrganizer={isOrganizer}
 
                />
              </Col>
              <Col lg={4}>
                <TripBudgetBox trip={trip} />
                <TripMapBox trip={trip} events={events} />
                <TripMembersBox 
                  trip={trip} 
                  currentUser={user} // <-- Passing the safely parsed user
                />
                <div className="mt-4 mb-5" style={{ height: '500px' }}>
                    <AIAssistant 
                        tripLocation={trip.destination || "Unknown"} 
                        onAddEvent={handleAIRecommendation}
                    />
                </div>
              </Col>
            </Row>

            {/* Error message for delete failure */}
            {deleteError && <Alert variant="danger" className="mt-4">{deleteError}</Alert>}

            {/* Bottom Buttons */}
            <div className="d-flex justify-content-between mt-4">
              <Button variant="secondary" onClick={goBack}>Go Back</Button>
              
              {/* Only show Delete Trip if user is Organizer */}
              {isOrganizer && (
                <Button variant="danger" onClick={deleteTrip}>Delete Trip</Button>
              )}
            </div>
          </>
        )}
      </Container>

      {/* "Add Event" Modal */}
      <TripDetailsModal
  show={showAddModal}
  onClose={handleCloseAddModal}
  trip={trip}
  deleteEvent={deleteEvent} 
  initialData={aiPrefill}
  onEventAdded={() => {
    // Refresh events when a new one is added
    if (trip?.trip_id) {
      fetchEvents(trip.trip_id);
    }
  }}
/>

      {/* "Edit Event" Modal */}
      <EditEventModal
        show={!!eventToEdit}
        onClose={closeEditModal}
        tripId={trip?.trip_id}
        event={eventToEdit}
        onEventUpdated={handleEventUpdated}
        currentUserId={user?.user_id}
      />
    </Layout>
  );
}