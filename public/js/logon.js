// public/js/logon.js

// --- helpers ---
const loginTab = document.getElementById('login-tab');
const createAccountTab = document.getElementById('create-account-tab');
const logonForm = document.getElementById('logon-form');
const createAccountForm = document.getElementById('create-account-form');
const messageEl = document.getElementById('message');

function setMessage(text, ok = false) {
  if (!messageEl) return;
  messageEl.textContent = text || '';
  messageEl.classList.toggle('error', !ok && !!text);
  messageEl.classList.toggle('success', ok && !!text);
}

function showLogin() {
  logonForm.classList.add('active-form');
  createAccountForm.classList.remove('active-form');
  loginTab.classList.add('active');
  createAccountTab.classList.remove('active');
  setMessage('');
}

function showCreate() {
  createAccountForm.classList.add('active-form');
  logonForm.classList.remove('active-form');
  createAccountTab.classList.add('active');
  loginTab.classList.remove('active');
  setMessage('');
}

// --- initial: if already logged in, go to dashboard ---
const existing = localStorage.getItem('token');
if (existing) window.location.href = '/dashboard';

// --- tab switching ---
loginTab.addEventListener('click', showLogin);
createAccountTab.addEventListener('click', showCreate);

// --- logon submit ---
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

    // Always attempt to parse JSON; fall back to empty object
    const result = await response.json().catch(() => ({}));

    if (response.ok && result.token) {
      // ✅ store under "token" (matches dashboard.js)
      localStorage.setItem('token', result.token);
      window.location.href = '/dashboard';
      return;
    }

    // show server message or generic error
    setMessage(result.message || `Login failed (HTTP ${response.status}).`);
  } catch (err) {
    console.error('Login error:', err);
    setMessage('An error occurred. Please try again later.');
  }
});

// --- create account submit ---
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
      // Prefill login form for convenience
      document.getElementById('login-email').value = email;
      document.getElementById('login-password').value = password;
      showLogin();
      return;
    }

    setMessage(result.message || `Create account failed (HTTP ${response.status}).`);
  } catch (err) {
    console.error('Create account error:', err);
    setMessage('An error occurred. Please try again later.');
  }
});
