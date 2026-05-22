// ─── Auth Page Controller ─────────────────────────────────────
// Handles login/register form switching, validation, API calls,
// and redirects. Uses existing api.js and auth.js modules.

import { loginUser, registerUser } from './api.js';
import { setToken, setUser, isAuthenticated } from './auth.js';
import { showToast } from './toast.js';
import { initTheme } from './theme.js';

// ── State ──
let currentTab = 'login';
let isLoading = false;

// ── DOM Ready ──
document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  // If already authenticated, redirect to dashboard
  if (isAuthenticated()) {
    window.location.href = './dashboard.html';
    return;
  }

  initTabs();
  initForms();
  initPasswordToggles();
});

// ═══════════════════════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════════════════════

function initTabs() {
  const loginTab = document.getElementById('tab-login');
  const registerTab = document.getElementById('tab-register');
  const indicator = document.querySelector('.auth-tabs__indicator');

  if (!loginTab || !registerTab) return;

  loginTab.addEventListener('click', () => switchTab('login'));
  registerTab.addEventListener('click', () => switchTab('register'));

  // Also wire up footer links
  const switchToRegister = document.getElementById('switch-to-register');
  const switchToLogin = document.getElementById('switch-to-login');

  if (switchToRegister) switchToRegister.addEventListener('click', (e) => { e.preventDefault(); switchTab('register'); });
  if (switchToLogin) switchToLogin.addEventListener('click', (e) => { e.preventDefault(); switchTab('login'); });
}

function switchTab(tab) {
  if (tab === currentTab || isLoading) return;
  currentTab = tab;

  // Update tab buttons
  document.querySelectorAll('.auth-tabs__btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  // Slide indicator
  const indicator = document.querySelector('.auth-tabs__indicator');
  if (indicator) {
    indicator.classList.toggle('register', tab === 'register');
  }

  // Toggle forms
  document.querySelectorAll('.auth-form').forEach(form => {
    form.classList.toggle('active', form.id === `${tab}-form`);
  });

  // Update header
  const title = document.querySelector('.auth-card__title');
  const subtitle = document.querySelector('.auth-card__subtitle');
  if (title) title.textContent = tab === 'login' ? 'Welcome back' : 'Create account';
  if (subtitle) subtitle.textContent = tab === 'login'
    ? 'Enter your credentials to access your dashboard'
    : 'Get started with your free account today';

  // Clear any existing errors
  clearFieldErrors();
}

// ═══════════════════════════════════════════════════════════════
// FORM HANDLING
// ═══════════════════════════════════════════════════════════════

function initForms() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (registerForm) registerForm.addEventListener('submit', handleRegister);
}

async function handleLogin(e) {
  e.preventDefault();
  if (isLoading) return;

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  // Validate
  clearFieldErrors();
  let valid = true;

  if (!email) {
    showFieldError('login-email', 'Email is required');
    valid = false;
  } else if (!isValidEmail(email)) {
    showFieldError('login-email', 'Please enter a valid email');
    valid = false;
  }

  if (!password) {
    showFieldError('login-password', 'Password is required');
    valid = false;
  }

  if (!valid) return;

  setLoading(true, 'login');

  try {
    const data = await loginUser(email, password);
    setToken(data.token);
    setUser({ _id: data._id, name: data.name, email: data.email });
    showToast('Welcome back! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = './dashboard.html';
    }, 600);
  } catch (err) {
    showToast(err.message || 'Login failed. Please try again.', 'error');
  } finally {
    setLoading(false, 'login');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  if (isLoading) return;

  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  // Validate
  clearFieldErrors();
  let valid = true;

  if (!name) {
    showFieldError('register-name', 'Name is required');
    valid = false;
  }

  if (!email) {
    showFieldError('register-email', 'Email is required');
    valid = false;
  } else if (!isValidEmail(email)) {
    showFieldError('register-email', 'Please enter a valid email');
    valid = false;
  }

  if (!password) {
    showFieldError('register-password', 'Password is required');
    valid = false;
  } else if (password.length < 6) {
    showFieldError('register-password', 'Password must be at least 6 characters');
    valid = false;
  }

  if (!valid) return;

  setLoading(true, 'register');

  try {
    const data = await registerUser(name, email, password);
    setToken(data.token);
    setUser({ _id: data._id, name: data.name, email: data.email });
    showToast('Account created successfully! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = './dashboard.html';
    }, 600);
  } catch (err) {
    showToast(err.message || 'Registration failed. Please try again.', 'error');
  } finally {
    setLoading(false, 'register');
  }
}

// ═══════════════════════════════════════════════════════════════
// PASSWORD TOGGLES
// ═══════════════════════════════════════════════════════════════

function initPasswordToggles() {
  document.querySelectorAll('.input-group__toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      // Update icon
      btn.innerHTML = isPassword
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function setLoading(loading, formType) {
  isLoading = loading;
  const btn = document.querySelector(`#${formType}-form .auth-btn`);
  if (!btn) return;

  const btnText = btn.querySelector('.auth-btn__text');
  const btnSpinner = btn.querySelector('.spinner');

  if (loading) {
    btn.disabled = true;
    if (btnText) btnText.textContent = formType === 'login' ? 'Signing in...' : 'Creating account...';
    if (btnSpinner) btnSpinner.style.display = 'inline-block';
  } else {
    btn.disabled = false;
    if (btnText) btnText.textContent = formType === 'login' ? 'Sign in' : 'Create account';
    if (btnSpinner) btnSpinner.style.display = 'none';
  }
}

function showFieldError(inputId, message) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const group = input.closest('.input-group');
  if (!group) return;

  // Remove existing error
  const existing = group.querySelector('.input-error');
  if (existing) existing.remove();

  input.style.borderColor = 'var(--red-400)';

  const errorEl = document.createElement('div');
  errorEl.className = 'input-error';
  errorEl.textContent = message;
  errorEl.style.cssText = `
    color: var(--red-400);
    font-size: var(--text-xs);
    margin-top: var(--space-1);
    animation: fadeIn 200ms ease;
  `;
  group.appendChild(errorEl);
}

function clearFieldErrors() {
  document.querySelectorAll('.input-error').forEach(el => el.remove());
  document.querySelectorAll('.input-group__field').forEach(input => {
    input.style.borderColor = '';
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
