// ─── Chart Manager Module ─────────────────────────────────────
// Handles initializing, drawing, updating, and destroying
// Chart.js instances. Responsive, theme-aware, and handles empty states.

// Store active chart instances
const activeCharts = {};

// Theme-specific configuration colors
const THEME_COLORS = {
  dark: {
    text: 'hsl(228, 12%, 65%)',
    grid: 'rgba(255, 255, 255, 0.06)',
    tooltipBg: 'hsl(228, 14%, 16%)',
    tooltipBorder: 'hsla(228, 14%, 30%, 0.5)',
    tooltipText: 'hsl(228, 20%, 95%)'
  },
  light: {
    text: 'hsl(228, 10%, 42%)',
    grid: 'rgba(0, 0, 0, 0.06)',
    tooltipBg: 'hsl(0, 0%, 100%)',
    tooltipBorder: 'hsla(220, 15%, 75%, 0.4)',
    tooltipText: 'hsl(228, 20%, 12%)'
  }
};

const CATEGORIES_COLOR = {
  'Food':          'hsl(25, 85%, 58%)',
  'Transport':     'hsl(210, 85%, 58%)',
  'Shopping':      'hsl(330, 75%, 60%)',
  'Bills':         'hsl(45, 85%, 55%)',
  'Entertainment': 'hsl(252, 85%, 58%)',
  'Health':        'hsl(152, 70%, 50%)',
  'Education':     'hsl(170, 65%, 45%)',
  'Salary':        'hsl(152, 65%, 42%)',
  'Freelance':     'hsl(185, 75%, 50%)',
  'Investment':    'hsl(235, 70%, 60%)',
  'Other':         'hsl(228, 10%, 48%)'
};

const DEFAULT_CATEGORY_COLOR = 'hsl(228, 8%, 50%)';

/**
 * Initialize charts module (register standard configurations/plugins if needed)
 */
export function initCharts() {
  // Config defaults if needed, Chart.js 4.x doesn't require explicit init
}

/**
 * Destroy all current chart instances to prevent canvas reuse issues
 */
export function destroyCharts() {
  Object.keys(activeCharts).forEach(key => {
    if (activeCharts[key]) {
      activeCharts[key].destroy();
      delete activeCharts[key];
    }
  });
}

/**
 * Main update function to draw/refresh charts on data or theme change
 * @param {Array} data - List of expenses
 * @param {'dark'|'light'} theme - Current theme
 * @param {boolean} forceAll - Set to true to render both overview and full analytics page charts
 */
export function updateCharts(data, theme = 'dark', forceAll = false) {
  const colors = THEME_COLORS[theme] || THEME_COLORS.dark;

  // 1. Grouped Monthly Chart (Income vs Expense)
  renderMonthlyChart(data, theme, colors, forceAll);

  // 2. Income vs Expense Doughnut
  renderDoughnutChart(data, theme, colors);

  // 3. Spending Trend (Daily last 30 days)
  renderTrendChart(data, theme, colors, forceAll);

  // 4. Category Breakdown Horizontal Bar
  renderCategoryChart(data, theme, colors, forceAll);
}

