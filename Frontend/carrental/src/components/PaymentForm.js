import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './PaymentForm.css';

const PaymentForm = ({ bookingId, amount, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!stripe || !elements) return;

    setLoading(true);

    try {
      // Step 1 — Create payment intent on backend
      const intentRes = await fetch('http://localhost:5000/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('driveease_token')}`,
        },
        body: JSON.stringify({ booking_id: bookingId, amount }),
      });

      const intentData = await intentRes.json();

      if (intentData.error) {
        setError(intentData.error);
        setLoading(false);
        return;
      }

      // Step 2 — Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        intentData.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      // Step 3 — Confirm with our backend
      const confirmRes = await fetch('http://localhost:5000/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('driveease_token')}`,
        },
        body: JSON.stringify({
          payment_intent_id: paymentIntent.id,
          booking_id: bookingId,
        }),
      });

      const confirmData = await confirmRes.json();

      if (confirmData.error) {
        setError(confirmData.error);
      } else {
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    style: {
      base: {
        color: '#F8F8F8',
        fontFamily: 'Inter, sans-serif',
        fontSize: '15px',
        '::placeholder': { color: '#55556A' },
      },
      invalid: { color: '#FF4D6D' },
    },
  };

  return (
    <div className="payment-form">
      <div className="payment-summary">
        <span>Total Amount</span>
        <span className="payment-amount">${amount}</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Card Details</label>
          <div className="card-element-wrapper">
            <CardElement options={cardStyle} />
          </div>
          <p className="card-hint">
            Test card: 4242 4242 4242 4242 — any future date — any CVC
          </p>
        </div>

        <div className="payment-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !stripe}
          >
            {loading ? 'Processing...' : `Pay $${amount}`}
          </button>
        </div>
      </form>

      <p className="stripe-badge">Secured by Stripe</p>
    </div>
  );
};

export default PaymentForm;