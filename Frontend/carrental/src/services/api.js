import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Automatically attach the token to every request if user is logged in
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('driveease_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Cars
export const fetchCars = (filters = {}) => API.get('/cars', { params: filters });
export const fetchCar = (id) => API.get(`/cars/${id}`);
export const fetchCarReviews = (id) => API.get(`/cars/${id}/reviews`);

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);

// Bookings
export const createBooking = (data) => API.post('/bookings', data);
export const fetchMyBookings = () => API.get('/bookings/my');

// Reviews
export const submitReview = (data) => API.post('/reviews', data);

// Payments
export const createPaymentIntent = (data) => API.post('/payments/create-intent', data);
export const confirmPayment = (data) => API.post('/payments/confirm', data);
export const fetchPaymentStatus = (bookingId) => API.get(`/payments/${bookingId}`);

// Admin
export const adminFetchUsers = () => API.get('/admin/users');
export const adminFetchBookings = () => API.get('/admin/bookings');
export const adminAddCar = (data) => API.post('/admin/cars', data);
export const adminDeleteCar = (id) => API.delete(`/admin/cars/${id}`);