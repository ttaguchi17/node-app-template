// public/js/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
  // 1) Auth guard
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/logon.html';
    return;
  }

  // 2) Helpers
  const statusClass = (s = '') => {
    const k = s.toLowerCase();
    if (k.includes('booked') || k.includes('confirmed')) return 'bg-success';
    if (k.includes('planning') || k.includes('draft')) return 'bg-info text-dark';
    if (k.includes('canceled') || k.includes('cancelled')) return 'bg-secondary';
    return 'bg-primary';
  };

  // Render one trip card
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

  // 3) Fetch + render
  async function fetchAndRenderTrips() {
    const tripsContainer = document.getElementById('trips-container');
    if (!tripsContainer) return;

    // Loading state
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

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/logon.html';
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const trips = await response.json();

      if (!Array.isArray(trips) || trips.length === 0) {
        tripsContainer.innerHTML = `
          <div class="col-12">
            <div class="alert alert-info mb-0">
              You have no trips yet. Click <em>New Trip</em> to create one.
            </div>
          </div>`;
        return;
      }

      tripsContainer.innerHTML = trips.map(tripCard).join('');
    } catch (err) {
      console.error('Failed to fetch trips:', err);
      tripsContainer.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger mb-0">
            Couldn’t load trips. Please try again.
          </div>
        </div>`;
    }
  }

  // 4) Buttons
  document.getElementById('logoutButton')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/logon.html';
  });

  document.getElementById('refreshButton')?.addEventListener('click', fetchAndRenderTrips);

  document.getElementById('newTripButton')?.addEventListener('click', () => {
    window.location.href = '/newtrip.html';
  });

  // 5) Initial load
  fetchAndRenderTrips();
});
