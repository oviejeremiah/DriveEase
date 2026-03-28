require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { body, param, validationResult } = require('express-validator');
const db = require('./database');
const { router: authRouter, authenticateToken, requireAdmin } = require('./auth');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ──────────────────────────────────────────────────────

// Helmet sets secure HTTP headers automatically
app.use(helmet());

// CORS — only allow our frontend to talk to this API
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse incoming JSON request bodies
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent abuse

// ─── Helper: validate request ─────────────────────────────────────────────────

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
};

// ─── Helper: calculate total price ───────────────────────────────────────────

const calculateTotalPrice = (pricePerDay, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return days * pricePerDay;
};

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({ message: 'DriveEase API is running', version: '1.0.0' });
});

// ─── Auth Routes ──────────────────────────────────────────────────────────────

app.use('/api/auth', authRouter);

// ─── CAR Routes ───────────────────────────────────────────────────────────────

// GET all cars (with optional filters)
app.get('/api/cars', (req, res) => {
  const { type, available, minPrice, maxPrice } = req.query;

  let query = 'SELECT * FROM cars WHERE 1=1';
  const params = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (available !== undefined) {
    query += ' AND available = ?';
    params.push(available === 'true' ? 1 : 0);
  }
  if (minPrice) {
    query += ' AND price_per_day >= ?';
    params.push(parseFloat(minPrice));
  }
  if (maxPrice) {
    query += ' AND price_per_day <= ?';
    params.push(parseFloat(maxPrice));
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching cars:', err.message);
      return res.status(500).json({ error: 'Failed to fetch cars' });
    }
    res.json({ cars: rows, total: rows.length });
  });
});

// GET single car by ID
app.get('/api/cars/:id', [
  param('id').isInt({ min: 1 }).withMessage('Invalid car ID'),
], (req, res) => {
  if (!validate(req, res)) return;

  const carId = parseInt(req.params.id);

  db.get('SELECT * FROM cars WHERE id = ?', [carId], (err, car) => {
    if (err) {
      console.error('Error fetching car:', err.message);
      return res.status(500).json({ error: 'Failed to fetch car' });
    }
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    res.json(car);
  });
});

// GET reviews for a specific car
app.get('/api/cars/:id/reviews', [
  param('id').isInt({ min: 1 }).withMessage('Invalid car ID'),
], (req, res) => {
  if (!validate(req, res)) return;

  const carId = parseInt(req.params.id);

  db.all(`
    SELECT r.id, r.rating, r.comment, r.created_at,
           u.username
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.car_id = ?
    ORDER BY r.created_at DESC
  `, [carId], (err, rows) => {
    if (err) {
      console.error('Error fetching reviews:', err.message);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }
    res.json({ reviews: rows, total: rows.length });
  });
});

// ─── BOOKING Routes (protected) ───────────────────────────────────────────────

// POST create a booking
app.post('/api/bookings', authenticateToken, [
  body('car_id').isInt({ min: 1 }).withMessage('Invalid car ID'),
  body('start_date')
    .isDate().withMessage('Invalid start date')
    .custom((value) => {
      if (new Date(value) < new Date()) throw new Error('Start date cannot be in the past');
      return true;
    }),
  body('end_date')
    .isDate().withMessage('Invalid end date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_date))
        throw new Error('End date must be after start date');
      return true;
    }),
], (req, res) => {
  if (!validate(req, res)) return;

  const { car_id, start_date, end_date } = req.body;
  const userId = req.user.id;

  // Check car exists and is available
  db.get('SELECT * FROM cars WHERE id = ? AND available = 1', [car_id], (err, car) => {
    if (err) {
      console.error('Error checking car:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!car) {
      return res.status(400).json({ error: 'Car is not available for booking' });
    }

    const totalPrice = calculateTotalPrice(car.price_per_day, start_date, end_date);

    // Use a transaction — both operations must succeed or both fail
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      db.run(
        `INSERT INTO bookings (user_id, car_id, start_date, end_date, total_price, status)
         VALUES (?, ?, ?, ?, ?, 'confirmed')`,
        [userId, car_id, start_date, end_date, totalPrice],
        function (err) {
          if (err) {
            db.run('ROLLBACK');
            console.error('Error creating booking:', err.message);
            return res.status(500).json({ error: 'Failed to create booking' });
          }

          const bookingId = this.lastID;

          db.run('UPDATE cars SET available = 0 WHERE id = ?', [car_id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              console.error('Error updating car availability:', err.message);
              return res.status(500).json({ error: 'Failed to update car availability' });
            }

            db.run('COMMIT');
            res.status(201).json({
              message: 'Booking confirmed successfully',
              booking: { id: bookingId, car_id, start_date, end_date, total_price: totalPrice, status: 'confirmed' },
            });
          });
        }
      );
    });
  });
});

