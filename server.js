const express = require('express');
const cors    = require('cors');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const { pool, initDB } = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'smbloom-dev-secret-change-me';

app.use(cors());
app.use(express.json());

// ─── Auth middleware ─────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Niste prijavljeni.' });
  }
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Sesija je istekla. Prijavite se ponovo.' });
  }
}

// ─── POST /api/auth/login ────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Unesite korisničko ime i lozinku.' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM staff_users WHERE username = $1', [username]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Pogrešno korisničko ime ili lozinka.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { username: user.username, name: user.name },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Greška na serveru.' });
  }
});

// ─── GET /api/services ───────────────────────────
app.get('/api/services', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id::text, name, category, duration_minutes, price_hrk FROM services WHERE active = TRUE ORDER BY id'
    );
    res.json(rows);
  } catch (err) {
    console.error('Services error:', err);
    res.status(500).json({ message: 'Greška na serveru.' });
  }
});

// ─── GET /api/working-hours ──────────────────────
app.get('/api/working-hours', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM working_hours ORDER BY day_of_week');
    const map = {};
    rows.forEach(r => {
      map[r.day_of_week] = {
        is_open:    r.is_open,
        open_time:  r.open_time ? r.open_time.slice(0, 5) : null,
        close_time: r.close_time ? r.close_time.slice(0, 5) : null,
      };
    });
    res.json(map);
  } catch (err) {
    console.error('Working hours error:', err);
    res.status(500).json({ message: 'Greška na serveru.' });
  }
});

// ─── GET /api/bookings/slots?date=YYYY-MM-DD ────
app.get('/api/bookings/slots', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: 'Datum je obavezan.' });

  try {
    const { rows } = await pool.query(
      `SELECT booking_time FROM bookings
       WHERE booking_date = $1 AND status IN ('pending', 'confirmed')`,
      [date]
    );
    res.json(rows.map(r => r.booking_time));
  } catch (err) {
    console.error('Slots error:', err);
    res.status(500).json({ message: 'Greška na serveru.' });
  }
});

// ─── POST /api/bookings (public) ─────────────────
app.post('/api/bookings', async (req, res) => {
  const { service_id, client_name, client_phone, client_email, booking_date, booking_time, duration_minutes, notes } = req.body;

  if (!service_id || !client_name || !client_phone || !booking_date || !booking_time) {
    return res.status(400).json({ message: 'Sva obavezna polja moraju biti ispunjena.' });
  }

  try {
    // Check for double booking
    const { rows: existing } = await pool.query(
      `SELECT id FROM bookings
       WHERE booking_date = $1 AND booking_time = $2 AND status IN ('pending', 'confirmed')`,
      [booking_date, booking_time]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Termin je već zauzet.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO bookings (service_id, client_name, client_phone, client_email, booking_date, booking_time, duration_minutes, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
       RETURNING id::text, service_id::text, client_name, client_phone, client_email, booking_date::text, booking_time, duration_minutes, status, notes, created_at`,
      [service_id, client_name, client_phone, client_email || null, booking_date, booking_time, duration_minutes || null, notes || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ message: 'Greška na serveru.' });
  }
});

// ─── GET /api/staff/bookings (auth required) ─────
app.get('/api/staff/bookings', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id::text, service_id::text, client_name, client_phone, client_email, booking_date::text, booking_time, duration_minutes, status, notes, created_at
       FROM bookings ORDER BY booking_date DESC, booking_time DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Staff bookings error:', err);
    res.status(500).json({ message: 'Greška na serveru.' });
  }
});

// ─── PATCH /api/staff/bookings/:id/status (auth) ─
app.patch('/api/staff/bookings/:id/status', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const valid = ['pending', 'confirmed', 'cancelled', 'completed'];

  if (!valid.includes(status)) {
    return res.status(400).json({ message: 'Nevažeći status.' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE bookings SET status = $1 WHERE id = $2
       RETURNING id::text, service_id::text, client_name, client_phone, client_email, booking_date::text, booking_time, duration_minutes, status, notes, created_at`,
      [status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Rezervacija nije pronađena.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ message: 'Greška na serveru.' });
  }
});

// ─── Health check ────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─── Start ───────────────────────────────────────
async function start() {
  await initDB();

  // Auto-seed if no staff users exist
  const { rows } = await pool.query('SELECT COUNT(*) FROM staff_users');
  if (parseInt(rows[0].count) === 0) {
    console.log('No staff users found — running seed...');
    require('./seed');
  }

  app.listen(PORT, () => console.log(`API running on port ${PORT}`));
}

start().catch(err => { console.error('Startup error:', err); process.exit(1); });
