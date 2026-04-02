import React, { useEffect, useState } from 'react';
import { fetchMyBookings } from '../services/api';
import './MyBookings.css';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyBookings()
      .then(res => setBookings(res.data.bookings || []))
      .catch(() => setError('Failed to load bookings.'))
      .finally(() => setLoading(false));
  }, []);

  const calculateDays = (start, end) => {
    const diff = new Date(end) - new Date(start);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="bookings-page">
      <div className="page-header">
        <div className="container">
          <h1>My Bookings</h1>
          <p>View and manage all your car reservations</p>
        </div>
      </div>

      <div className="container bookings-content">

        {error && <div className="alert alert-error">{error}</div>}

        {bookings.length === 0 ? (
          <div className="no-bookings">
            <h2>No bookings yet</h2>
            <p>You have not made any reservations. Start browsing our fleet!</p>
            <a href="/cars" className="btn btn-primary">Browse Cars</a>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking, index) => (
              <div key={booking.id || index} className="booking-card">

                {/* ─── Image Section ─── */}
                <div className="booking-car-image">
                  <img
                    src={booking.image || "/placeholder-car.jpg"}
                    alt={`${booking.make} ${booking.model}`}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = "/placeholder-car.jpg";
                    }}
                  />

                  {/* Status Badge */}
                  <span className={`status-badge ${booking.status}`}>
                    {booking.status}
                  </span>
                </div>

                {/* ─── Details Section ─── */}
                <div className="booking-details">

                  {/* Car Title */}
                  <h3 className="car-title">
                    {booking.make} {booking.model}
                    <span className="car-year"> {booking.year}</span>
                  </h3>

                  {/* Booking Type */}
                  <p className="booking-type">{booking.type}</p>

                  {/* Dates */}
                  <div className="booking-dates">
                    <span>
                      {new Date(booking.start_date).toLocaleDateString()}
                    </span>
                    <span className="date-separator">→</span>
                    <span>
                      {new Date(booking.end_date).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="booking-footer">
                    <span className="booking-duration">
                      {calculateDays(booking.start_date, booking.end_date)} day(s)
                    </span>

                    <span className="booking-price">
                      ${booking.total_price?.toFixed(2)}
                    </span>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;