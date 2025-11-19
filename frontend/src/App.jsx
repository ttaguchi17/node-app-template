// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage/DashboardPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import TripDetailsPage from './pages/TripDetailsPage/TripDetailsPage.jsx';

function App() {
    return (
    <>
      {/* Keep your Toast component here */}
      {/* ... */}

      <Routes>
        {/* === Public Routes === */}
        <Route path="/" element={<LandingPage />} /> 
        <Route path="/login" element={<LoginPage />} />

        {/* === Protected Routes === */}
        <Route element={<ProtectedRoute />}>
          {/* Dashboard is now explicitly at /dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/trips/:tripId" element={<TripDetailsPage />} />
        </Route>

        {/* === 404 Catch-all Route === */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;