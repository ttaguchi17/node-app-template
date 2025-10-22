// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import NewTripModal from '../components/NewTripModal.jsx';
import TripList from '../components/TripList.jsx'; 
import TripDetailsModal from '../components/TripDetailsModal.jsx'; // 1. ADD this import

function DashboardPage() {
  // Your existing state is perfect
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarToggled, setIsSidebarToggled] = useState(false);
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 2. ADD state for the details modal
  const [selectedTrip, setSelectedTrip] = useState(null); 

  const navigate = useNavigate();
  
  // --- Handlers ---
  // We'll rename these for clarity
  const openNewTripModal = () => setIsModalOpen(true);
  const closeNewTripModal = () => setIsModalOpen(false);
  const toggleSidebar = () => setIsSidebarToggled(!isSidebarToggled);

  // 3. ADD a handler to close the details modal
  const closeDetailsModal = () => setSelectedTrip(null);

  // --- Data Fetching Function (Your existing, correct function) ---
  const fetchTrips = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:3000/api/trips', {
        method: 'GET',
        headers: { 'Authorization': token }
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
      setTrips(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- useEffect for Body Class (Your existing, correct code) ---
  useEffect(() => {
    if (isSidebarToggled) document.body.classList.add('sidebar-toggled');
    else document.body.classList.remove('sidebar-toggled');
    return () => document.body.classList.remove('sidebar-toggled');
  }, [isSidebarToggled]);
  
  // --- useEffect to Fetch Initial Data (Your existing, correct code) ---
  useEffect(() => {
    fetchTrips();
  }, []); // Empty array means this runs once on mount

  // --- Handlers for Topbar (Your existing, correct code) ---
  const handleRefresh = () => fetchTrips();
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login'); // Use navigate
  };

  // --- Helper to render main content ---
  const renderContent = () => {
    if (isLoading) {
      return <p>Loading trips...</p>;
    }
    if (error) {
      return <Alert variant="danger">{error}</Alert>;
    }
    if (trips.length === 0) {
      return (
        <div className="col-12">
          <Alert variant="info">
            You have no trips yet. Click 
            {/* 4. UPDATE to use renamed handler */}
            <em onClick={openNewTripModal} style={{cursor: 'pointer', textDecoration: 'underline'}}> New Trip </em> 
            to create one.
          </Alert>
        </div>
      );
    }
    
    // 5. UPDATE to pass the 'onCardClick' prop to TripList
    return <TripList trips={trips} onCardClick={setSelectedTrip} />;
  };

  return (
    <>
      <Layout
        isSidebarToggled={isSidebarToggled}
        onToggleSidebar={toggleSidebar}
        onNewTripClick={openNewTripModal} // 6. UPDATE to use renamed handler
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

      {/* Your existing NewTripModal */}
      <NewTripModal 
        show={isModalOpen} 
        onClose={closeNewTripModal} // 7. UPDATE to use renamed handler
        onTripCreated={fetchTrips}
      />

      {/* 8. ADD the new TripDetailsModal component */}
      <TripDetailsModal 
        show={selectedTrip !== null} // Show if a trip is selected
        onClose={closeDetailsModal}  // Pass the close handler
        trip={selectedTrip}          // Pass the selected trip data
      />
    </>
  );
}

export default DashboardPage;