// ═══════════════════════════════════════════════════════════════
// 1. MONTHLY OVERVIEW CHART
// ═══════════════════════════════════════════════════════════════
function renderMonthlyChart(data, theme, colors, forceAll) {
  const ids = ['chart-monthly'];
  if (forceAll || document.getElementById('section-analytics').style.display !== 'none') {
    ids.push('chart-monthly-full');
  }

  ids.forEach(id => {
    const canvas = document.getElementById(id);
    if (!canvas) return;

    if (activeCharts[id]) {
      activeCharts[id].destroy();
    }

    // Process last 6 months
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      last6Months.push({
        label: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        monthNum: d.getMonth(),
        income: 0,
        expense: 0
      });
    }

    data.forEach(item => {
      const itemDate = new Date(item.date);
      const itemYear = itemDate.getFullYear();
      const itemMonth = itemDate.getMonth();

      const match = last6Months.find(m => m.year === itemYear && m.monthNum === itemMonth);
      if (match) {
        if (item.type === 'income') match.income += item.amount;
        else if (item.type === 'expense') match.expense += item.amount;
      }
    });

    const labels = last6Months.map(m => m.label);
    const incomes = last6Months.map(m => m.income);
    const expenses = last6Months.map(m => m.expense);

    const hasData = incomes.some(v => v > 0) || expenses.some(v => v > 0);
    if (!hasData) {
      showEmptyChartState(canvas, 'No monthly activity tracked yet.');
      return;
    }

    clearEmptyChartState(canvas);

    const ctx = canvas.getContext('2d');
    activeCharts[id] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Income',
            data: incomes,
            backgroundColor: theme === 'dark' ? 'hsl(152, 70%, 45%)' : 'hsl(152, 65%, 42%)',
            borderRadius: 6,
            borderSkipped: false
          },
          {
            label: 'Expense',
            data: expenses,
            backgroundColor: theme === 'dark' ? 'hsl(0, 75%, 55%)' : 'hsl(0, 70%, 52%)',
            borderRadius: 6,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: colors.text,
              font: { family: 'Inter', size: 11, weight: '500' },
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: getTooltipConfig(colors)
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: colors.text,
              font: { family: 'Inter', size: 10 }
            }
          },
          y: {
            grid: { color: colors.grid },
            ticks: {
              color: colors.text,
              font: { family: 'Inter', size: 10 },
              callback: (val) => '$' + formatNumber(val)
            },
            border: { dash: [4, 4] }
          }
        }
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// 2. INCOME VS EXPENSE DOUGHNUT
// ═══════════════════════════════════════════════════════════════
function renderDoughnutChart(data, theme, colors) {
  const id = 'chart-doughnut';
  const canvas = document.getElementById(id);
  if (!canvas) return;

  if (activeCharts[id]) {
    activeCharts[id].destroy();
  }

  const income = data.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const expense = data.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);

  if (income === 0 && expense === 0) {
    showEmptyChartState(canvas, 'Add income or expense to see breakdown.');
    return;
  }

  clearEmptyChartState(canvas);

  const ctx = canvas.getContext('2d');
  activeCharts[id] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Income', 'Expense'],
      datasets: [{
        data: [income, expense],
        backgroundColor: [
          theme === 'dark' ? 'hsl(152, 70%, 45%)' : 'hsl(152, 65%, 42%)',
          theme === 'dark' ? 'hsl(0, 75%, 55%)' : 'hsl(0, 70%, 52%)'
        ],
        borderWidth: theme === 'dark' ? 3 : 2,
        borderColor: theme === 'dark' ? 'hsl(228, 16%, 11%)' : 'hsl(0, 0%, 100%)',
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: colors.text,
            font: { family: 'Inter', size: 11, weight: '500' },
            boxWidth: 8,
            boxHeight: 8,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: getTooltipConfig(colors)
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// 3. SPENDING TREND (Line chart)
// ═══════════════════════════════════════════════════════════════
function renderTrendChart(data, theme, colors, forceAll) {
  const ids = ['chart-trend'];
  if (forceAll || document.getElementById('section-analytics').style.display !== 'none') {
    ids.push('chart-trend-full');
  }

  ids.forEach(id => {
    const canvas = document.getElementById(id);
    if (!canvas) return;

    if (activeCharts[id]) {
      activeCharts[id].destroy();
    }

    // Filter only expense type
    const expensesOnly = data.filter(item => item.type === 'expense');

    if (expensesOnly.length === 0) {
      showEmptyChartState(canvas, 'Add expenses to see spending trends.');
      return;
    }

    clearEmptyChartState(canvas);

    // Group expenses by date (last 30 days)
    const dailyExpenses = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      dailyExpenses[dateKey] = {
        label: d.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
        amount: 0
      };
    }

    expensesOnly.forEach(item => {
      const dateKey = new Date(item.date).toISOString().split('T')[0];
      if (dailyExpenses[dateKey]) {
        dailyExpenses[dateKey].amount += item.amount;
      }
    });

    const labels = Object.values(dailyExpenses).map(day => day.label);
    const values = Object.values(dailyExpenses).map(day => day.amount);

    const ctx = canvas.getContext('2d');

    // Create vertical gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    const accentColor = 'rgba(252, 85, 58, '; // primary color prefix
    gradient.addColorStop(0, accentColor + '0.22)');
    gradient.addColorStop(1, accentColor + '0.00)');

    activeCharts[id] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Daily Spend',
          data: values,
          borderColor: 'hsl(252, 85%, 58%)',
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'hsl(252, 85%, 58%)',
          pointHoverBorderColor: theme === 'dark' ? 'hsl(228, 14%, 16%)' : 'hsl(0, 0%, 100%)',
          pointHoverBorderWidth: 2,
          fill: true,
          backgroundColor: gradient,
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: getTooltipConfig(colors)
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: colors.text,
              font: { family: 'Inter', size: 10 },
              maxTicksLimit: 7
            }
          },
          y: {
            grid: { color: colors.grid },
            ticks: {
              color: colors.text,
              font: { family: 'Inter', size: 10 },
              callback: (val) => '$' + formatNumber(val)
            },
            border: { dash: [4, 4] }
          }
        }
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// 4. CATEGORY BREAKDOWN CHART
// ═══════════════════════════════════════════════════════════════
function renderCategoryChart(data, theme, colors, forceAll) {
  const ids = ['chart-categories'];
  if (forceAll || document.getElementById('section-analytics').style.display !== 'none') {
    ids.push('chart-categories-full');
  }

  ids.forEach(id => {
    const canvas = document.getElementById(id);
    if (!canvas) return;

    if (activeCharts[id]) {
      activeCharts[id].destroy();
    }

    const expensesOnly = data.filter(item => item.type === 'expense');

    if (expensesOnly.length === 0) {
      showEmptyChartState(canvas, 'Add expenses to see category breakdown.');
      return;
    }

    clearEmptyChartState(canvas);

    // Sum by category
    const catSum = {};
    expensesOnly.forEach(item => {
      catSum[item.category] = (catSum[item.category] || 0) + item.amount;
    });

    // Sort top categories
    const sortedCats = Object.keys(catSum)
      .map(cat => ({ category: cat, amount: catSum[cat] }))
      .sort((a, b) => b.amount - a.amount);

    const labels = sortedCats.map(c => c.category);
    const values = sortedCats.map(c => c.amount);
    const bgColors = sortedCats.map(c => CATEGORIES_COLOR[c.category] || DEFAULT_CATEGORY_COLOR);

    const ctx = canvas.getContext('2d');
    activeCharts[id] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: bgColors,
          borderRadius: 4,
          borderSkipped: false,
          barThickness: 16
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: getTooltipConfig(colors)
        },
        scales: {
          x: {
            grid: { color: colors.grid },
            ticks: {
              color: colors.text,
              font: { family: 'Inter', size: 10 },
              callback: (val) => '$' + formatNumber(val)
            },
            border: { dash: [4, 4] }
          },
          y: {
            grid: { display: false },
            ticks: {
              color: colors.text,
              font: { family: 'Inter', size: 11, weight: '500' }
            }
          }
        }
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// HELPER METHODS
// ═══════════════════════════════════════════════════════════════

/** Show placeholder overlay inside canvas container when no data is available */
function showEmptyChartState(canvas, message) {
  const container = canvas.parentElement;
  if (!container) return;

  // Hide the canvas
  canvas.style.display = 'none';

  // Check if empty state overlay already exists
  let overlay = container.querySelector('.chart-empty');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'chart-empty animate-fade-in';
    overlay.innerHTML = `
      <div class="chart-empty__icon">📊</div>
      <div class="chart-empty__message">${message}</div>
    `;
    container.appendChild(overlay);
  } else {
    overlay.querySelector('.chart-empty__message').textContent = message;
    overlay.style.display = 'flex';
  }
}

/** Remove placeholder overlay and restore the canvas display */
function clearEmptyChartState(canvas) {
  const container = canvas.parentElement;
  if (!container) return;

  canvas.style.display = 'block';
  const overlay = container.querySelector('.chart-empty');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

/** Tooltip styles configured to match Vercel/Linear custom styles */
function getTooltipConfig(colors) {
  return {
    backgroundColor: colors.tooltipBg,
    borderColor: colors.tooltipBorder,
    borderWidth: 1,
    titleColor: colors.tooltipText,
    bodyColor: colors.tooltipText,
    titleFont: { family: 'Inter', size: 12, weight: '600' },
    bodyFont: { family: 'Inter', size: 12 },
    padding: 10,
    cornerRadius: 8,
    displayColors: true,
    boxWidth: 8,
    boxHeight: 8,
    boxPadding: 4,
    usePointStyle: true,
    callbacks: {
      label: function(context) {
        let label = context.dataset.label || '';
        if (label) label += ': ';
        if (context.parsed.y !== undefined) {
          label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
        } else if (context.parsed !== undefined) {
          label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed);
        }
        return label;
      }
    }
  };
}

/** Formatter helper for axis labels (e.g. 1500 -> 1.5K) */
function formatNumber(num) {
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num;
}
