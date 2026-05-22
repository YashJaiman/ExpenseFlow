// ─── API Client Module ────────────────────────────────────────
// Centralized API communication layer for ExpenseFlow.
// All requests go through apiClient() which auto-attaches
// Content-Type and Authorization headers.

import { API_BASE_URL } from "./config.js";
import { getAuthHeaders, isAuthenticated } from "./auth.js";

/**
 * Core API client — wraps fetch with auth headers and error handling.
 * @param {string} endpoint - API endpoint path (e.g. "/auth/login")
 * @param {object} options  - Fetch options (method, body, etc.)
 * @returns {Promise<any>}  - Parsed JSON response
 */
async function apiClient(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Attach auth token if the user is authenticated
  if (isAuthenticated()) {
    Object.assign(headers, getAuthHeaders());
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Parse response body
  const data = await response.json().catch(() => null);

  // If the request was not successful, throw an error with the server's message
  if (!response.ok) {
    const message = (data && (data.message || data.error)) || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}


/* ═══════════════════════════════════════════════════════════════
   AUTH ENDPOINTS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Log in an existing user.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{_id, name, email, token}>}
 */
export async function loginUser(email, password) {
  return apiClient("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Register a new user.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{_id, name, email, token}>}
 */
export async function registerUser(name, email, password) {
  return apiClient("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

/**
 * Fetch the current user's profile.
 * @returns {Promise<{_id, name, email}>}
 */
export async function fetchProfile() {
  return apiClient("/auth/me");
}


/* ═══════════════════════════════════════════════════════════════
   EXPENSE ENDPOINTS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Fetch all expenses for the authenticated user.
 * @returns {Promise<Array>}
 */
export async function fetchExpenses() {
  return apiClient("/expenses");
}

/**
 * Create a new expense/income entry.
 * @param {object} data - { amount, category, description, date, type, notes }
 * @returns {Promise<object>}
 */
export async function createExpense(data) {
  return apiClient("/expenses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing expense/income entry.
 * @param {string} id   - Expense ID
 * @param {object} data - Updated fields
 * @returns {Promise<object>}
 */
export async function updateExpense(id, data) {
  return apiClient(`/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete an expense/income entry.
 * @param {string} id - Expense ID
 * @returns {Promise<object>}
 */
export async function deleteExpense(id) {
  return apiClient(`/expenses/${id}`, {
    method: "DELETE",
  });
}
