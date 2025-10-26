// public/js/logon.js

// --- 1. Element Selectors & Helper Functions ---
const loginTab = document.getElementById('login-tab');
const createAccountTab = document.getElementById('create-account-tab');
const logonForm = document.getElementById('logon-form');
const createAccountForm = document.getElementById('create-account-form');
const messageEl = document.getElementById('message');

/**
 * A helper function to display success or error messages to the user.
 * @param {string} text - The message to display.
 * @param {boolean} ok - True for a success message, false for an error.
 */
function setMessage(text, ok = false) {
  if (!messageEl) return;
  messageEl.textContent = text || '';
  messageEl.classList.toggle('error', !ok && !!text);
  messageEl.classList.toggle('success', ok && !!text);
}

/** Switches the view to the login form. */
function showLogin() {
  logonForm.classList.add('active-form');
  createAccountForm.classList.remove('active-form');
  loginTab.classList.add('active');
  createAccountTab.classList.remove('active');
  setMessage('');
}

/** Switches the view to the create account form. */
function showCreate() {
  createAccountForm.classList.add('active-form');
  logonForm.classList.remove('active-form');
  createAccountTab.classList.add('active');
  loginTab.classList.remove('active');
  setMessage('');
}

// --- 2. Initial Auth Check ---
// If a token already exists, redirect to the dashboard immediately.
const existingToken = localStorage.getItem('token');
if (existingToken) {
  window.location.href = '/dashboard';
}

// --- 3. Event Listeners ---
// Tab switching functionality
loginTab.addEventListener('click', showLogin);
createAccountTab.addEventListener('click', showCreate);

// Logon form submission handler
logonForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    setMessage('Logging in…');
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    // Safely parse the JSON response.
    const result = await response.json().catch(() => ({}));

    if (response.ok && result.token) {
      // On success, save the token and redirect.
      localStorage.setItem('token', result.token);
      window.location.href = '/dashboard';
      return;
    }

    // On failure, show the server's error message or a generic one.
    setMessage(result.message || `Login failed (HTTP ${response.status}).`);
  } catch (err) {
    console.error('Login error:', err);
    setMessage('An error occurred. Please try again later.');
  }
});

// Create account form submission handler
createAccountForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('create-email').value.trim();
  const password = document.getElementById('create-password').value;

  try {
    setMessage('Creating account…');
    const response = await fetch('/api/create-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      setMessage('Account created! Please log in.', true);
      // For a better user experience, prefill the login form.
      document.getElementById('login-email').value = email;
      document.getElementById('login-password').value = password;
      showLogin(); // Automatically switch to the login tab.
      return;
    }

    setMessage(result.message || `Create account failed (HTTP ${response.status}).`);
  } catch (err) {
    console.error('Create account error:', err);
    setMessage('An error occurred. Please try again later.');
  }
});