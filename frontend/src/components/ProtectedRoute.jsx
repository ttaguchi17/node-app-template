// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute() {
  // 1. Check for the authentication token
  const token = localStorage.getItem('token');

  // 2. Check if the token exists
  const isAuthenticated = token ? true : false;

  // 3. Return the page or redirect
  if (isAuthenticated) {
    // If logged in, show the child component (e.g., DashboardPage)
    return <Outlet />; 
  } else {
    // If not logged in, redirect to the /login page
    return <Navigate to="/login" replace />;
  }
}

export default ProtectedRoute;