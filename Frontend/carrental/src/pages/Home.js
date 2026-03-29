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

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="container hero-content">
          <div className="hero-eyebrow">
            Premium Car Rentals
          </div>
          <h1>
            <span className="line-white">Drive the Car</span><br />
            <span className="line-gold">You Deserve.</span>
          </h1>
          <p>
            Experience luxury, performance and freedom. Browse our handpicked fleet
            and book your perfect ride in minutes — no hidden fees, ever.
          </p>
          <div className="hero-actions">
            <Link to="/cars" className="btn btn-primary">Explore Fleet →</Link>
            <Link to="/register" className="btn btn-ghost">Create Free Account</Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <h4>500+</h4>
              <p>Premium Cars</p>
            </div>
            <div className="hero-stat">
              <h4>10K+</h4>
              <p>Happy Drivers</p>
            </div>
            <div className="hero-stat">
              <h4>50+</h4>
              <p>Cities</p>
            </div>
            <div className="hero-stat">
              <h4>24/7</h4>
              <p>Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cars */}
      <section className="featured-cars">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Our Fleet</span>
            <h2>Featured Vehicles</h2>
            <div className="gold-divider" />
            <p>Hand-picked vehicles for the ultimate driving experience</p>
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
            <Link to="/cars" className="btn btn-outline">View Full Fleet →</Link>
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="why-us">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Why DriveEase</span>
            <h2>Built Around You</h2>
            <div className="gold-divider" />
            <p>Every detail is designed for your comfort, safety, and peace of mind</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">01</span>
              <h3>Bank-Grade Security</h3>
              <p>Your data and payments are protected with military-grade encryption and secure authentication.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">02</span>
              <h3>Premium Fleet</h3>
              <p>Choose from sedans, SUVs, electric vehicles, supercars and luxury cars for any occasion.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">03</span>
              <h3>Transparent Pricing</h3>
              <p>No hidden fees, no surprises. What you see is exactly what you pay — guaranteed.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">04</span>
              <h3>Instant Booking</h3>
              <p>Book your car in under 2 minutes. Real-time availability with instant confirmation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container cta-content">
          <h2>Ready to Drive?</h2>
          <p>Join thousands of drivers who trust DriveEase for every journey.</p>
          <Link to="/register" className="btn btn-primary">Get Started — It's Free</Link>
        </div>
      </section>

    </div>
  );
};

export default Home;