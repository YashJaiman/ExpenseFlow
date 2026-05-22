// Environment-aware API configuration.
// Override with ?apiBase=<url> for quick runtime testing if needed.
const DEFAULT_DEV_API_BASE_URL = "http://localhost:5000/api/v1";
const DEFAULT_PROD_API_BASE_URL = "https://expenseflow-xivq.onrender.com/api/v1";

function detectApiBaseUrl() {
  const url = new URL(window.location.href);
  const apiBaseOverride = url.searchParams.get("apiBase");
  if (apiBaseOverride) {
    return apiBaseOverride.replace(/\/+$/, "");
  }

  const hostname = window.location.hostname;
  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1";

  if (isLocalhost) {
    return DEFAULT_DEV_API_BASE_URL;
  }

  return DEFAULT_PROD_API_BASE_URL;
}

export const API_BASE_URL = detectApiBaseUrl();
