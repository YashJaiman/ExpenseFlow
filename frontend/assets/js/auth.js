// ─── Auth Helper Module ───────────────────────────────────────
// Manages authentication tokens, user data, and session helpers.
// All data is persisted in localStorage for client-side session management.

const TOKEN_KEY = "expenseflow_token";
const USER_KEY = "expenseflow_user";

/** Save the JWT token to localStorage */
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);

/** Retrieve the JWT token from localStorage */
export const getToken = () => localStorage.getItem(TOKEN_KEY);

/** Remove the JWT token from localStorage */
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/** Save user data (name, email) to localStorage */
export const setUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));

/** Retrieve parsed user data from localStorage */
export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

/** Remove user data from localStorage */
export const clearUser = () => localStorage.removeItem(USER_KEY);

/** Check if user is currently authenticated */
export const isAuthenticated = () => Boolean(getToken());

/** Get authorization headers for API requests */
export const getAuthHeaders = () => ({
  Authorization: `Bearer ${getToken()}`
});

/** Log out the user — clear all data and redirect to login page */
export const logout = () => {
  clearToken();
  clearUser();
  window.location.href = "./index.html";
};
