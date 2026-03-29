import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          Drive<span>Ease</span>
        </Link>

        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>

        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <li><Link to="/" onClick={() => setMenuOpen(false)}>Home</Link></li>
          <li><Link to="/cars" onClick={() => setMenuOpen(false)}>Browse Cars</Link></li>

          {user ? (
            <>
              <li><Link to="/my-bookings" onClick={() => setMenuOpen(false)}>My Bookings</Link></li>
              {isAdmin() && (
                <li><Link to="/admin" onClick={() => setMenuOpen(false)}>Admin</Link></li>
              )}
              <li><span className="nav-username">{user.username}</span></li>
              <li>
                <button className="btn btn-outline nav-btn" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link></li>
              <li>
                <Link to="/register" className="btn btn-primary nav-btn" onClick={() => setMenuOpen(false)}>
                  Get Started
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;