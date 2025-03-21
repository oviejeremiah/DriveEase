const express = require('express');
const cors = require('cors');
const { router: authRouter, authenticateToken } = require('./auth');
const db = require('./database'); // Import the database connection
const bcrypt = require('bcrypt'); // For password hashing
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Auth Routes
app.use('/api/auth', authRouter);

// Routes
app.get('/', (req, res) => {
  res.send('Secure Car Rental API');
});

// Helper function to get car availability
const getCarAvailability = (carId) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT available FROM cars WHERE id = ?', [carId], (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        resolve(row.available === 1); // Convert 0/1 to boolean
      } else {
        resolve(false); // Car not found, assume not available
      }
    });
  });
};

// Public API Endpoints
app.get('/api/cars', (req, res) => {
  const query = 'SELECT * FROM cars';
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch cars' });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/cars/:id', (req, res) => {
  const carId = parseInt(req.params.id);
  const query = 'SELECT * FROM cars WHERE id = ?';
  db.get(query, [carId], (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch car' });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Car not found' });
      return;
    }
    res.json(row);
  });
});

// Protected API Endpoints
app.post('/api/bookings', authenticateToken, async (req, res) => {
  const { carId, startDate, endDate } = req.body;
  const userId = req.user.id; // Get user ID from the authentication middleware

  // Basic input validation
  if (!carId || !startDate || !endDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if the car is available
  const isAvailable = await getCarAvailability(carId);
  if (!isAvailable) {
    return res.status(400).json({ error: 'Car is not available' });
  }

  // In a real application, you would also validate the date range
  // and check for overlapping bookings.

  // Start a database transaction
  db.serialize(async () => {
    db.run('BEGIN TRANSACTION');

    try {
      // 1. Create the booking
      const bookingQuery = `
        INSERT INTO bookings (userId, carId, startDate, endDate)
        VALUES (?, ?, ?, ?)
      `;
      await new Promise((resolve, reject) => {
        db.run(bookingQuery, [userId, carId, startDate, endDate], function (err) { // Use function keyword to access 'this'
          if (err) {
            db.run('ROLLBACK');
            reject(err);
          } else {
            resolve(this.lastID); // Resolve with the last inserted ID
          }
        });
      });

      // 2. Update car availability (set available to 0)
      const updateCarQuery = 'UPDATE cars SET available = 0 WHERE id = ?';
      await new Promise((resolve, reject) => {
        db.run(updateCarQuery, [carId], (err) => {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // If both operations were successful, commit the transaction
      db.run('COMMIT');
      res.status(201).json({ message: 'Booking created successfully' });
    } catch (error) {
      // If any error occurred, rollback the transaction
      db.run('ROLLBACK');
      console.error(error);
      res.status(500).json({ error: 'Failed to create booking: ' + error.message });
    }
  });
});

// Authentication Routes (Modified for database)
authRouter.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  // Check if username already exists
  const userExistsQuery = 'SELECT id FROM users WHERE username = ?';
  db.get(userExistsQuery, [username], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (row) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash the password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to hash password' });
      }

      // Insert the new user into the database
      const insertUserQuery = `
        INSERT INTO users (username, password, email)
        VALUES (?, ?, ?)
      `;
      db.run(insertUserQuery, [username, hashedPassword, email], function (err) { // Use function to access this
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Failed to register user' });
        }

        const newUser = { id: this.lastID, username, email };
        // Create token
        const token = jwt.sign(
          { id: newUser.id, username: newUser.username },
          JWT_SECRET,
          { expiresIn: '1h' }
        );

        res.status(201).json({ token, user: newUser });
      });
    });
  });
});

authRouter.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Find user by username
  const query = 'SELECT id, username, password, email FROM users WHERE username = ?';
  db.get(query, [username], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare the password
    bcrypt.compare(password, row.password, (err, isMatch) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to compare passwords' });
      }
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = { id: row.id, username: row.username, email: row.email };
      // Create token
      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({ token, user });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});