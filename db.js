const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Auto-create tables on first connection
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS staff_users (
        id          SERIAL PRIMARY KEY,
        username    VARCHAR(100) UNIQUE NOT NULL,
        password    VARCHAR(255) NOT NULL,
        name        VARCHAR(200) NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS services (
        id                SERIAL PRIMARY KEY,
        name              VARCHAR(200) NOT NULL,
        category          VARCHAR(50) NOT NULL,
        duration_minutes  INT NOT NULL,
        price_hrk         NUMERIC(10,2) NOT NULL,
        active            BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS working_hours (
        day_of_week  INT PRIMARY KEY CHECK (day_of_week BETWEEN 0 AND 6),
        is_open      BOOLEAN NOT NULL DEFAULT FALSE,
        open_time    TIME,
        close_time   TIME
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id              SERIAL PRIMARY KEY,
        service_id      INT REFERENCES services(id),
        client_name     VARCHAR(200) NOT NULL,
        client_phone    VARCHAR(50) NOT NULL,
        client_email    VARCHAR(200),
        booking_date    DATE NOT NULL,
        booking_time    VARCHAR(5) NOT NULL,
        duration_minutes INT,
        status          VARCHAR(20) DEFAULT 'pending',
        notes           TEXT,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Database tables ready.');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
