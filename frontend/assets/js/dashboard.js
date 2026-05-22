// ─── Dashboard Controller ─────────────────────────────────────
// Master controller for the ExpenseFlow dashboard.
// Handles: auth guard, navigation, data loading, summary cards,
// transactions CRUD, search/filter/sort, CSV export, modals.

import { fetchExpenses, fetchProfile, createExpense, updateExpense, deleteExpense } from './api.js';
import { isAuthenticated, getUser, logout } from './auth.js';
import { showToast } from './toast.js';
import { initTheme, toggleTheme, getTheme } from './theme.js';
import { initCharts, updateCharts, destroyCharts } from './charts.js';

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let expenses = [];
let filteredExpenses = [];
let currentSection = 'overview';
let editingId = null;
let deletingId = null;

// Category config
const CATEGORIES = {
  'Food':          { emoji: '🍔', class: 'food' },
  'Transport':     { emoji: '🚗', class: 'transport' },
  'Shopping':      { emoji: '🛍️', class: 'shopping' },
  'Bills':         { emoji: '📄', class: 'bills' },
  'Entertainment': { emoji: '🎬', class: 'entertainment' },
  'Health':        { emoji: '💊', class: 'health' },
  'Education':     { emoji: '📚', class: 'education' },
  'Salary':        { emoji: '💰', class: 'salary' },
  'Freelance':     { emoji: '💻', class: 'freelance' },
  'Investment':    { emoji: '📈', class: 'investment' },
  'Other':         { emoji: '📌', class: 'other' },
};

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  // Auth guard
  if (!isAuthenticated()) {
    window.location.href = './index.html';
    return;
  }

  initTheme();
  initSidebar();
  initNavigation();
  initRouteSection();
  initThemeToggle();
  initModal();
  initDeleteModal();
  initSearch();
  initFilters();
  initExport();

  // Load data
  await loadData();
});

async function loadData() {
  try {
    // Load profile
    const profilePromise = loadProfile();
    // Load expenses
    const expensesPromise = loadExpenses();
    await Promise.all([profilePromise, expensesPromise]);
  } catch (err) {
    showToast('Failed to load data. Please refresh.', 'error');
  }
}

async function loadProfile() {
  try {
    const profile = await fetchProfile();
    renderProfile(profile);
  } catch (err) {
    // Use cached user data
    const cached = getUser();
    if (cached) renderProfile(cached);
  }
}

async function loadExpenses() {
  try {
    expenses = await fetchExpenses();
    applyFilters();
    renderSummary();
    updateCharts(expenses, getTheme());
  } catch (err) {
    showToast('Failed to load transactions', 'error');
    expenses = [];
    applyFilters();
    renderSummary();
  }
}

// ═══════════════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════════════

function renderProfile(user) {
  const nameEl = document.getElementById('user-name');
  const emailEl = document.getElementById('user-email');
  const avatarEl = document.getElementById('user-avatar');

  if (nameEl) nameEl.textContent = user.name || 'User';
  if (emailEl) emailEl.textContent = user.email || '';
  if (avatarEl) {
    const initials = (user.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    avatarEl.textContent = initials;
  }
}

// ═══════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const overlay = document.getElementById('sidebar-overlay');

  // Desktop collapse toggle
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      // Trigger chart resize after transition
      setTimeout(() => window.dispatchEvent(new Event('resize')), 400);
    });
  }

  // Mobile hamburger
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
      sidebar.classList.add('mobile-open');
    });
  }

  // Close on overlay click
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════

function initNavigation() {
  const navLinks = document.querySelectorAll('.sidebar__link[data-section]');
  const logoutBtn = document.getElementById('nav-logout');

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const section = link.dataset.section;
      switchSection(section);
      updateSectionInUrl(section);

      // Close mobile sidebar
      document.getElementById('sidebar').classList.remove('mobile-open');
    });
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      destroyCharts();
      logout();
    });
  }
}

function initRouteSection() {
  const section = getSectionFromUrl();
  if (section && section !== currentSection) {
    switchSection(section);
  }

  window.addEventListener('hashchange', () => {
    const nextSection = getSectionFromUrl();
    if (nextSection && nextSection !== currentSection) {
      switchSection(nextSection);
    }
  });
}

