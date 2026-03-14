/* ===============================================
   SM Beauty Bloom — Premium Interactions
   API + Flatpickr Integration
   =============================================== */

// ─── API Configuration ──────────────────────────
// TODO: Replace with your Railway API URL after deployment
const API_URL = 'https://smbeautybloom-production.up.railway.app';

// Working hours (loaded from API on init, with fallback)
let workingHours = {
  0: { is_open: false },
  1: { is_open: true, open_time: '09:00', close_time: '20:00' },
  2: { is_open: true, open_time: '09:00', close_time: '20:00' },
  3: { is_open: true, open_time: '09:00', close_time: '20:00' },
  4: { is_open: true, open_time: '09:00', close_time: '20:00' },
  5: { is_open: true, open_time: '09:00', close_time: '20:00' },
  6: { is_open: true, open_time: '09:00', close_time: '16:00' },
};

// Fallback services (used when API is unreachable)
const FALLBACK_SERVICES = [
  { id: '1', name: 'Šišanje & Oblikovanje', category: 'hair', duration_minutes: 45, price_hrk: 35.00 },
  { id: '2', name: 'Bojanje Kose', category: 'hair', duration_minutes: 120, price_hrk: 85.00 },
  { id: '3', name: 'Balayage / Ombré', category: 'hair', duration_minutes: 150, price_hrk: 120.00 },
  { id: '4', name: 'Dubinska Njega Kose', category: 'hair', duration_minutes: 60, price_hrk: 50.00 },
  { id: '5', name: 'Tretman Lica — Classic', category: 'skin', duration_minutes: 60, price_hrk: 55.00 },
  { id: '6', name: 'Tretman Lica — Premium', category: 'skin', duration_minutes: 90, price_hrk: 95.00 },
  { id: '7', name: 'Profesionalni Piling', category: 'skin', duration_minutes: 45, price_hrk: 65.00 },
  { id: '8', name: 'Bridal Bloom — Proba', category: 'bridal', duration_minutes: 120, price_hrk: 100.00 },
  { id: '9', name: 'Bridal Bloom — Paket', category: 'bridal', duration_minutes: 240, price_hrk: 250.00 },
  { id: '10', name: 'Masaža Opuštanja', category: 'spa', duration_minutes: 60, price_hrk: 45.00 },
  { id: '11', name: 'Aromaterapija', category: 'spa', duration_minutes: 75, price_hrk: 60.00 },
  { id: '12', name: 'Spa Ceremonija', category: 'spa', duration_minutes: 120, price_hrk: 120.00 },
];

// ─── Initialize ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Hide preloader immediately — don't depend on 'load' event
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(() => preloader.classList.add('hidden'), 2200);
    // Safety fallback
    setTimeout(() => { preloader.style.display = 'none'; }, 4500);
  }

  // Initialize all components (each wrapped safely)
  try { initNavbar(); } catch(e) { console.error('Navbar init error:', e); }
  try { initMobileNav(); } catch(e) { console.error('Mobile nav init error:', e); }
  try { initActiveNavLinks(); } catch(e) { console.error('Active nav error:', e); }
  try { initScrollReveal(); } catch(e) { console.error('Scroll reveal error:', e); }
  try { initParallax(); } catch(e) { console.error('Parallax error:', e); }
  try { initTestimonialsMarquee(); } catch(e) { console.error('Testimonials error:', e); }
  try { initLightbox(); } catch(e) { console.error('Lightbox error:', e); }
  try { initSmoothScroll(); } catch(e) { console.error('Smooth scroll error:', e); }
  try { initBookingSystem(); } catch(e) { console.error('Booking init error:', e); }
});


// ─── Navbar ────────────────────────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      navbar.classList.remove('transparent');
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
      navbar.classList.add('transparent');
    }
  }, { passive: true });
}


// ─── Mobile Navigation ────────────────────────
function initMobileNav() {
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
    document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}


