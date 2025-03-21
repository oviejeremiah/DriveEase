const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./carRental.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    make TEXT,
    model TEXT,
    year INTEGER,
    type TEXT,
    pricePerDay REAL,
    available INTEGER,
    image TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT UNIQUE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    carId INTEGER,
    startDate TEXT,
    endDate TEXT,
    FOREIGN KEY(userId) REFERENCES users(id),
    FOREIGN KEY(carId) REFERENCES cars(id)
  )`);

     // Insert initial car data (optional, for development)
     const initialCars = [
       { make: 'Toyota', model: 'Camry', year: 2023, type: 'Sedan', pricePerDay: 50, available: 1, image: 'https://via.placeholder.com/300x200?text=Toyota+Camry' },
       { make: 'Honda', model: 'CR-V', year: 2022, type: 'SUV', pricePerDay: 65, available: 1, image: 'https://via.placeholder.com/300x200?text=Honda+CR-V' },
       { make: 'Tesla', model: 'Model 3', year: 2023, type: 'Electric', pricePerDay: 85, available: 0, image: 'https://via.placeholder.com/300x200?text=Tesla+Model+3' },
     ];

     const carInsertStmt = db.prepare(`INSERT INTO cars (make, model, year, type, pricePerDay, available, image) VALUES (?, ?, ?, ?, ?, ?, ?)`);
     initialCars.forEach(car => {
       carInsertStmt.run(car.make, car.model, car.year, car.type, car.pricePerDay, car.available, car.image);
     });
     carInsertStmt.finalize();
});

module.exports = db;