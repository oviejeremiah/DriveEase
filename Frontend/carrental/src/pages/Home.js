import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCars } from '../services/api';
import CarCard from '../components/CarCard';
import './Home.css';

const Home = () => {
  const [featuredCars, setFeaturedCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCars({ available: true })
      .then(res => setFeaturedCars(res.data.cars.slice(0, 3)))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home">

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="container hero-content">
          <h1>Find Your Perfect <span>Rental Car</span></h1>
          <p>Safe, secure and convenient car rentals for every journey. Browse hundreds of vehicles and book in minutes.</p>
          <div className="hero-actions">
            <Link to="/cars" className="btn btn-accent">Browse Cars</Link>
            <Link to="/register" className="btn btn-outline-white">Sign Up Free</Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="container stats-grid">
          <div className="stat-item">
            <h3>500+</h3>
            <p>Cars Available</p>
          </div>
          <div className="stat-item">
            <h3>10,000+</h3>
            <p>Happy Customers</p>
          </div>
          <div className="stat-item">
            <h3>50+</h3>
            <p>Cities Covered</p>
          </div>
          <div className="stat-item">
            <h3>24/7</h3>
            <p>Customer Support</p>
          </div>
        </div>
      </section>

      {/* Featured Cars */}
      <section className="featured-cars">
        <div className="container">
          <div className="section-header">
            <h2>Featured Cars</h2>
            <p>Hand-picked vehicles for the best driving experience</p>
          </div>

          {loading ? (
            <div className="spinner-wrapper"><div className="spinner" /></div>
          ) : (
            <div className="cars-grid">
              {featuredCars.map(car => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}

          <div className="view-all">
            <Link to="/cars" className="btn btn-primary">View All Cars</Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="why-us">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose DriveEase?</h2>
            <p>We put your safety and comfort first</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">🔒</span>
              <h3>Secure Booking</h3>
              <p>Your data and payments are protected with bank-grade security and encryption.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🚗</span>
              <h3>Wide Selection</h3>
              <p>Choose from sedans, SUVs, electric vehicles and luxury cars to suit any need.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">💰</span>
              <h3>Best Prices</h3>
              <p>Transparent pricing with no hidden fees. What you see is what you pay.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📞</span>
              <h3>24/7 Support</h3>
              <p>Our team is always available to help you before, during and after your rental.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container cta-content">
          <h2>Ready to Hit the Road?</h2>
          <p>Create a free account and book your first car in under 2 minutes.</p>
          <Link to="/register" className="btn btn-accent">Get Started Today</Link>
        </div>
      </section>

    </div>
  );
};

export default Home;