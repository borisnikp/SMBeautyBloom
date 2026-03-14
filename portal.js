/* ===============================================
   SM Beauty Bloom — Staff Portal Logic
   Customer management + bookings dashboard
   =============================================== */

const API_URL = 'https://smbeautybloom-production.up.railway.app';

let authToken = sessionStorage.getItem('staff_token') || null;
let calendar  = null;
let allBookings  = [];
let allServices  = [];
let allCustomers = []; // derived from bookings
let activeCustomerKey = null; // phone used as customer key

const FALLBACK_SERVICES = [
  { id: '1',  name: 'Šišanje & Oblikovanje',  category: 'hair',   duration_minutes: 45,  price_hrk: 35 },
  { id: '2',  name: 'Bojanje Kose',            category: 'hair',   duration_minutes: 120, price_hrk: 85 },
  { id: '3',  name: 'Balayage / Ombré',        category: 'hair',   duration_minutes: 150, price_hrk: 120 },
  { id: '4',  name: 'Dubinska Njega Kose',     category: 'hair',   duration_minutes: 60,  price_hrk: 50 },
  { id: '5',  name: 'Tretman Lica — Classic',  category: 'skin',   duration_minutes: 60,  price_hrk: 55 },
  { id: '6',  name: 'Tretman Lica — Premium',  category: 'skin',   duration_minutes: 90,  price_hrk: 95 },
  { id: '7',  name: 'Profesionalni Piling',    category: 'skin',   duration_minutes: 45,  price_hrk: 65 },
  { id: '8',  name: 'Bridal Bloom — Proba',    category: 'bridal', duration_minutes: 120, price_hrk: 100 },
  { id: '9',  name: 'Bridal Bloom — Paket',    category: 'bridal', duration_minutes: 240, price_hrk: 250 },
  { id: '10', name: 'Masaža Opuštanja',        category: 'spa',    duration_minutes: 60,  price_hrk: 45 },
  { id: '11', name: 'Aromaterapija',           category: 'spa',    duration_minutes: 75,  price_hrk: 60 },
  { id: '12', name: 'Spa Ceremonija',          category: 'spa',    duration_minutes: 120, price_hrk: 120 },
];

// ─── INIT ────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  allServices = FALLBACK_SERVICES;
  initLogin();
  initSidebar();
  initLogout();
});


// ═══════════════════════════════════════════════
//  LOGIN — authenticates against Railway API
// ═══════════════════════════════════════════════

function initLogin() {
  const form        = document.getElementById('loginForm');
  const loginScreen = document.getElementById('loginScreen');
  const dashboard   = document.getElementById('dashboard');
  const session     = sessionStorage.getItem('staff_session');

  // Restore token on page reload
  if (session && authToken) {
    loginScreen.style.display = 'none';
    dashboard.style.display   = 'grid';
    setUserInfo(JSON.parse(session));
    initDashboard();
    return;
  }

  // Clear stale session if token is missing
  if (session && !authToken) {
    sessionStorage.removeItem('staff_session');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn      = document.getElementById('loginBtn');
    const errDiv   = document.getElementById('loginError');

    btn.disabled    = true;
    btn.textContent = 'Prijava...';
    errDiv.style.display = 'none';

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Pogrešno korisničko ime ili lozinka.');
      }

      const { token, user } = await res.json();
      authToken = token;
      sessionStorage.setItem('staff_token', token);
      sessionStorage.setItem('staff_session', JSON.stringify(user));
      setUserInfo(user);

      loginScreen.style.display = 'none';
      dashboard.style.display   = 'grid';
      initDashboard();
    } catch (err) {
      errDiv.textContent   = err.message;
      errDiv.style.display = 'block';
      btn.disabled         = false;
      btn.textContent      = 'Prijavite se';
    }
  });
}

function setUserInfo(user) {
  const name = user.name || user.username || 'Admin';
  document.getElementById('userName').textContent  = cap(name);
  document.getElementById('userAvatar').textContent = name.charAt(0).toUpperCase();
}

