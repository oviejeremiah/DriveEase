import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <h3>🚗 DriveEase</h3>
          <p>Safe, secure and convenient car rentals for every journey.</p>
        </div>

        <div className="footer-links">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/cars">Browse Cars</Link></li>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Sign Up</Link></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h4>Contact</h4>
          <p>📧 support@driveease.com</p>
          <p>📞 +1 (800) 123-4567</p>
          <p>📍 123 Drive Street, Auto City</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} DriveEase. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;