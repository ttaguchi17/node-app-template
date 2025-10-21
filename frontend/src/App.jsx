// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx'; // 1. Import the 404 page

function App() {
  return (
    <Routes>
      {/* === Public Routes === */}
      {/* These routes are not guarded and can be seen by anyone. */}
      <Route path="/login" element={<LoginPage />} />
      {/* You can add a /register route here later */}
      {/* <Route path="/register" element={<RegisterPage />} /> */}

      {/* === Protected Routes === */}
      {/* This <Route> acts as the guard. Any <Route> nested inside
          it will be protected. */}
      <Route element={<ProtectedRoute />}>
        {/* If a user is logged in, they can access these: */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        {/* We can add more protected pages here, e.g.: */}
        {/* <Route path="/trip/:id" element={<TripDetailsPage />} /> */}
        {/* <Route path="/profile" element={<ProfilePage />} /> */}
      </Route>
      
      {/* === 404 Catch-all Route === */}
      {/* This must be the LAST route. It matches any URL 
          that wasn't matched by the routes above. */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;