function switchSection(section) {
  if (section === currentSection) return;
  currentSection = section;

  // Update nav active state
  document.querySelectorAll('.sidebar__link[data-section]').forEach(link => {
    link.classList.toggle('active', link.dataset.section === section);
  });

  // Update page title
  const titles = { overview: 'Overview', transactions: 'Transactions', analytics: 'Analytics' };
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = titles[section] || 'Dashboard';

  // Show/hide sections
  document.querySelectorAll('.content__section[id^="section-"]').forEach(el => {
    el.style.display = 'none';
  });

  const target = document.getElementById(`section-${section}`);
  if (target) {
    target.style.display = 'block';
    target.classList.add('animate-fade-in');
    // Remove class after animation to allow re-triggering
    setTimeout(() => target.classList.remove('animate-fade-in'), 400);
  }

  // Re-render charts when switching to analytics
  if (section === 'analytics') {
    setTimeout(() => updateCharts(expenses, getTheme(), true), 100);
  }
}

function getSectionFromUrl() {
  const hash = (window.location.hash || '').replace('#', '').trim().toLowerCase();
  const valid = ['overview', 'transactions', 'analytics'];
  return valid.includes(hash) ? hash : null;
}

function updateSectionInUrl(section) {
  const valid = ['overview', 'transactions', 'analytics'];
  if (!valid.includes(section)) return;
  history.replaceState(null, '', `#${section}`);
}

// ═══════════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════════

function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const newTheme = toggleTheme();
      updateCharts(expenses, newTheme);
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// SUMMARY CARDS
// ═══════════════════════════════════════════════════════════════

function renderSummary() {
  const totalIncome = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpense;
  const incomeCount = expenses.filter(e => e.type === 'income').length;
  const expenseCount = expenses.filter(e => e.type === 'expense').length;

  animateValue('total-income', formatCurrency(totalIncome));
  animateValue('total-expenses', formatCurrency(totalExpense));
  animateValue('net-balance', formatCurrency(balance));
  animateValue('total-count', expenses.length.toString());

  const incomeCountEl = document.getElementById('income-count');
  const expenseCountEl = document.getElementById('expense-count');
  const balanceStatusEl = document.getElementById('balance-status');
  const countSubEl = document.getElementById('count-sub');

  if (incomeCountEl) incomeCountEl.textContent = `${incomeCount} transaction${incomeCount !== 1 ? 's' : ''}`;
  if (expenseCountEl) expenseCountEl.textContent = `${expenseCount} transaction${expenseCount !== 1 ? 's' : ''}`;
  if (balanceStatusEl) balanceStatusEl.textContent = balance >= 0 ? 'You\'re in the green ✓' : 'Spending exceeds income';
  if (countSubEl) countSubEl.textContent = `${incomeCount} income, ${expenseCount} expense`;
}

function animateValue(elementId, value) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = value;
  el.style.animation = 'none';
  el.offsetHeight; // trigger reflow
  el.style.animation = 'fadeIn 300ms ease';
}

// ═══════════════════════════════════════════════════════════════
// TRANSACTIONS TABLE
// ═══════════════════════════════════════════════════════════════

