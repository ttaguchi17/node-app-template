// public/js/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
  // 1) Auth guard
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/logon.html';
    return;
  }

  // 2) Helper functions
  const statusClass = (s = '') => {
    const k = s.toLowerCase();
    if (k.includes('booked') || k.includes('confirmed')) return 'bg-success';
    if (k.includes('planning') || k.includes('draft')) return 'bg-info text-dark';
    if (k.includes('canceled') || k.includes('cancelled')) return 'bg-secondary';
    return 'bg-primary';
  };

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

  // 3) Fetch trips from API
  async function fetchAndRenderTrips() {
    const tripsContainer = document.getElementById('trips-container');
    if (!tripsContainer) return;

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

  // 4) Event Listeners
  document.getElementById('logoutButton')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/logon.html';
  });

  document.getElementById('refreshButton')?.addEventListener('click', fetchAndRenderTrips);

  document.getElementById('newTripButton')?.addEventListener('click', () => {
    window.location.href = '/newtrip.html';
  });

  // --- Quick Add (inline) ---
  const quickAddBtn = document.getElementById('quickAddBtn');
  const quickAddForm = document.getElementById('quickAddForm');
  const qTripName = document.getElementById('qTripName');
  const qTripDate = document.getElementById('qTripDate');
  const qSubmit = document.getElementById('qSubmit');
  const qCancel = document.getElementById('qCancel');
  const previewGrid = document.getElementById('previewGrid');
  const tripsContainer = document.getElementById('trips-container');

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }

  function createPreviewCard({ id, title, dates }) {
    const a = document.createElement('a');
    a.href = `newtrip.html`; // can change to `/trip/${id}` later
    a.className = 'preview-card';
    a.innerHTML = `
      <div><div class="pc-title">${escapeHtml(title)}</div></div>
      <div class="pc-footer">
        <div class="pc-date">${escapeHtml(dates || '')}</div>
        <div class="pc-chip">Preview</div>
      </div>`;
    return a;
  }

  function createDashboardCardElement(trip) {
    const wrapper = document.createElement('div');
    wrapper.className = 'col-xl-4 col-md-6 mb-4';
    wrapper.innerHTML = tripCard(trip);
    return wrapper;
  }

  if (quickAddBtn && quickAddForm) {
    quickAddBtn.addEventListener('click', () => {
      quickAddForm.style.display = quickAddForm.style.display === 'block' ? 'none' : 'block';
      qTripName?.focus();
    });
    qCancel?.addEventListener('click', () => { quickAddForm.style.display = 'none'; });

    qSubmit?.addEventListener('click', (ev) => {
      ev.preventDefault();
      const name = qTripName.value.trim();
      const date = qTripDate.value;
      if (!name) { qTripName.focus(); return alert('Please enter a trip name'); }

      const id = Date.now().toString(36);
      const tripObj = { id, title: name, destination: name, dates: date, status: 'Planned' };

      // add preview card
      if (previewGrid) previewGrid.prepend(createPreviewCard(tripObj));
      // add dashboard card
      if (tripsContainer) tripsContainer.prepend(createDashboardCardElement(tripObj));

      // persist preview locally for next visit
      savePreviewToLocalStorage(tripObj);

      qTripName.value = '';
      qTripDate.value = '';
      quickAddForm.style.display = 'none';
    });
  }

  // --- Load saved previews from localStorage (from newtrip.html submissions) ---
  function savePreviewToLocalStorage(trip) {
    try {
      const key = 'tripPreviews';
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      const filtered = arr.filter(t => t.id !== trip.id);
      filtered.unshift(trip);
      localStorage.setItem(key, JSON.stringify(filtered.slice(0, 50)));
    } catch (e) {
      console.warn('Could not save preview to localStorage', e);
    }
  }

  function loadSavedPreviews() {
    try {
      const raw = localStorage.getItem('tripPreviews');
      if (!raw) return;
      const previews = JSON.parse(raw);
      if (!Array.isArray(previews) || previews.length === 0) return;

      const previewGrid = document.getElementById('previewGrid');
      const tripsContainer = document.getElementById('trips-container');

      previews.forEach(p => {
        // create preview cards
        if (previewGrid) previewGrid.prepend(createPreviewCard(p));
        // create full dashboard cards
        if (tripsContainer) {
          const cardEl = createDashboardCardElement({
            title: p.title,
            destination: p.title,
            dates: p.dates,
            status: 'Planned'
          });
          tripsContainer.prepend(cardEl);
        }
      });
    } catch (e) {
      console.warn('Failed to load saved previews', e);
    }
  }

  // 5) Initial Load
  fetchAndRenderTrips();
  loadSavedPreviews();
});
