import React, { useEffect, useState } from 'react';
import { fetchMyBookings, submitReview } from '../services/api';
import './MyBookings.css';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewForms, setReviewForms] = useState({});
  const [reviewSuccess, setReviewSuccess] = useState({});
  const [reviewErrors, setReviewErrors] = useState({});
  const [reviewLoading, setReviewLoading] = useState({});

  useEffect(() => {
    fetchMyBookings()
      .then(res => setBookings(res.data.bookings))
      .catch(() => setError('Failed to load bookings.'))
      .finally(() => setLoading(false));
  }, []);

  const calculateDays = (start, end) => {
    const diff = new Date(end) - new Date(start);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (status) => {
    const map = {
      confirmed: 'badge-success',
      pending:   'badge-warning',
      cancelled: 'badge-danger',
    };
    return map[status] || 'badge-info';
  };

  const handleReviewChange = (bookingId, field, value) => {
    setReviewForms(prev => ({
      ...prev,
      [bookingId]: { ...prev[bookingId], [field]: value }
    }));
  };

  const handleReviewSubmit = async (booking) => {
    const form = reviewForms[booking.id] || {};
    setReviewErrors(prev => ({ ...prev, [booking.id]: '' }));
    setReviewLoading(prev => ({ ...prev, [booking.id]: true }));

    if (!form.rating) {
      setReviewErrors(prev => ({ ...prev, [booking.id]: 'Please select a rating.' }));
      setReviewLoading(prev => ({ ...prev, [booking.id]: false }));
      return;
    }

    try {
      await submitReview({
        car_id: booking.car_id,
        booking_id: booking.id,
        rating: parseInt(form.rating),
        comment: form.comment || '',
      });
      setReviewSuccess(prev => ({ ...prev, [booking.id]: true }));
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit review.';
      setReviewErrors(prev => ({ ...prev, [booking.id]: msg }));
    } finally {
      setReviewLoading(prev => ({ ...prev, [booking.id]: false }));
    }
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
            <h2>No bookings yet</h2>
            <p>You have not made any reservations. Start browsing our fleet!</p>
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
                    <div className="date-arrow">to</div>
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

                  {/* Review Form */}
                  <div className="review-form-section">
                    {reviewSuccess[booking.id] ? (
                      <div className="alert alert-success">
                        Review submitted successfully. Thank you!
                      </div>
                    ) : (
                      <>
                        <h4>Leave a Review</h4>
                        {reviewErrors[booking.id] && (
                          <div className="alert alert-error">{reviewErrors[booking.id]}</div>
                        )}
                        <div className="rating-selector">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              className={`star-btn ${reviewForms[booking.id]?.rating >= star ? 'active' : ''}`}
                              onClick={() => handleReviewChange(booking.id, 'rating', star)}
                            >
                              {star}
                            </button>
                          ))}
                          <span className="rating-label">
                            {reviewForms[booking.id]?.rating
                              ? `${reviewForms[booking.id].rating} / 5`
                              : 'Select rating'}
                          </span>
                        </div>
                        <textarea
                          className="review-textarea"
                          placeholder="Share your experience with this car... (optional)"
                          rows="3"
                          value={reviewForms[booking.id]?.comment || ''}
                          onChange={e => handleReviewChange(booking.id, 'comment', e.target.value)}
                        />
                        <button
                          className="btn btn-primary submit-review-btn"
                          onClick={() => handleReviewSubmit(booking)}
                          disabled={reviewLoading[booking.id]}
                        >
                          {reviewLoading[booking.id] ? 'Submitting...' : 'Submit Review'}
                        </button>
                      </>
                    )}
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