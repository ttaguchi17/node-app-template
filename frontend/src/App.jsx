// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import LoginPage from './pages/LoginPage/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage/DashboardPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import TripDetailsPage from './pages/TripDetailsPage/TripDetailsPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import SupportPage from './pages/SupportPage.jsx'; // <- support page (create if you haven't)

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes — pages themselves render Layout (and Sidebar) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/trips/:tripId" element={<TripDetailsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/support" element={<SupportPage />} />
        {/* add other protected pages here */}
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
