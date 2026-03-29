import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <h3>Drive<span>Ease</span></h3>
          <p>The premium car rental experience. Safe, secure and convenient for every journey.</p>
        </div>

        <div className="footer-links">
          <h4>Navigation</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/cars">Browse Cars</Link></li>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Get Started</Link></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h4>Contact Us</h4>
          <p>Email: ovie.a.jeremiah@gmail.com</p>
          <p>Tell: +447881169931</p>
          <p>Address: 11 Beckenham Road, Nottingham NG7 5NT.</p> 
          <p>United Kingdom</p>         
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} DriveEase. All rights reserved. Built by Jeremiah Abraham Ovie </p>
      </div>
    </footer>
  );
};

export default Footer;