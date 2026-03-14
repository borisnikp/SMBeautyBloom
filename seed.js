const bcrypt = require('bcryptjs');
const { pool, initDB } = require('./db');

async function seed(options = {}) {
  if (!options.skipInit) await initDB();

  // Seed admin user (change password via ADMIN_PASSWORD env var)
  const password = process.env.ADMIN_PASSWORD || 'bloom2026';
  const hash = await bcrypt.hash(password, 12);

  await pool.query(`
    INSERT INTO staff_users (username, password, name)
    VALUES ('admin', $1, 'Admin')
    ON CONFLICT (username) DO UPDATE SET password = $1
  `, [hash]);
  console.log(`Admin user seeded (password: ${password})`);

  // Seed services
  const services = [
    ['Šišanje & Oblikovanje',  'hair',   45,  35.00],
    ['Bojanje Kose',           'hair',   120, 85.00],
    ['Balayage / Ombré',       'hair',   150, 120.00],
    ['Dubinska Njega Kose',    'hair',   60,  50.00],
    ['Tretman Lica — Classic', 'skin',   60,  55.00],
    ['Tretman Lica — Premium', 'skin',   90,  95.00],
    ['Profesionalni Piling',   'skin',   45,  65.00],
    ['Bridal Bloom — Proba',   'bridal', 120, 100.00],
    ['Bridal Bloom — Paket',   'bridal', 240, 250.00],
    ['Masaža Opuštanja',       'spa',    60,  45.00],
    ['Aromaterapija',          'spa',    75,  60.00],
    ['Spa Ceremonija',         'spa',    120, 120.00],
  ];

  for (const [name, category, duration, price] of services) {
    await pool.query(`
      INSERT INTO services (name, category, duration_minutes, price_hrk)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
    `, [name, category, duration, price]);
  }
  console.log(`${services.length} services seeded.`);

  // Seed working hours
  const hours = [
    [0, false, null, null],        // Sunday
    [1, true, '09:00', '20:00'],   // Monday
    [2, true, '09:00', '20:00'],
    [3, true, '09:00', '20:00'],
    [4, true, '09:00', '20:00'],
    [5, true, '09:00', '20:00'],   // Friday
    [6, true, '09:00', '16:00'],   // Saturday
  ];

  for (const [day, isOpen, open, close] of hours) {
    await pool.query(`
      INSERT INTO working_hours (day_of_week, is_open, open_time, close_time)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (day_of_week) DO UPDATE SET is_open = $2, open_time = $3, close_time = $4
    `, [day, isOpen, open, close]);
  }
  console.log('Working hours seeded.');
}

module.exports = seed;

// Run directly with: node seed.js
if (require.main === module) {
  seed().then(() => {
    console.log('Seed complete.');
    return pool.end();
  }).catch(err => { console.error(err); process.exit(1); });
}
