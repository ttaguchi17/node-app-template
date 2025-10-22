// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Alert } from 'react-bootstrap';
import Layout from '../components/Layout.jsx';
import NewTripModal from '../components/NewTripModal.jsx';
import { useNavigate } from 'react-router-dom';
// We'll create this component next
// import TripList from '../components/TripList.jsx'; 

function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarToggled, setIsSidebarToggled] = useState(false);
  
  // State for holding trips and loading status
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  
  // --- Handlers ---
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const toggleSidebar = () => setIsSidebarToggled(!isSidebarToggled);

  // --- Data Fetching Function ---
  const fetchTrips = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:3000/api/trips', {
        method: 'GET',
        headers: {
          'Authorization': token
        }
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token'); // Log the user out
        navigate('/login'); // Redirect to login
        return; // Stop executing this function
      }

      if (!response.ok) {
        throw new Error('Failed to fetch trips. Are you logged in?');
      }

      const data = await response.json();
      setTrips(data); // Set the trips state with data from the API
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- UseEffect for Body Class ---
  useEffect(() => {
    if (isSidebarToggled) document.body.classList.add('sidebar-toggled');
    else document.body.classList.remove('sidebar-toggled');
    return () => document.body.classList.remove('sidebar-toggled');
  }, [isSidebarToggled]);
  
  // --- UseEffect to Fetch Initial Data ---
  useEffect(() => {
    fetchTrips(); // Fetch trips when the page first loads
  }, []); // Empty array means this runs once on mount

  // --- Handlers for Topbar ---
  const handleRefresh = () => fetchTrips(); // Re-use our fetch function
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login'; 
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
            <em onClick={openModal} style={{cursor: 'pointer', textDecoration: 'underline'}}> New Trip </em> 
            to create one.
          </Alert>
        </div>
      );
    }
    
    // TODO: We will replace this with <TripList trips={trips} />
    return (
      <div className="col-12">
        <h3>Your Trips (Raw Data):</h3>
        <pre>{JSON.stringify(trips, null, 2)}</pre>
      </div>
    );
  };

  return (
    <>
      <Layout
        isSidebarToggled={isSidebarToggled}
        onToggleSidebar={toggleSidebar}
        onNewTripClick={openModal}
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
        onClose={closeModal} 
        onTripCreated={fetchTrips} // Pass the fetchTrips function
      />
    </>
  );
}

export default DashboardPage;