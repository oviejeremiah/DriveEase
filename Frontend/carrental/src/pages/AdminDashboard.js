import React, { useEffect, useState } from 'react';
import {
  adminFetchUsers,
  adminFetchBookings,
  adminAddCar,
  adminDeleteCar,
} from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [tab, setTab] = useState('bookings');
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newCar, setNewCar] = useState({
    make: '', model: '', year: '', type: '',
    price_per_day: '', seats: '5',
    transmission: 'Automatic', fuel_type: 'Petrol',
    description: '', image: '',
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([adminFetchUsers(), adminFetchBookings()])
      .then(([usersRes, bookingsRes]) => {
        setUsers(usersRes.data.users);
        setBookings(bookingsRes.data.bookings);
      })
      .catch(() => setError('Failed to load admin data.'))
      .finally(() => setLoading(false));
  }, []);

  const handleCarChange = (e) => {
    setNewCar(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await adminAddCar({
        ...newCar,
        year: parseInt(newCar.year),
        price_per_day: parseFloat(newCar.price_per_day),
        seats: parseInt(newCar.seats),
      });
      setSuccess('Car added successfully!');
      setNewCar({
        make: '', model: '', year: '', type: '',
        price_per_day: '', seats: '5',
        transmission: 'Automatic', fuel_type: 'Petrol',
        description: '', image: '',
      });
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      setError(apiErrors ? apiErrors[0].msg : 'Failed to add car.');
    }
  };

  const handleDeleteCar = async (id, name) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await adminDeleteCar(id);
      setSuccess(`${name} deleted successfully.`);
    } catch {
      setError('Failed to delete car.');
    }
  };

  if (loading) return <div className="spinner-wrapper"><div className="spinner" /></div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="container">
          <h1>Admin Dashboard</h1>
          <p>Manage cars, users and bookings</p>
        </div>
      </div>

      <div className="container admin-content">

        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Stats Row */}
        <div className="admin-stats">
          <div className="admin-stat-card">
            <h3>{users.length}</h3>
            <p>Total Users</p>
          </div>
          <div className="admin-stat-card">
            <h3>{bookings.length}</h3>
            <p>Total Bookings</p>
          </div>
          <div className="admin-stat-card">
            <h3>${bookings.reduce((sum, b) => sum + b.total_price, 0).toFixed(0)}</h3>
            <p>Total Revenue</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {['bookings', 'users', 'add-car'].map(t => (
            <button
              key={t}
              className={`tab-btn ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'bookings' ? '📅 Bookings'
                : t === 'users' ? '👥 Users'
                : '➕ Add Car'}
            </button>
          ))}
        </div>

        {/* Bookings Tab */}
        {tab === 'bookings' && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Car</th>
                  <th>Dates</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td>#{b.id}</td>
                    <td>
                      <div>{b.username}</div>
                      <div className="table-sub">{b.email}</div>
                    </td>
                    <td>{b.make} {b.model} {b.year}</td>
                    <td>
                      <div>{b.start_date}</div>
                      <div className="table-sub">→ {b.end_date}</div>
                    </td>
                    <td>${b.total_price.toFixed(2)}</td>
                    <td>
                      <span className={`badge badge-success`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-info' : 'badge-success'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Car Tab */}
        {tab === 'add-car' && (
          <div className="add-car-form card">
            <h2>Add New Car</h2>
            <form onSubmit={handleAddCar}>
              <div className="form-row">
                <div className="form-group">
                  <label>Make</label>
                  <input name="make" value={newCar.make} onChange={handleCarChange} placeholder="Toyota" required />
                </div>
                <div className="form-group">
                  <label>Model</label>
                  <input name="model" value={newCar.model} onChange={handleCarChange} placeholder="Camry" required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Year</label>
                  <input type="number" name="year" value={newCar.year} onChange={handleCarChange} placeholder="2023" required />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select name="type" value={newCar.type} onChange={handleCarChange} required>
                    <option value="">Select type</option>
                    <option>Sedan</option>
                    <option>SUV</option>
                    <option>Electric</option>
                    <option>Luxury</option>
                    <option>Truck</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price per Day ($)</label>
                  <input type="number" name="price_per_day" value={newCar.price_per_day} onChange={handleCarChange} placeholder="50" required />
                </div>
                <div className="form-group">
                  <label>Seats</label>
                  <input type="number" name="seats" value={newCar.seats} onChange={handleCarChange} min="1" max="10" required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Transmission</label>
                  <select name="transmission" value={newCar.transmission} onChange={handleCarChange}>
                    <option>Automatic</option>
                    <option>Manual</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Fuel Type</label>
                  <select name="fuel_type" value={newCar.fuel_type} onChange={handleCarChange}>
                    <option>Petrol</option>
                    <option>Diesel</option>
                    <option>Electric</option>
                    <option>Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input name="image" value={newCar.image} onChange={handleCarChange} placeholder="https://..." />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={newCar.description} onChange={handleCarChange} rows="3" placeholder="Brief description of the car..." />
              </div>

              <button type="submit" className="btn btn-primary">Add Car</button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;