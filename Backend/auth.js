require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const db = require('./database');

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 12;

// ─── Validation rules ────────────────────────────────────────────────────────

const registerRules = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .isAlphanumeric()
    .withMessage('Username must contain only letters and numbers'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
];

const loginRules = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// ─── Helper: check validation results ────────────────────────────────────────

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
};

// ─── Helper: generate JWT ─────────────────────────────────────────────────────

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────

router.post('/register', registerRules, async (req, res) => {
  if (!validate(req, res)) return;

  const { username, email, password } = req.body;

  try {
    // Check if username or email already exists
    db.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email],
      async (err, existing) => {
        if (err) {
          console.error('DB error on register check:', err.message);
          return res.status(500).json({ error: 'Database error' });
        }
        if (existing) {
          return res.status(409).json({ error: 'Username or email already in use' });
        }

        // Hash password securely
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Insert new user
        db.run(
          `INSERT INTO users (username, email, password, role)
           VALUES (?, ?, ?, 'user')`,
          [username, email, hashedPassword],
          function (err) {
            if (err) {
              console.error('DB error on register insert:', err.message);
              return res.status(500).json({ error: 'Failed to create account' });
            }

            const newUser = { id: this.lastID, username, email, role: 'user' };
            const token = generateToken(newUser);

            res.status(201).json({
              message: 'Account created successfully',
              token,
              user: { id: newUser.id, username, email, role: 'user' },
            });
          }
        );
      }
    );
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

router.post('/login', loginRules, (req, res) => {
  if (!validate(req, res)) return;

  const { username, password } = req.body;

  db.get(
    'SELECT id, username, email, password, role FROM users WHERE username = ?',
    [username],
    async (err, user) => {
      if (err) {
        console.error('DB error on login:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }

      // Use same error message for both "user not found" and "wrong password"
      // This prevents attackers from knowing which one failed (security best practice)
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const token = generateToken(user);

      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, username: user.username, email: user.email, role: user.role },
      });
    }
  );
});

// ─── Middleware: authenticate JWT token ───────────────────────────────────────

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expect: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access denied — no token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
};

// ─── Middleware: restrict to admin role only ──────────────────────────────────

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { router, authenticateToken, requireAdmin };