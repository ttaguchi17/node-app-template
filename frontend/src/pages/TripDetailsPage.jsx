// src/pages/TripDetailsPage.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom'; // Import hooks
import Layout from '../components/Layout.jsx';

function TripDetailsPage() {
  // 'useParams' reads the dynamic part of the URL (the :tripId)
  const { tripId } = useParams();

  // TODO: Add useEffect hook here to fetch data for this tripId
  // from '/api/trips/:tripId/events'

  return (
    <Layout>
      {/* Page Heading */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Trip Details</h1>
        <Link to="/" className="btn btn-sm btn-primary shadow-sm">
          <i className="fas fa-arrow-left fa-sm text-white-50"></i> Back to Dashboard
        </Link>
      </div>

      <div className="row">
        <div className="col-12">
          {/* We'll show the itinerary, budget, etc. here */}
          <h2>Events for Trip ID: {tripId}</h2>
          <p>The itinerary for this trip will be displayed here.</p>
        </div>
      </div>
    </Layout>
  );
}

export default TripDetailsPage;