function renderTransactions() {
  const tbody = document.getElementById('transactions-tbody');
  const emptyState = document.getElementById('transactions-empty');
  const tableWrapper = document.getElementById('transactions-table-wrapper');

  if (!tbody) return;

  if (filteredExpenses.length === 0) {
    tbody.innerHTML = '';
    if (tableWrapper) tableWrapper.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  if (tableWrapper) tableWrapper.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

  tbody.innerHTML = filteredExpenses.map((expense, index) => {
    const cat = CATEGORIES[expense.category] || CATEGORIES['Other'];
    const date = new Date(expense.date);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const isIncome = expense.type === 'income';
    const sign = isIncome ? '+' : '-';
    const amountClass = isIncome ? 'income' : 'expense';

    return `
      <tr class="animate-fade-in-up" style="animation-delay: ${Math.min(index * 30, 300)}ms;">
        <td data-label="Date" class="date-cell">${dateStr}</td>
        <td data-label="Description" class="desc-cell" title="${escapeAttr(expense.description || expense.category)}">${escapeHTML(expense.description || expense.category)}</td>
        <td data-label="Category">
          <span class="badge badge--${cat.class}">
            ${cat.emoji} ${escapeHTML(expense.category)}
          </span>
        </td>
        <td data-label="Type">
          <span class="badge badge--${expense.type}">
            ${isIncome ? '↗ Income' : '↘ Expense'}
          </span>
        </td>
        <td data-label="Amount" class="amount-cell ${amountClass}">
          ${sign}${formatCurrency(expense.amount)}
        </td>
        <td data-label="Actions">
          <div class="actions-cell">
            <button class="btn--icon btn--sm" onclick="window.__editTransaction('${expense._id}')" title="Edit" aria-label="Edit transaction">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn--icon btn--sm" onclick="window.__deleteTransaction('${expense._id}')" title="Delete" aria-label="Delete transaction" style="color: var(--red-400);">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Expose handlers to window for onclick in table rows
window.__editTransaction = (id) => openEditModal(id);
window.__deleteTransaction = (id) => openDeleteModal(id);

// ═══════════════════════════════════════════════════════════════
// SEARCH, FILTER, SORT
// ═══════════════════════════════════════════════════════════════

function initSearch() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => applyFilters(), 250);
    });
  }
}

function initFilters() {
  const typeFilter = document.getElementById('filter-type');
  const categoryFilter = document.getElementById('filter-category');
  const sortSelect = document.getElementById('sort-by');

  if (typeFilter) typeFilter.addEventListener('change', () => applyFilters());
  if (categoryFilter) categoryFilter.addEventListener('change', () => applyFilters());
  if (sortSelect) sortSelect.addEventListener('change', () => applyFilters());

  // Populate category filter
  populateCategoryFilter();
}

function populateCategoryFilter() {
  const select = document.getElementById('filter-category');
  if (!select) return;

  const categories = [...new Set(expenses.map(e => e.category))].sort();
  const currentVal = select.value;

  select.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const catInfo = CATEGORIES[cat] || CATEGORIES['Other'];
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = `${catInfo.emoji} ${cat}`;
    select.appendChild(opt);
  });

  select.value = currentVal;
}

function applyFilters() {
  const searchTerm = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
  const typeFilter = document.getElementById('filter-type')?.value || 'all';
  const categoryFilter = document.getElementById('filter-category')?.value || 'all';
  const sortBy = document.getElementById('sort-by')?.value || 'date-desc';

  // Filter
  filteredExpenses = expenses.filter(expense => {
    // Type filter
    if (typeFilter !== 'all' && expense.type !== typeFilter) return false;

    // Category filter
    if (categoryFilter !== 'all' && expense.category !== categoryFilter) return false;

    // Search
    if (searchTerm) {
      const searchFields = [
        expense.description,
        expense.category,
        expense.notes,
        expense.amount.toString()
      ].map(f => (f || '').toLowerCase());

      if (!searchFields.some(f => f.includes(searchTerm))) return false;
    }

    return true;
  });

  // Sort
  const [field, direction] = sortBy.split('-');
  filteredExpenses.sort((a, b) => {
    let valA, valB;
    if (field === 'date') {
      valA = new Date(a.date).getTime();
      valB = new Date(b.date).getTime();
    } else if (field === 'amount') {
      valA = a.amount;
      valB = b.amount;
    }
    return direction === 'asc' ? valA - valB : valB - valA;
  });

  renderTransactions();
}

// ═══════════════════════════════════════════════════════════════
// TRANSACTION MODAL
// ═══════════════════════════════════════════════════════════════

function initModal() {
  const overlay = document.getElementById('transaction-modal');
  const closeBtn = document.getElementById('modal-close');
  const cancelBtn = document.getElementById('modal-cancel');
  const saveBtn = document.getElementById('modal-save');
  const addBtn = document.getElementById('btn-add-transaction');
  const addFirstBtn = document.getElementById('btn-add-first');

  if (addBtn) addBtn.addEventListener('click', () => openAddModal());
  if (addFirstBtn) addFirstBtn.addEventListener('click', () => openAddModal());
  if (closeBtn) closeBtn.addEventListener('click', () => closeModal());
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal());
  if (saveBtn) saveBtn.addEventListener('click', () => handleSave());

  // Close on overlay click
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeDeleteModal();
    }
  });
}

function openAddModal() {
  editingId = null;
  resetForm();

  document.getElementById('modal-title').textContent = 'Add Transaction';
  document.getElementById('modal-save-text').textContent = 'Save Transaction';

  // Set today's date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('txn-date').value = today;

  openModal();
}

function openEditModal(id) {
  const expense = expenses.find(e => e._id === id);
  if (!expense) return;

  editingId = id;
  resetForm();

  document.getElementById('modal-title').textContent = 'Edit Transaction';
  document.getElementById('modal-save-text').textContent = 'Update Transaction';

  // Fill form
  document.getElementById('txn-type').value = expense.type;
  document.getElementById('txn-amount').value = expense.amount;
  document.getElementById('txn-category').value = expense.category;
  document.getElementById('txn-date').value = new Date(expense.date).toISOString().split('T')[0];
  document.getElementById('txn-description').value = expense.description || '';
  document.getElementById('txn-notes').value = expense.notes || '';

  openModal();
}

function openModal() {
  const overlay = document.getElementById('transaction-modal');
  if (overlay) {
    overlay.classList.add('active');
    overlay.classList.remove('closing');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal() {
  const overlay = document.getElementById('transaction-modal');
  if (!overlay || !overlay.classList.contains('active')) return;

  overlay.classList.add('closing');
  setTimeout(() => {
    overlay.classList.remove('active', 'closing');
    document.body.style.overflow = '';
    editingId = null;
  }, 200);
}

function resetForm() {
  const form = document.getElementById('transaction-form');
  if (form) form.reset();
}

async function handleSave() {
  const type = document.getElementById('txn-type').value;
  const amount = parseFloat(document.getElementById('txn-amount').value);
  const category = document.getElementById('txn-category').value;
  const date = document.getElementById('txn-date').value;
  const description = document.getElementById('txn-description').value.trim();
  const notes = document.getElementById('txn-notes').value.trim();

  // Validate
  if (!type || !amount || !category || !date) {
    showToast('Please fill in all required fields', 'warning');
    return;
  }

  if (amount <= 0) {
    showToast('Amount must be a positive number', 'warning');
    return;
  }

  const data = { type, amount, category, date, description, notes };

  setModalLoading(true);

  try {
    if (editingId) {
      await updateExpense(editingId, data);
      showToast('Transaction updated successfully', 'success');
    } else {
      await createExpense(data);
      showToast('Transaction added successfully', 'success');
    }

    closeModal();
    await loadExpenses();
    populateCategoryFilter();
  } catch (err) {
    showToast(err.message || 'Failed to save transaction', 'error');
  } finally {
    setModalLoading(false);
  }
}

function setModalLoading(loading) {
  const saveBtn = document.getElementById('modal-save');
  const saveText = document.getElementById('modal-save-text');
  const spinner = document.getElementById('modal-spinner');

  if (saveBtn) saveBtn.disabled = loading;
  if (saveText) saveText.style.display = loading ? 'none' : 'inline';
  if (spinner) spinner.style.display = loading ? 'inline-block' : 'none';
}

// ═══════════════════════════════════════════════════════════════
// DELETE MODAL
// ═══════════════════════════════════════════════════════════════

function initDeleteModal() {
  const closeBtn = document.getElementById('delete-modal-close');
  const cancelBtn = document.getElementById('delete-cancel');
  const confirmBtn = document.getElementById('delete-confirm');
  const overlay = document.getElementById('delete-modal');

  if (closeBtn) closeBtn.addEventListener('click', () => closeDeleteModal());
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeDeleteModal());
  if (confirmBtn) confirmBtn.addEventListener('click', () => handleDelete());

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeDeleteModal();
    });
  }
}

function openDeleteModal(id) {
  deletingId = id;
  const overlay = document.getElementById('delete-modal');
  if (overlay) {
    overlay.classList.add('active');
    overlay.classList.remove('closing');
    document.body.style.overflow = 'hidden';
  }
}

function closeDeleteModal() {
  const overlay = document.getElementById('delete-modal');
  if (!overlay || !overlay.classList.contains('active')) return;

  overlay.classList.add('closing');
  setTimeout(() => {
    overlay.classList.remove('active', 'closing');
    document.body.style.overflow = '';
    deletingId = null;
  }, 200);
}

async function handleDelete() {
  if (!deletingId) return;

  const confirmBtn = document.getElementById('delete-confirm');
  const confirmText = document.getElementById('delete-confirm-text');
  const spinner = document.getElementById('delete-spinner');

  if (confirmBtn) confirmBtn.disabled = true;
  if (confirmText) confirmText.style.display = 'none';
  if (spinner) spinner.style.display = 'inline-block';

  try {
    await deleteExpense(deletingId);
    showToast('Transaction deleted successfully', 'success');
    closeDeleteModal();
    await loadExpenses();
    populateCategoryFilter();
  } catch (err) {
    showToast(err.message || 'Failed to delete transaction', 'error');
  } finally {
    if (confirmBtn) confirmBtn.disabled = false;
    if (confirmText) confirmText.style.display = 'inline';
    if (spinner) spinner.style.display = 'none';
  }
}

// ═══════════════════════════════════════════════════════════════
// CSV EXPORT
// ═══════════════════════════════════════════════════════════════

function initExport() {
  const btn = document.getElementById('btn-export-csv');
  if (btn) btn.addEventListener('click', exportCSV);
}

function exportCSV() {
  if (filteredExpenses.length === 0) {
    showToast('No transactions to export', 'info');
    return;
  }

  const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Notes'];
  const rows = filteredExpenses.map(e => [
    new Date(e.date).toLocaleDateString('en-US'),
    `"${(e.description || '').replace(/"/g, '""')}"`,
    e.category,
    e.type,
    e.amount.toFixed(2),
    `"${(e.notes || '').replace(/"/g, '""')}"`
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `expenseflow_export_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();

  URL.revokeObjectURL(url);
  showToast('CSV exported successfully', 'success');
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
