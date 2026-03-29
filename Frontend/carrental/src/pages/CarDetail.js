import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCar, fetchCarReviews, createBooking } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './CarDetail.css';

const CarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [car, setCar] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    Promise.all([fetchCar(id), fetchCarReviews(id)])
      .then(([carRes, reviewRes]) => {
        setCar(carRes.data);
        setReviews(reviewRes.data.reviews);
      })
      .catch(() => setError('Failed to load car details.'))
      .finally(() => setLoading(false));
  }, [id]);

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const diff = new Date(endDate) - new Date(startDate);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    const days = calculateDays();
    return days > 0 ? (days * car.price_per_day).toFixed(2) : '0.00';
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess('');

    if (!user) {
      navigate('/login');
      return;
    }

    if (calculateDays() <= 0) {
      setBookingError('Please select valid dates.');
      return;
    }

    setBookingLoading(true);
    try {
      await createBooking({ car_id: car.id, start_date: startDate, end_date: endDate });
      setBookingSuccess('Booking confirmed! Check your bookings page.');
      setCar(prev => ({ ...prev, available: 0 }));
    } catch (err) {
      setBookingError(err.response?.data?.error || 'Failed to create booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  const renderStars = (rating) => `${rating}/5`;

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) return <div className="spinner-wrapper"><div className="spinner" /></div>;
  if (error) return <div className="container"><div className="alert alert-error">{error}</div></div>;
  if (!car) return null;

  return (
    <div className="car-detail-page">
      <div className="container">

        <button className="back-btn" onClick={() => navigate('/cars')}>
          Back to Cars
        </button>

        <div className="car-detail-layout">

          <div className="car-info">
            <div className="car-detail-image">
              <img src={car.image} alt={`${car.make} ${car.model}`} />
              <span className={`availability-badge badge ${car.available ? 'badge-success' : 'badge-danger'}`}>
                {car.available ? 'Available' : 'Unavailable'}
              </span>
            </div>

            <div className="car-detail-header">
              <div>
                <h1>{car.make} {car.model}</h1>
                <p className="car-detail-year">{car.year} - {car.type}</p>
              </div>
              <div className="car-detail-price">
                <span className="price-amount">${car.price_per_day}</span>
                <span className="price-unit">/day</span>
              </div>
            </div>

            <p className="car-detail-description">{car.description}</p>

            <div className="car-detail-specs">
              <div className="spec-item">
                <span className="spec-label">Seats</span>
                <span className="spec-value">{car.seats}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Transmission</span>
                <span className="spec-value">{car.transmission}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Fuel</span>
                <span className="spec-value">{car.fuel_type}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Rating</span>
                <span className="spec-value">{avgRating ? `${avgRating}/5` : 'No reviews'}</span>
              </div>
            </div>

            <div className="reviews-section">
              <h2>Customer Reviews {reviews.length > 0 && `(${reviews.length})`}</h2>
              {reviews.length === 0 ? (
                <p className="no-reviews">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="reviews-list">
                  {reviews.map(review => (
                    <div key={review.id} className="review-card">
                      <div className="review-header">
                        <span className="review-username">{review.username}</span>
                        <span className="review-rating">{renderStars(review.rating)}</span>
                      </div>
                      {review.comment && <p className="review-comment">{review.comment}</p>}
                      <span className="review-date">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="booking-card card">
            <h2>Book This Car</h2>

            {bookingSuccess && <div className="alert alert-success">{bookingSuccess}</div>}
            {bookingError && <div className="alert alert-error">{bookingError}</div>}

            {car.available ? (
              <form onSubmit={handleBooking}>
                <div className="form-group">
                  <label>Pick-up Date</label>
                  <input
                    type="date"
                    value={startDate}
                    min={today}
                    onChange={e => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Return Date</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || today}
                    onChange={e => setEndDate(e.target.value)}
                    required
                  />
                </div>

                {calculateDays() > 0 && (
                  <div className="price-breakdown">
                    <div className="price-row">
                      <span>${car.price_per_day} x {calculateDays()} day{calculateDays() !== 1 ? 's' : ''}</span>
                      <span>${calculateTotal()}</span>
                    </div>
                    <div className="price-row total">
                      <span>Total</span>
                      <span>${calculateTotal()}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-accent book-btn"
                  disabled={bookingLoading}
                >
                  {bookingLoading ? 'Booking...' : user ? 'Confirm Booking' : 'Login to Book'}
                </button>
              </form>
            ) : (
              !bookingSuccess && (
                <div className="unavailable-msg">
                  <p>This car is currently unavailable.</p>
                  <button className="btn btn-outline" onClick={() => navigate('/cars')}>
                    Browse Other Cars
                  </button>
                </div>
              )
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default CarDetail;