import React, { useEffect, useState } from 'react';
import { fetchMyBookings } from '../services/api';
import './MyBookings.css';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyBookings()
      .then(res => setBookings(res.data.bookings))
      .catch(() => setError('Failed to load bookings.'))
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status) => {
    const map = {
      confirmed: 'badge-success',
      pending:   'badge-warning',
      cancelled: 'badge-danger',
    };
    return map[status] || 'badge-info';
  };

  const calculateDays = (start, end) => {
    const diff = new Date(end) - new Date(start);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) return <div className="spinner-wrapper"><div className="spinner" /></div>;

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
            <span className="no-bookings-icon"></span>
            <h2>No bookings yet</h2>
            <p>You haven't made any reservations. Start browsing our fleet!</p>
            <a href="/cars" className="btn btn-primary">Browse Cars</a>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map(booking => (
              <div key={booking.id} className="booking-card card">

                <div className="booking-car-image">
                  <img src={booking.image} alt={`${booking.make} ${booking.model}`} />
                </div>

                <div className="booking-details">
                  <div className="booking-header">
                    <h3>{booking.make} {booking.model} {booking.year}</h3>
                    <span className={`badge ${getStatusBadge(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>

                  <p className="booking-type">{booking.type}</p>

                  <div className="booking-dates">
                    <div className="date-item">
                      <span className="date-label">Pick-up</span>
                      <span className="date-value">
                        {new Date(booking.start_date).toLocaleDateString('en-US', {
                          weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="date-arrow">→</div>
                    <div className="date-item">
                      <span className="date-label">Return</span>
                      <span className="date-value">
                        {new Date(booking.end_date).toLocaleDateString('en-US', {
                          weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="booking-footer">
                    <div className="booking-duration">
                      {calculateDays(booking.start_date, booking.end_date)} day(s)
                    </div>
                    <div className="booking-total">
                      Total: <strong>${booking.total_price.toFixed(2)}</strong>
                    </div>
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