// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx'; 
import TripDetailsPage from './pages/TripDetailsPage.jsx';

function App() {
  return (
    <Routes>
      {/* === Public Routes === */}
      <Route path="/login" element={<LoginPage />} />
      

      {/* === Protected Routes === */}
      <Route element={<ProtectedRoute />}>
        {/* If a user is logged in, they can access these: */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/trips/:tripId" element={<TripDetailsPage />} />
        </Route>
      
      {/* === 404 Catch-all Route === */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;