// GET current user's bookings
app.get('/api/bookings/my', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(`
    SELECT b.id, b.start_date, b.end_date, b.total_price, b.status, b.created_at,
           c.make, c.model, c.year, c.image, c.type
    FROM bookings b
    JOIN cars c ON b.car_id = c.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `, [userId], (err, rows) => {
    if (err) {
      console.error('Error fetching bookings:', err.message);
      return res.status(500).json({ error: 'Failed to fetch bookings' });
    }
    res.json({ bookings: rows });
  });
});

// ─── REVIEW Routes (protected) ────────────────────────────────────────────────

// POST submit a review
app.post('/api/reviews', authenticateToken, [
  body('car_id').isInt({ min: 1 }).withMessage('Invalid car ID'),
  body('booking_id').isInt({ min: 1 }).withMessage('Invalid booking ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment too long'),
], (req, res) => {
  if (!validate(req, res)) return;

  const { car_id, booking_id, rating, comment } = req.body;
  const userId = req.user.id;

  // Verify the booking belongs to this user
  db.get(
    'SELECT id FROM bookings WHERE id = ? AND user_id = ? AND status = ?',
    [booking_id, userId, 'confirmed'],
    (err, booking) => {
      if (err) {
        console.error('Error verifying booking:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      if (!booking) {
        return res.status(403).json({ error: 'You can only review cars you have booked' });
      }

      db.run(
        `INSERT INTO reviews (user_id, car_id, booking_id, rating, comment)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, car_id, booking_id, rating, comment || null],
        function (err) {
          if (err) {
            if (err.message.includes('UNIQUE')) {
              return res.status(409).json({ error: 'You have already reviewed this booking' });
            }
            console.error('Error creating review:', err.message);
            return res.status(500).json({ error: 'Failed to submit review' });
          }
          res.status(201).json({ message: 'Review submitted successfully', id: this.lastID });
        }
      );
    }
  );
});

// ─── ADMIN Routes (protected + admin only) ────────────────────────────────────

// GET all users
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  db.all(
    'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC',
    [],
    (err, rows) => {
      if (err) {
        console.error('Error fetching users:', err.message);
        return res.status(500).json({ error: 'Failed to fetch users' });
      }
      res.json({ users: rows, total: rows.length });
    }
  );
});

// GET all bookings
app.get('/api/admin/bookings', authenticateToken, requireAdmin, (req, res) => {
  db.all(`
    SELECT b.id, b.start_date, b.end_date, b.total_price, b.status, b.created_at,
           u.username, u.email,
           c.make, c.model, c.year
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN cars c ON b.car_id = c.id
    ORDER BY b.created_at DESC
  `, [], (err, rows) => {
    if (err) {
      console.error('Error fetching all bookings:', err.message);
      return res.status(500).json({ error: 'Failed to fetch bookings' });
    }
    res.json({ bookings: rows, total: rows.length });
  });
});

// POST add a new car (admin only)
app.post('/api/admin/cars', authenticateToken, requireAdmin, [
  body('make').trim().notEmpty().withMessage('Make is required'),
  body('model').trim().notEmpty().withMessage('Model is required'),
  body('year').isInt({ min: 2000, max: 2030 }).withMessage('Invalid year'),
  body('type').trim().notEmpty().withMessage('Type is required'),
  body('price_per_day').isFloat({ min: 1 }).withMessage('Price must be greater than 0'),
  body('seats').isInt({ min: 1, max: 10 }).withMessage('Invalid seat count'),
  body('transmission').isIn(['Automatic', 'Manual']).withMessage('Invalid transmission'),
  body('fuel_type').isIn(['Petrol', 'Diesel', 'Electric', 'Hybrid']).withMessage('Invalid fuel type'),
], (req, res) => {
  if (!validate(req, res)) return;

  const { make, model, year, type, price_per_day, image, description, seats, transmission, fuel_type } = req.body;

  db.run(
    `INSERT INTO cars (make, model, year, type, price_per_day, image, description, seats, transmission, fuel_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [make, model, year, type, price_per_day, image || null, description || null, seats, transmission, fuel_type],
    function (err) {
      if (err) {
        console.error('Error adding car:', err.message);
        return res.status(500).json({ error: 'Failed to add car' });
      }
      res.status(201).json({ message: 'Car added successfully', id: this.lastID });
    }
  );
});

// DELETE a car (admin only)
app.delete('/api/admin/cars/:id', authenticateToken, requireAdmin, [
  param('id').isInt({ min: 1 }).withMessage('Invalid car ID'),
], (req, res) => {
  if (!validate(req, res)) return;

  const carId = parseInt(req.params.id);

  db.run('DELETE FROM cars WHERE id = ?', [carId], function (err) {
    if (err) {
      console.error('Error deleting car:', err.message);
      return res.status(500).json({ error: 'Failed to delete car' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }
    res.json({ message: 'Car deleted successfully' });
  });
});

// ─── 404 handler ──────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`DriveEase API running on http://localhost:${PORT}`);
});