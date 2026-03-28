require('dotenv').config();
const sqlite3 = require('sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'carRental.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database.');
});

// Enable foreign keys and WAL mode for better performance and integrity
db.run('PRAGMA foreign_keys = ON');
db.run('PRAGMA journal_mode = WAL');

db.serialize(() => {

  // USERS table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    email         TEXT    NOT NULL UNIQUE,
    password      TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'user',
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  )`);

  // CARS table
  db.run(`CREATE TABLE IF NOT EXISTS cars (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    make          TEXT    NOT NULL,
    model         TEXT    NOT NULL,
    year          INTEGER NOT NULL,
    type          TEXT    NOT NULL,
    price_per_day REAL    NOT NULL,
    available     INTEGER NOT NULL DEFAULT 1,
    image         TEXT,
    description   TEXT,
    seats         INTEGER NOT NULL DEFAULT 5,
    transmission  TEXT    NOT NULL DEFAULT 'Automatic',
    fuel_type     TEXT    NOT NULL DEFAULT 'Petrol',
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  )`);

  // BOOKINGS table
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    car_id        INTEGER NOT NULL,
    start_date    TEXT    NOT NULL,
    end_date      TEXT    NOT NULL,
    total_price   REAL    NOT NULL,
    status        TEXT    NOT NULL DEFAULT 'pending',
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (car_id)  REFERENCES cars(id)  ON DELETE CASCADE
  )`);

  // PAYMENTS table
  db.run(`CREATE TABLE IF NOT EXISTS payments (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id    INTEGER NOT NULL UNIQUE,
    amount        REAL    NOT NULL,
    currency      TEXT    NOT NULL DEFAULT 'USD',
    status        TEXT    NOT NULL DEFAULT 'pending',
    stripe_id     TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
  )`);

  // REVIEWS table
  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    car_id        INTEGER NOT NULL,
    booking_id    INTEGER NOT NULL UNIQUE,
    rating        INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment       TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (car_id)     REFERENCES cars(id)     ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
  )`);

  // SEED initial cars only if the table is empty
  db.get('SELECT COUNT(*) as count FROM cars', [], (err, row) => {
    if (err || row.count > 0) return;

    const stmt = db.prepare(`
      INSERT INTO cars
        (make, model, year, type, price_per_day, available, image, description, seats, transmission, fuel_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const cars = [
      ['Toyota',     'Camry',   2023, 'Sedan',    50,  1, 'https://via.placeholder.com/400x250?text=Toyota+Camry',   'Comfortable and fuel-efficient sedan.',      5, 'Automatic', 'Petrol'],
      ['Honda',      'CR-V',    2022, 'SUV',       65,  1, 'https://via.placeholder.com/400x250?text=Honda+CRV',      'Spacious SUV perfect for family trips.',     5, 'Automatic', 'Petrol'],
      ['Tesla',      'Model 3', 2023, 'Electric',  85,  1, 'https://via.placeholder.com/400x250?text=Tesla+Model+3',  'Premium electric car with autopilot.',       5, 'Automatic', 'Electric'],
      ['BMW',        '3 Series',2022, 'Sedan',     95,  1, 'https://via.placeholder.com/400x250?text=BMW+3+Series',   'Luxury performance sedan.',                  5, 'Automatic', 'Petrol'],
      ['Ford',       'Explorer',2023, 'SUV',       75,  1, 'https://via.placeholder.com/400x250?text=Ford+Explorer',  'Bold SUV with advanced safety features.',    7, 'Automatic', 'Petrol'],
      ['Mercedes',   'C-Class', 2023, 'Sedan',    110,  1, 'https://via.placeholder.com/400x250?text=Mercedes+CClass','Elegant luxury sedan with premium interior.',5, 'Automatic', 'Petrol'],
    ];

    cars.forEach(car => stmt.run(car));
    stmt.finalize();
    console.log('Database seeded with initial cars.');
  });
});

module.exports = db;