function logout() {
  authToken = null;
  sessionStorage.removeItem('staff_token');
  sessionStorage.removeItem('staff_session');
  location.reload();
}

function initLogout() {
  document.getElementById('logoutBtn').addEventListener('click', logout);
}


// ═══════════════════════════════════════════════
//  SIDEBAR & NAVIGATION
// ═══════════════════════════════════════════════

function initSidebar() {
  const toggle  = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');

  toggle.addEventListener('click', () => sidebar.classList.toggle('open'));

  document.querySelectorAll('.sidebar-link[data-view]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.dataset.view;

      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.getElementById('view' + cap(view)).classList.add('active');

      sidebar.classList.remove('open');

      if (view === 'bookings')  renderBookingsTable();
      if (view === 'today')     renderTodayTimeline();
      if (view === 'customers') renderCustomersTable();
      if (view === 'overview')  renderOverview();
      if (view === 'calendar' && calendar) calendar.updateSize();
    });
  });
}


// ═══════════════════════════════════════════════
//  DASHBOARD INIT
// ═══════════════════════════════════════════════

async function initDashboard() {
  // Load local data immediately — never block on API
  allBookings  = JSON.parse(localStorage.getItem('smb_bookings') || '[]');
  allServices  = FALLBACK_SERVICES;
  allCustomers = buildCustomerList(allBookings);

  // Set today's date
  document.getElementById('overviewDate').textContent = new Date().toLocaleDateString('hr-HR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  document.getElementById('todayDate').textContent = new Date().toLocaleDateString('hr-HR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  renderOverview();
  renderTodayTimeline();
  initCalendar();
  initFilterStatus();
  initBookingSearch();
  initCustomerSearch();
  initModalClose();
  initCustomerPanel();
  updatePendingBadge();

  // Try to pull real bookings from Railway — API is the source of truth
  fetchApiBookings().then(apiBookings => {
    if (!apiBookings.length) return;
    // API bookings replace local ones (API is source of truth)
    allBookings  = apiBookings;
    allCustomers = buildCustomerList(allBookings);
    renderOverview();
    renderTodayTimeline();
    refreshCalendar();
    updatePendingBadge();
    const active = document.querySelector('.view.active');
    if (active?.id === 'viewBookings')  renderBookingsTable();
    if (active?.id === 'viewCustomers') renderCustomersTable();
  }).catch(() => {});
}


// ─── DATA LOADING ────────────────────────────────

async function loadBookings() {
  return JSON.parse(localStorage.getItem('smb_bookings') || '[]');
}

// Fetches from Railway API — logs out on 401 (expired token)
async function fetchApiBookings() {
  if (!authToken) return [];
  try {
    const res = await fetch(`${API_URL}/api/staff/bookings`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    if (res.status === 401) { logout(); return []; }
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function loadServices() {
  try {
    const res = await fetch(`${API_URL}/api/services`);
    if (!res.ok) throw new Error('Failed');
    return await res.json();
  } catch { return FALLBACK_SERVICES; }
}

function getServiceName(id) {
  const s = allServices.find(s => s.id === id);
  return s ? s.name : 'Nepoznata usluga';
}

function getServiceDuration(id) {
  const s = allServices.find(s => s.id === id);
  return s ? s.duration_minutes : 60;
}

function getServicePrice(id) {
  const s = allServices.find(s => s.id === id);
  return s ? s.price_hrk : 0;
}


// ═══════════════════════════════════════════════
//  CUSTOMER AGGREGATION
// ═══════════════════════════════════════════════

function buildCustomerList(bookings) {
  const map = {};

  bookings.forEach(b => {
    // Use phone as primary key, but separate by name to avoid merging different clients
    const key = (b.client_phone && b.client_name)
      ? `${b.client_phone}::${b.client_name.trim().toLowerCase()}`
      : b.client_name.trim().toLowerCase();
    if (!map[key]) {
      map[key] = {
        key,
        name:     b.client_name,
        phone:    b.client_phone || '—',
        email:    b.client_email || '',
        bookings: [],
      };
    }
    // Always update to most complete info
    if (b.client_email && !map[key].email) map[key].email = b.client_email;
    map[key].bookings.push(b);
  });

  // Compute derived stats
  return Object.values(map).map(c => {
    const active = c.bookings.filter(b => b.status !== 'cancelled');
    const done   = c.bookings.filter(b => b.status === 'completed');
    const sorted = [...c.bookings].sort((a, b) => b.booking_date.localeCompare(a.booking_date));

    const totalSpent = done.reduce((sum, b) => sum + getServicePrice(b.service_id), 0);

    // Favourite service
    const svcCount = {};
    active.forEach(b => { svcCount[b.service_id] = (svcCount[b.service_id] || 0) + 1; });
    const favId   = Object.keys(svcCount).sort((a, b) => svcCount[b] - svcCount[a])[0];
    const favName = favId ? getServiceName(favId) : '—';

    return {
      ...c,
      visits:      active.length,
      totalSpent,
      lastVisit:   sorted[0]?.booking_date || null,
      firstVisit:  sorted[sorted.length - 1]?.booking_date || null,
      favourite:   favName,
      isNew:       active.length <= 1,
    };
  }).sort((a, b) => (b.lastVisit || '').localeCompare(a.lastVisit || ''));
}


// ═══════════════════════════════════════════════
//  OVERVIEW
// ═══════════════════════════════════════════════

function renderOverview() {
  const today     = todayStr();
  const weekStart = weekStartStr();

  const todayBkgs   = allBookings.filter(b => b.booking_date === today);
  const pending     = allBookings.filter(b => b.status === 'pending');
  const weekConfirmed = allBookings.filter(b =>
    b.status === 'confirmed' && b.booking_date >= weekStart && b.booking_date <= today
  );

  document.getElementById('statToday').textContent     = todayBkgs.length;
  document.getElementById('statCustomers').textContent  = allCustomers.length;
  document.getElementById('statConfirmed').textContent  = weekConfirmed.length;
  document.getElementById('statPending').textContent    = pending.length;

  // Today's appointments
  const todayEl = document.getElementById('overviewToday');
  const todaySorted = todayBkgs
    .filter(b => b.status !== 'cancelled')
    .sort((a, b) => a.booking_time.localeCompare(b.booking_time));

  if (todaySorted.length === 0) {
    todayEl.innerHTML = `<div class="empty-state"><div class="empty-icon">☀️</div><p>Nema termina danas.</p></div>`;
  } else {
    todayEl.innerHTML = todaySorted.map(b => `
      <div class="mini-list-item" onclick="openBookingById('${b.id}')">
        <span class="mini-time">${b.booking_time}</span>
        <div class="mini-info">
          <div class="mini-name">${esc(b.client_name)}</div>
          <div class="mini-service">${esc(getServiceName(b.service_id))}</div>
        </div>
        <span class="status-badge ${b.status}">${statusLabel(b.status)}</span>
      </div>
    `).join('');
  }

  // Recent bookings
  const recentEl = document.getElementById('overviewRecent');
  const recent   = [...allBookings]
    .sort((a, b) => (b.created_at || b.booking_date).localeCompare(a.created_at || a.booking_date))
    .slice(0, 5);

  recentEl.innerHTML = recent.map(b => `
    <div class="mini-list-item" onclick="openBookingById('${b.id}')">
      <span class="mini-time">${formatDateShort(b.booking_date)}</span>
      <div class="mini-info">
        <div class="mini-name">${esc(b.client_name)}</div>
        <div class="mini-service">${esc(getServiceName(b.service_id))}</div>
      </div>
      <span class="status-badge ${b.status}">${statusLabel(b.status)}</span>
    </div>
  `).join('');
}

function updatePendingBadge() {
  const n     = allBookings.filter(b => b.status === 'pending').length;
  const badge = document.getElementById('pendingBadge');
  document.getElementById('pendingCount').textContent = n;
  badge.style.display = n > 0 ? 'inline-flex' : 'none';
}


// ═══════════════════════════════════════════════
//  CUSTOMERS TABLE
// ═══════════════════════════════════════════════

function initCustomerSearch() {
  document.getElementById('customerSearch').addEventListener('input', renderCustomersTable);
}

function renderCustomersTable(searchOverride = null) {
  const q      = (typeof searchOverride === 'string' ? searchOverride : document.getElementById('customerSearch').value).toLowerCase().trim();
  const tbody  = document.getElementById('customersBody');
  const noEl   = document.getElementById('noCustomers');

  let list = [...allCustomers];
  if (q) {
    list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  }

  if (list.length === 0) {
    tbody.innerHTML = '';
    noEl.style.display = 'block';
    return;
  }

  noEl.style.display = 'none';

  tbody.innerHTML = list.map(c => `
    <tr>
      <td>
        <div class="customer-cell">
          <div class="customer-initials">${initials(c.name)}</div>
          <div>
            <div class="customer-name">${esc(c.name)}</div>
            <div class="customer-visits-mini">${c.visits} ${c.visits === 1 ? 'posjet' : 'posjeta'}</div>
          </div>
        </div>
      </td>
      <td><a href="tel:${c.phone.replace(/\s/g,'')}" class="phone-link">${esc(c.phone)}</a></td>
      <td>${c.email ? `<a href="mailto:${c.email}" class="phone-link">${esc(c.email)}</a>` : '<span style="color:var(--charcoal-muted)">—</span>'}</td>
      <td><strong>${c.visits}</strong></td>
      <td>${c.lastVisit ? formatDateShort(c.lastVisit) : '—'}</td>
      <td><span class="status-badge ${c.isNew ? 'new' : 'active'}">${c.isNew ? 'Nova' : 'Aktivna'}</span></td>
      <td>
        <button class="action-btn profile" onclick="openCustomerPanel('${c.key.replace(/'/g,"\\'")}')">Profil</button>
      </td>
    </tr>
  `).join('');
}


// ═══════════════════════════════════════════════
//  CUSTOMER PANEL
// ═══════════════════════════════════════════════

function initCustomerPanel() {
  document.getElementById('customerPanelClose').addEventListener('click', closeCustomerPanel);
  document.getElementById('panelBackdrop').addEventListener('click', closeCustomerPanel);
  document.getElementById('saveNotesBtn').addEventListener('click', saveCustomerNotes);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeCustomerPanel();
  });
}

function openCustomerPanel(key) {
  const customer = allCustomers.find(c => c.key === key);
  if (!customer) return;

  activeCustomerKey = key;

  // Header
  document.getElementById('panelCustomerHeader').innerHTML = `
    <div class="panel-avatar">${initials(customer.name)}</div>
    <div>
      <div class="panel-customer-name">${esc(customer.name)}</div>
      <div class="panel-customer-contact">
        <a href="tel:${customer.phone.replace(/\s/g,'')}">${esc(customer.phone)}</a>
        ${customer.email ? `<a href="mailto:${customer.email}">${esc(customer.email)}</a>` : ''}
      </div>
    </div>
  `;

  // Stats
  const spent = customer.totalSpent > 0 ? `€${customer.totalSpent.toFixed(0)}` : '—';
  document.getElementById('panelStats').innerHTML = `
    <div class="panel-stat">
      <span class="panel-stat-value">${customer.visits}</span>
      <span class="panel-stat-label">Posjeta</span>
    </div>
    <div class="panel-stat">
      <span class="panel-stat-value">${spent}</span>
      <span class="panel-stat-label">Potrošeno</span>
    </div>
    <div class="panel-stat">
      <span class="panel-stat-value">${customer.lastVisit ? formatDateShort(customer.lastVisit) : '—'}</span>
      <span class="panel-stat-label">Zadnji posjet</span>
    </div>
  `;

  // Notes (from localStorage)
  const savedNotes = localStorage.getItem(`smb_notes_${key}`) || '';
  document.getElementById('panelNotes').value = savedNotes;
  document.getElementById('notesSaved').style.display = 'none';

  // Booking history
  const sorted = [...customer.bookings].sort((a, b) => b.booking_date.localeCompare(a.booking_date));
  const histEl = document.getElementById('panelHistory');

  if (sorted.length === 0) {
    histEl.innerHTML = '<p style="color:var(--charcoal-muted);font-size:0.84rem;">Nema rezervacija.</p>';
  } else {
    histEl.innerHTML = sorted.map(b => `
      <div class="history-item" onclick="openBookingById('${b.id}')">
        <span class="history-date">${formatDateShort(b.booking_date)}</span>
        <span class="history-service">${esc(getServiceName(b.service_id))}</span>
        <span class="status-badge ${b.status}">${statusLabel(b.status)}</span>
      </div>
    `).join('');
  }

  // Open panel
  document.getElementById('customerPanel').classList.add('open');
  document.getElementById('panelBackdrop').classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function closeCustomerPanel() {
  activeCustomerKey = null;
  document.getElementById('customerPanel').classList.remove('open');
  document.getElementById('panelBackdrop').classList.remove('visible');
  document.body.style.overflow = '';
}

function saveCustomerNotes() {
  if (!activeCustomerKey) return;
  const notes = document.getElementById('panelNotes').value;
  localStorage.setItem(`smb_notes_${activeCustomerKey}`, notes);

  const saved = document.getElementById('notesSaved');
  saved.style.display = 'inline';
  setTimeout(() => { saved.style.display = 'none'; }, 2000);
}

window.openCustomerPanel = openCustomerPanel;


// ═══════════════════════════════════════════════
//  BOOKINGS TABLE
// ═══════════════════════════════════════════════

function initFilterStatus() {
  document.getElementById('filterStatus').addEventListener('change', renderBookingsTable);
}

function initBookingSearch() {
  document.getElementById('bookingSearch').addEventListener('input', renderBookingsTable);
}

function renderBookingsTable() {
  const filter = document.getElementById('filterStatus').value;
  const q      = document.getElementById('bookingSearch').value.toLowerCase().trim();
  const tbody  = document.getElementById('bookingsBody');
  const noEl   = document.getElementById('noBookings');

  let list = [...allBookings].sort((a, b) =>
    (b.booking_date + b.booking_time).localeCompare(a.booking_date + a.booking_time)
  );

  if (filter !== 'all') list = list.filter(b => b.status === filter);
  if (q) list = list.filter(b => b.client_name.toLowerCase().includes(q));

  if (list.length === 0) {
    tbody.innerHTML = '';
    noEl.style.display = 'block';
    return;
  }

  noEl.style.display = 'none';

  tbody.innerHTML = list.map(b => {
    let actions = '';
    if (b.status === 'pending') {
      actions = `
        <button class="action-btn confirm" onclick="updateStatus('${b.id}','confirmed')">✓ Potvrdi</button>
        <button class="action-btn cancel"  onclick="updateStatus('${b.id}','cancelled')">✕ Otkaži</button>
      `;
    } else if (b.status === 'confirmed') {
      actions = `
        <button class="action-btn confirm" onclick="updateStatus('${b.id}','completed')">★ Završi</button>
        <button class="action-btn cancel"  onclick="updateStatus('${b.id}','cancelled')">✕ Otkaži</button>
      `;
    }
    actions += `<button class="action-btn view" onclick="openBookingById('${b.id}')">Detalji</button>`;

    return `
      <tr>
        <td>${formatDateShort(b.booking_date)}</td>
        <td>${b.booking_time}h</td>
        <td>
          <div class="customer-cell">
            <div class="customer-initials">${initials(b.client_name)}</div>
            <strong>${esc(b.client_name)}</strong>
          </div>
        </td>
        <td>${esc(getServiceName(b.service_id))}</td>
        <td><span class="status-badge ${b.status}">${statusLabel(b.status)}</span></td>
        <td>${actions}</td>
      </tr>
    `;
  }).join('');
}


// ═══════════════════════════════════════════════
//  TODAY TIMELINE
// ═══════════════════════════════════════════════

function renderTodayTimeline() {
  const today = todayStr();
  const list  = allBookings
    .filter(b => b.booking_date === today && b.status !== 'cancelled')
    .sort((a, b) => a.booking_time.localeCompare(b.booking_time));

  const el = document.getElementById('todayTimeline');

  if (list.length === 0) {
    el.innerHTML = `
      <div class="today-empty">
        <div class="empty-icon">☀️</div>
        <p>Nema zakazanih termina za danas.</p>
      </div>
    `;
    return;
  }

  el.innerHTML = list.map(b => `
    <div class="timeline-card" onclick="openBookingById('${b.id}')">
      <div class="timeline-time">
        ${b.booking_time}
        <small>${b.duration_minutes || getServiceDuration(b.service_id)} min</small>
      </div>
      <div class="timeline-bar ${b.status}"></div>
      <div class="timeline-info">
        <span class="timeline-client">${esc(b.client_name)}</span>
        <span class="timeline-service">${esc(getServiceName(b.service_id))}</span>
      </div>
      <div>
        <span class="status-badge ${b.status}">${statusLabel(b.status)}</span>
      </div>
    </div>
  `).join('');
}


// ═══════════════════════════════════════════════
//  FULLCALENDAR
// ═══════════════════════════════════════════════

function initCalendar() {
  const el = document.getElementById('calendar');

  calendar = new FullCalendar.Calendar(el, {
    initialView:   window.innerWidth < 768 ? 'listWeek' : 'dayGridMonth',
    locale:        'hr',
    headerToolbar: {
      left:   'prev,next today',
      center: 'title',
      right:  'dayGridMonth,timeGridWeek,listWeek',
    },
    buttonText: { today: 'Danas', month: 'Mjesec', week: 'Tjedan', list: 'Lista' },
    height:         'auto',
    navLinks:       true,
    nowIndicator:   true,
    events:         bookingsToEvents(allBookings),
    eventClick:     info => {
      const b = allBookings.find(b => b.id === info.event.id);
      if (b) openBookingModal(b);
    },
  });

  calendar.render();
}

function bookingsToEvents(bookings) {
  return bookings.map(b => {
    const duration = b.duration_minutes || getServiceDuration(b.service_id);
    const start    = new Date(b.booking_date + 'T' + b.booking_time + ':00');
    const end      = new Date(start.getTime() + duration * 60000);
    return {
      id:        b.id,
      title:     `${b.client_name} — ${getServiceName(b.service_id)}`,
      start,
      end,
      className: `status-${b.status}`,
    };
  });
}

function refreshCalendar() {
  if (!calendar) return;
  calendar.removeAllEvents();
  calendar.addEventSource(bookingsToEvents(allBookings));
}


// ═══════════════════════════════════════════════
//  BOOKING MODAL
// ═══════════════════════════════════════════════

function initModalClose() {
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('bookingModal').addEventListener('click', e => {
    if (e.target.id === 'bookingModal') closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

function openBookingById(id) {
  const b = allBookings.find(b => b.id === id);
  if (b) openBookingModal(b);
}

function openBookingModal(b) {
  document.getElementById('modalClient').textContent  = b.client_name;

  const phoneEl = document.getElementById('modalPhone');
  phoneEl.textContent = b.client_phone;
  phoneEl.href        = `tel:${(b.client_phone || '').replace(/\s/g, '')}`;

  document.getElementById('modalEmail').textContent    = b.client_email || '—';
  document.getElementById('modalService').textContent  = getServiceName(b.service_id);
  document.getElementById('modalDate').textContent     = formatDate(b.booking_date);
  document.getElementById('modalTime').textContent     = b.booking_time + 'h';
  document.getElementById('modalDuration').textContent = (b.duration_minutes || getServiceDuration(b.service_id)) + ' min';

  const notesRow = document.getElementById('modalNotesRow');
  if (b.notes) {
    document.getElementById('modalNotes').textContent = b.notes;
    notesRow.style.display = 'flex';
  } else {
    notesRow.style.display = 'none';
  }

  const statusEl = document.getElementById('modalStatus');
  statusEl.textContent = statusLabel(b.status);
  statusEl.className   = `status-badge ${b.status}`;

  const actionsEl = document.getElementById('modalActions');
  actionsEl.innerHTML = '';

  if (b.status === 'pending') {
    actionsEl.innerHTML = `
      <button class="action-btn confirm" onclick="updateStatus('${b.id}','confirmed');closeModal();">✓ Potvrdi</button>
      <button class="action-btn cancel"  onclick="updateStatus('${b.id}','cancelled');closeModal();">✕ Otkaži</button>
    `;
  } else if (b.status === 'confirmed') {
    actionsEl.innerHTML = `
      <button class="action-btn confirm" onclick="updateStatus('${b.id}','completed');closeModal();">★ Završi</button>
      <button class="action-btn cancel"  onclick="updateStatus('${b.id}','cancelled');closeModal();">✕ Otkaži</button>
    `;
  }

  document.getElementById('bookingModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('bookingModal').style.display = 'none';
}


// ═══════════════════════════════════════════════
//  UPDATE STATUS
// ═══════════════════════════════════════════════

async function updateStatus(bookingId, newStatus) {
  // Optimistic local update
  const idx = allBookings.findIndex(b => b.id === bookingId);
  if (idx !== -1) allBookings[idx] = { ...allBookings[idx], status: newStatus };
  updateBookingStatusLocally(bookingId, newStatus);

  try {
    const res = await fetch(`${API_URL}/api/staff/bookings/${bookingId}/status`, {
      method:  'PATCH',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.status === 401) { logout(); return; }
    if (res.ok) {
      const updated = await res.json();
      if (idx !== -1) allBookings[idx] = updated;
      updateBookingStatusLocally(updated.id, updated.status);
    }
  } catch {
    // API unreachable — local update already applied, fine for testing
  }

  // Rebuild customers after status change
  allCustomers = buildCustomerList(allBookings);

  // Refresh all views
  refreshCalendar();
  updatePendingBadge();
  renderOverview();
  renderTodayTimeline();

  const active = document.querySelector('.view.active');
  if (active?.id === 'viewBookings')  renderBookingsTable();
  if (active?.id === 'viewCustomers') renderCustomersTable();
}


// ═══════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════

function updateBookingStatusLocally(bookingId, newStatus) {
  const list = JSON.parse(localStorage.getItem('smb_bookings') || '[]');
  const idx  = list.findIndex(b => b.id === bookingId);
  if (idx !== -1) {
    list[idx] = { ...list[idx], status: newStatus };
    localStorage.setItem('smb_bookings', JSON.stringify(list));
  }
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function initials(name = '') {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function weekStartStr() {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().split('T')[0];
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('hr-HR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

function formatDateShort(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('hr-HR', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function statusLabel(status) {
  return { pending: 'Na čekanju', confirmed: 'Potvrđeno', cancelled: 'Otkazano', completed: 'Završeno' }[status] || status;
}

// Global references for inline onclick handlers
window.openBookingById = openBookingById;
window.updateStatus    = updateStatus;
window.closeModal      = closeModal;
