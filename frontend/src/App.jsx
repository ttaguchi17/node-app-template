// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage/DashboardPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import TripDetailsPage from './pages/TripDetailsPage/TripDetailsPage.jsx';
import CalendarPage from './pages/Calendar/CalendarPage.jsx'; // match exact filename/casing
import BudgetPage from './pages/BudgetPage/BudgetPage.jsx';
import GlobalBudgetPage from './pages/BudgetPage/GlobalBudgetPage.jsx';

function App() {
  return (
    <>
      <Routes>
        {/* === Public Routes === */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* === Protected Routes (requires auth) === */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/trips/:tripId" element={<TripDetailsPage />} />
         <Route path="/trips/:tripId/budget" element={<BudgetPage />} />
        <Route path="/budget" element={<GlobalBudgetPage />} />
        </Route>

        {/* === 404 Catch-all Route === */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
