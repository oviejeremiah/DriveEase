const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// In a real app, you'd store users in a database
const users = [
  {
    id: 1,
    username: 'user1',
    password: 'password1', // In production, this would be hashed
    email: 'user1@example.com'
  }
];

// Secret key for JWT
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// Login endpoint
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Find user
  const user = users.find(u => u.username === username);
  
  // Check if user exists and password matches
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Create token
  const token = jwt.sign(
    { id: user.id, username: user.username }, 
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
});

// Register endpoint
router.post('/register', (req, res) => {
  const { username, password, email } = req.body;
  
  // Check if username already exists
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  
  // Create new user
  const newUser = {
    id: users.length + 1,
    username,
    password, // In production, hash this password
    email
  };
  
  users.push(newUser);
  
  // Create token
  const token = jwt.sign(
    { id: newUser.id, username: newUser.username },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  res.status(201).json({ token, user: { id: newUser.id, username: newUser.username, email: newUser.email } });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

module.exports = { router, authenticateToken };