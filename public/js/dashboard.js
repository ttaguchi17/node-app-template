// public/js/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
  // 1) Auth guard: Checks if the user is logged in before running any code.
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/logon.html';
    return;
  }

  // 2) Helper Functions: Reusable blocks for building the UI.
  
  /**
   * Determines the Bootstrap background color for a trip's status badge.
   * @param {string} s The status text of the trip.
   * @returns {string} The corresponding CSS class for the badge color.
   */
  const statusClass = (s = '') => {
    const k = s.toLowerCase();
    if (k.includes('booked') || k.includes('confirmed')) return 'bg-success';
    if (k.includes('planning') || k.includes('draft')) return 'bg-info text-dark';
    if (k.includes('canceled') || k.includes('cancelled')) return 'bg-secondary';
    return 'bg-primary';
  };

  /**
   * Creates the HTML string for a single trip card.
   * @param {object} t The trip object from the API.
   * @returns {string} The HTML markup for the card.
   */
  const tripCard = (t) => `
    <div class="col-xl-4 col-md-6 mb-4">
      <div class="card border-left-primary shadow h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between">
            <div class="me-3">
              <div class="text-xs text-uppercase text-muted mb-1">${t.destination || 'Trip'}</div>
              <div class="h5 mb-1 text-gray-800">${t.title || 'Untitled Trip'}</div>
              <div class="small text-muted">${t.dates || ''}</div>
              ${t.notes ? `<div class="small mt-2">${t.notes}</div>` : ''}
            </div>
            <div class="text-end">
              <span class="badge ${statusClass(t.status)}">${t.status || 'Planned'}</span>
              <div class="mt-3">
                <i class="fas fa-suitcase-rolling fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  // 3) Main Function: Fetches trip data and renders it to the page.
  async function fetchAndRenderTrips() {
    const tripsContainer = document.getElementById('trips-container');
    if (!tripsContainer) return;

    // Display a loading spinner while waiting for the API response.
    tripsContainer.innerHTML = `
      <div class="col-12">
        <div class="d-flex align-items-center text-muted">
          <div class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
          <span>Loading trips…</span>
        </div>
      </div>`;

    try {
      const response = await fetch('/api/trips', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      // If the token is invalid or expired, log the user out.
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/logon.html';
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const trips = await response.json();

      // If there are no trips, display a helpful message.
      if (!Array.isArray(trips) || trips.length === 0) {
        tripsContainer.innerHTML = `
          <div class="col-12">
            <div class="alert alert-info mb-0">
              You have no trips yet. Click <em>New Trip</em> to create one.
            </div>
          </div>`;
        return;
      }

      // If trips are found, render them as cards.
      tripsContainer.innerHTML = trips.map(tripCard).join('');
    } catch (err) {
      console.error('Failed to fetch trips:', err);
      // Display a user-friendly error message if the API call fails.
      tripsContainer.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger mb-0">
            Couldn’t load trips. Please try again.
          </div>
        </div>`;
    }
  }

  // 4) Event Listeners: Attaches functions to the dashboard buttons.
  document.getElementById('logoutButton')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/logon.html';
  });

  document.getElementById('refreshButton')?.addEventListener('click', fetchAndRenderTrips);

  document.getElementById('newTripButton')?.addEventListener('click', () => {
    window.location.href = '/newtrip.html'; // Or whatever the correct page is.
  });

  // 5) Initial Load: Call the main function once to load data when the page opens.
  fetchAndRenderTrips();
});