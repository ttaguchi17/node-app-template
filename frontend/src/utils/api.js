// src/utils/api.js
// Centralized API client for all backend requests

const API_BASE_URL = 'http://localhost:3000';

/**
 * Helper function to get the Authorization header
 */
export function getAuthHeader() {
  const token = localStorage.getItem('token');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/**
 * Generic fetch wrapper with error handling
 */
export async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle 401/403 - redirect to login
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * GET request
 */
export function apiGet(endpoint, options = {}) {
  return apiCall(endpoint, { method: 'GET', ...options });
}

/**
 * POST request
 */
export function apiPost(endpoint, body, options = {}) {
  return apiCall(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options
  });
}

/**
 * PUT request
 */
export function apiPut(endpoint, body, options = {}) {
  return apiCall(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
    ...options
  });
}

/**
 * DELETE request
 */
export function apiDelete(endpoint, options = {}) {
  return apiCall(endpoint, { method: 'DELETE', ...options });
}
