// ─── Toast Notification System ────────────────────────────────
// Lightweight toast system with auto-dismiss, progress bar,
// stacking, and slide animations.

const TOAST_DURATION = 4000;
const MAX_TOASTS = 5;

let toastContainer = null;

/** Ensure the toast container exists in the DOM */
function ensureContainer() {
  if (toastContainer && document.body.contains(toastContainer)) return;
  toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  toastContainer.id = 'toast-container';
  document.body.appendChild(toastContainer);
}

/** Icons for each toast type */
const TOAST_ICONS = {
  success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
  info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`
};

/**
 * Show a toast notification.
 * @param {string} message - The message to display
 * @param {'success'|'error'|'info'|'warning'} type - Toast type
 * @param {number} duration - Duration in ms (default 4000)
 */
export function showToast(message, type = 'info', duration = TOAST_DURATION) {
  ensureContainer();

  // Limit the number of visible toasts
  const existing = toastContainer.querySelectorAll('.toast');
  if (existing.length >= MAX_TOASTS) {
    dismissToast(existing[0]);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'alert');

  toast.innerHTML = `
    <div class="toast__icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</div>
    <div class="toast__message">${escapeHTML(message)}</div>
    <button class="toast__close" aria-label="Dismiss">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
    <div class="toast__progress" style="animation-duration: ${duration}ms"></div>
  `;

  // Close button handler
  toast.querySelector('.toast__close').addEventListener('click', () => dismissToast(toast));

  // Add to container
  toastContainer.appendChild(toast);

  // Auto-dismiss
  const timer = setTimeout(() => dismissToast(toast), duration);
  toast._timer = timer;
}

/** Dismiss a toast with exit animation */
function dismissToast(toast) {
  if (!toast || toast._dismissing) return;
  toast._dismissing = true;

  if (toast._timer) clearTimeout(toast._timer);

  toast.classList.add('toast--exiting');
  toast.addEventListener('animationend', () => {
    toast.remove();
  }, { once: true });

  // Fallback removal if animation doesn't fire
  setTimeout(() => toast.remove(), 400);
}

/** Escape HTML to prevent XSS */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