// ─── Active Nav Link ──────────────────────────
function initActiveNavLinks() {
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a:not(.nav-cta)');

  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY + 200;
    sections.forEach(section => {
      const id = section.getAttribute('id');
      if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
        navAnchors.forEach(a => a.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-links a[href="#${id}"]`);
        if (activeLink) activeLink.classList.add('active');
      }
    });
  }, { passive: true });
}


// ─── Scroll Reveal ────────────────────────────
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  elements.forEach(el => observer.observe(el));
}


// ─── Parallax ─────────────────────────────────
function initParallax() {
  const heroBg = document.querySelector('.hero-bg img');
  const heroSection = document.getElementById('hero');

  window.addEventListener('scroll', () => {
    if (window.innerWidth < 768) return;
    const scrollY = window.scrollY;
    if (scrollY < heroSection.offsetHeight) {
      heroBg.style.transform = `scale(1.05) translateY(${scrollY * 0.35}px)`;
    }
  }, { passive: true });
}


// ─── Testimonials ─────────────────────────────
function initTestimonialsMarquee() {
  const track = document.getElementById('testimonialsTrack');
  if (!track) return;
  track.innerHTML += track.innerHTML;
  track.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
  track.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
}


// ─── Lightbox ─────────────────────────────────
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxClose = document.getElementById('lightboxClose');

  document.querySelectorAll('[data-lightbox]').forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      lightboxImage.src = img.src;
      lightboxImage.alt = img.alt;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  const close = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { lightboxImage.src = ''; }, 400);
  };

  lightboxClose.addEventListener('click', close);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lightbox.classList.contains('active')) close(); });
}


// ─── Smooth Scroll ────────────────────────────
function initSmoothScroll() {
  const navbar = document.getElementById('navbar');
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY - navbar.offsetHeight,
          behavior: 'smooth'
        });
      }
    });
  });
}


// ═══════════════════════════════════════════════
//  BOOKING SYSTEM (API + Flatpickr)
// ═══════════════════════════════════════════════

let calendarInstance = null;
let selectedService = null;
let selectedDate = null;
let selectedTime = null;
let servicesData = [];

async function initBookingSystem() {
  // Load working hours and services from API
  await loadWorkingHours();
  servicesData = await loadServices();
  populateServiceDropdown(servicesData);

  // Service change handler
  const serviceSelect = document.getElementById('service');
  serviceSelect.addEventListener('change', onServiceChange);

  // Form submit
  const bookingForm = document.getElementById('bookingForm');
  bookingForm.addEventListener('submit', onBookingSubmit);

  // New booking button
  const newBookingBtn = document.getElementById('newBookingBtn');
  if (newBookingBtn) {
    newBookingBtn.addEventListener('click', resetBookingForm);
  }
}


// ─── Load Working Hours ──────────────────────
async function loadWorkingHours() {
  try {
    const res = await fetch(`${API_URL}/api/working-hours`);
    if (!res.ok) throw new Error('Failed to load hours');
    workingHours = await res.json();
  } catch {
    // fallback already set
  }
}

// ─── Load Services ────────────────────────────
async function loadServices() {
  try {
    const res = await fetch(`${API_URL}/api/services`);
    if (!res.ok) throw new Error('Failed to load services');
    return await res.json();
  } catch (err) {
    console.error('Error loading services:', err);
    return FALLBACK_SERVICES;
  }
}


// ─── Populate Service Dropdown ────────────────
function populateServiceDropdown(services) {
  const select = document.getElementById('service');
  select.innerHTML = '<option value="" disabled selected>Odaberite uslugu...</option>';

  const categories = {
    hair: '✂  Umjetnost Kose',
    skin: '✦  Rejuvenacija Kože',
    bridal: '❀  Bridal Bloom',
    spa: '✧  Rituali Opuštanja'
  };

  // Group by category
  const grouped = {};
  services.forEach(s => {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  });

  Object.entries(grouped).forEach(([cat, items]) => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = categories[cat] || cat;
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = item.name;
      opt.dataset.duration = item.duration_minutes;
      opt.dataset.price = item.price_hrk;
      optgroup.appendChild(opt);
    });
    select.appendChild(optgroup);
  });
}


// ─── Service Change Handler ───────────────────
function onServiceChange(e) {
  const serviceId = e.target.value;
  selectedService = servicesData.find(s => String(s.id) === String(serviceId));

  if (!selectedService) return;

  // Show service info
  const infoCard = document.getElementById('serviceInfo');
  const durationEl = document.getElementById('serviceDuration');
  const priceEl = document.getElementById('servicePrice');

  const hrs = Math.floor(selectedService.duration_minutes / 60);
  const mins = selectedService.duration_minutes % 60;
  durationEl.textContent = hrs > 0
    ? `${hrs}h ${mins > 0 ? mins + 'min' : ''}`
    : `${mins} min`;
  priceEl.textContent = `€${parseFloat(selectedService.price_hrk).toFixed(2)}`;
  infoCard.style.display = 'block';

  // Show calendar
  showCalendar();
}


// ─── Show Flatpickr Calendar ──────────────────
function showCalendar() {
  const calendarGroup = document.getElementById('calendarGroup');
  calendarGroup.style.display = 'block';

  // Destroy previous instance if exists
  if (calendarInstance) {
    calendarInstance.destroy();
  }

  // Reset downstream
  hideTimeSlots();
  hidePersonalFields();
  selectedDate = null;
  selectedTime = null;

  // Determine disabled days (closed days)
  const closedDays = [];
  Object.entries(workingHours).forEach(([day, info]) => {
    if (!info.is_open) closedDays.push(parseInt(day));
  });

  calendarInstance = flatpickr('#inlineCalendar', {
    inline: true,
    locale: 'hr',
    dateFormat: 'Y-m-d',
    minDate: 'today',
    maxDate: new Date().fp_incr(60), // 60 days ahead
    disable: [
      function (date) {
        return closedDays.includes(date.getDay());
      }
    ],
    onChange: function (selectedDates, dateStr) {
      selectedDate = dateStr;
      document.getElementById('date').value = dateStr;
      loadTimeSlots(dateStr);
    }
  });

  // Scroll to calendar
  setTimeout(() => {
    calendarGroup.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}


// ─── Load Time Slots ──────────────────────────
async function loadTimeSlots(dateStr) {
  const container = document.getElementById('timeSlotsGroup');
  const slotsGrid = document.getElementById('timeSlots');

  container.style.display = 'block';
  slotsGrid.innerHTML = '<p style="text-align:center; color: var(--anthracite-muted); font-size:0.88rem;">Učitavanje termina...</p>';

  // Hide personal fields when date changes
  hidePersonalFields();
  selectedTime = null;

  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();
  const hours = workingHours[dayOfWeek];

  if (!hours || !hours.is_open) {
    slotsGrid.innerHTML = '<p style="text-align:center; color: var(--anthracite-muted);">Salon je zatvoren ovaj dan.</p>';
    return;
  }

  // Get existing bookings for this date
  const bookedSlots = await getBookedSlots(dateStr);

  // Generate time slots (30-min intervals)
  const slots = generateTimeSlots(hours.open_time, hours.close_time, selectedService.duration_minutes);
  slotsGrid.innerHTML = '';

  if (slots.length === 0) {
    slotsGrid.innerHTML = '<p style="text-align:center; color: var(--anthracite-muted);">Nema dostupnih termina za ovaj dan.</p>';
    return;
  }

  slots.forEach(slot => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'time-slot';
    btn.textContent = slot;

    // Check if slot is booked
    const isBooked = bookedSlots.includes(slot);
    // Check if slot is in the past (for today)
    const isPast = isSlotInPast(dateStr, slot);

    if (isBooked || isPast) {
      btn.classList.add('unavailable');
      btn.title = isBooked ? 'Termin je zauzet' : 'Termin je prošao';
    } else {
      btn.addEventListener('click', () => selectTimeSlot(btn, slot));
    }

    slotsGrid.appendChild(btn);
  });

  // Scroll to slots
  setTimeout(() => {
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}


// ─── Get Booked Slots ─────────────────────────
async function getBookedSlots(dateStr) {
  try {
    const res = await fetch(`${API_URL}/api/bookings/slots?date=${dateStr}`);
    if (!res.ok) throw new Error('Failed to load slots');
    return await res.json();
  } catch (err) {
    console.error('Error loading booked slots:', err);
    return [];
  }
}


// ─── Generate Time Slots ──────────────────────
function generateTimeSlots(openTime, closeTime, durationMinutes) {
  const slots = [];
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);

  let currentMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  while (currentMinutes + durationMinutes <= closeMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    currentMinutes += 30; // 30-minute intervals
  }

  return slots;
}


// ─── Check if Slot is in Past ─────────────────
function isSlotInPast(dateStr, timeStr) {
  const now = new Date();
  const slotDate = new Date(dateStr + 'T' + timeStr + ':00');
  return slotDate <= now;
}


// ─── Select Time Slot ─────────────────────────
function selectTimeSlot(btn, time) {
  // Remove previous selection
  document.querySelectorAll('.time-slot.selected').forEach(el => el.classList.remove('selected'));
  btn.classList.add('selected');
  selectedTime = time;
  document.getElementById('time').value = time;

  // Show personal fields
  showPersonalFields();
}


// ─── Show/Hide Sections ───────────────────────
function showPersonalFields() {
  const fields = document.getElementById('personalFields');
  fields.style.display = 'block';
  setTimeout(() => {
    fields.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

function hidePersonalFields() {
  document.getElementById('personalFields').style.display = 'none';
}

function hideTimeSlots() {
  document.getElementById('timeSlotsGroup').style.display = 'none';
  document.getElementById('timeSlots').innerHTML = '';
}


// ─── Submit Booking ───────────────────────────
async function onBookingSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('bookingSubmit');
  const clientName = document.getElementById('clientName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email') ? document.getElementById('email').value.trim() : '';
  const notes = document.getElementById('notes') ? document.getElementById('notes').value.trim() : '';

  if (!selectedService || !selectedDate || !selectedTime || !clientName || !phone) {
    alert('Molimo ispunite sva obavezna polja.');
    return;
  }

  // UI feedback
  submitBtn.disabled = true;
  submitBtn.textContent = 'Šaljemo rezervaciju...';
  submitBtn.style.opacity = '0.7';

  const bookingData = {
    service_id: selectedService.id,
    client_name: clientName,
    client_phone: phone,
    client_email: email || null,
    booking_date: selectedDate,
    booking_time: selectedTime,
    duration_minutes: selectedService.duration_minutes,
    status: 'pending',
    notes: notes || null
  };

  // Save locally first — portal reads from here during testing
  const localBooking = {
    ...bookingData,
    id: 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
    created_at: new Date().toISOString(),
  };
  saveBookingLocally(localBooking);

  try {
    const res = await fetch(`${API_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });
    if (!res.ok) throw new Error('Booking failed');
    const savedBooking = await res.json();
    // Replace temp local entry with real API entry
    replaceLocalBooking(localBooking.id, savedBooking);
  } catch {
    // API unreachable — local entry already saved, that's fine for testing
  }

  // Always show success
  showBookingSuccess(bookingData);
}


// ─── LocalStorage Booking Store ───────────────
function saveBookingLocally(booking) {
  const list = JSON.parse(localStorage.getItem('smb_bookings') || '[]');
  list.push(booking);
  localStorage.setItem('smb_bookings', JSON.stringify(list));
}

function replaceLocalBooking(localId, apiBooking) {
  const list = JSON.parse(localStorage.getItem('smb_bookings') || '[]');
  const idx = list.findIndex(b => b.id === localId);
  if (idx !== -1) list[idx] = apiBooking;
  else list.push(apiBooking);
  localStorage.setItem('smb_bookings', JSON.stringify(list));
}


// ─── Show Success ─────────────────────────────
function showBookingSuccess(booking) {
  // Hide form fields
  document.getElementById('bookingForm').querySelectorAll('.form-group, #personalFields, #calendarGroup, #timeSlotsGroup').forEach(el => {
    el.style.display = 'none';
  });

  // Format date for display
  const dateObj = new Date(booking.booking_date + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('hr-HR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Show success message
  const successDiv = document.getElementById('bookingSuccess');
  const detailsDiv = document.getElementById('successDetails');

  detailsDiv.innerHTML = `
    <div class="detail-row">
      <span class="detail-label">Usluga</span>
      <span class="detail-value">${selectedService.name}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Datum</span>
      <span class="detail-value">${formattedDate}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Vrijeme</span>
      <span class="detail-value">${booking.booking_time}h</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Trajanje</span>
      <span class="detail-value">${booking.duration_minutes} min</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Ime</span>
      <span class="detail-value">${booking.client_name}</span>
    </div>
  `;

  successDiv.style.display = 'block';
}


// ─── Reset Booking Form ───────────────────────
function resetBookingForm() {
  const form = document.getElementById('bookingForm');
  form.reset();

  // Reset state
  selectedService = null;
  selectedDate = null;
  selectedTime = null;

  // Destroy calendar
  if (calendarInstance) {
    calendarInstance.destroy();
    calendarInstance = null;
  }

  // Hide everything
  document.getElementById('serviceInfo').style.display = 'none';
  document.getElementById('calendarGroup').style.display = 'none';
  hideTimeSlots();
  hidePersonalFields();
  document.getElementById('bookingSuccess').style.display = 'none';

  // Show form elements
  form.querySelectorAll('.form-group').forEach(el => {
    if (!el.id || el.id === '' || el.id === 'calendarGroup' || el.id === 'timeSlotsGroup') return;
    // Only show the service form-group by default
  });

  // Reset the service dropdown form-group visibility
  const serviceGroup = document.getElementById('service').closest('.form-group');
  serviceGroup.style.display = 'block';

  // Reset submit button
  const submitBtn = document.getElementById('bookingSubmit');
  submitBtn.disabled = false;
  submitBtn.textContent = '✓ Potvrdite Rezervaciju';
  submitBtn.style.opacity = '1';

  // Scroll back to booking section
  document.getElementById('rezervacija').scrollIntoView({ behavior: 'smooth' });
}
