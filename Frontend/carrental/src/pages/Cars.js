import React, { useEffect, useState } from 'react';
import { fetchCars } from '../services/api';
import CarCard from '../components/CarCard';
import './Cars.css';

const Cars = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    type: '',
    available: '',
    minPrice: '',
    maxPrice: '',
  });

  const loadCars = () => {
    setLoading(true);
    setError('');

    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '')
    );

    fetchCars(activeFilters)
      .then(res => setCars(res.data.cars))
      .catch(() => setError('Failed to load cars. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCars(); }, []);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadCars();
  };

  const handleReset = () => {
    setFilters({ type: '', available: '', minPrice: '', maxPrice: '' });
    setTimeout(loadCars, 0);
  };

  return (
    <div className="cars-page">

      <div className="page-header">
        <div className="container">
          <h1>Browse Our Fleet</h1>
          <p>Find the perfect car for your next journey</p>
        </div>
      </div>

      <div className="container cars-layout">

        {/* Filters Sidebar */}
        <aside className="filters-sidebar">
          <h3>Filter Cars</h3>
          <form onSubmit={handleSearch}>

            <div className="form-group">
              <label>Car Type</label>
              <select name="type" value={filters.type} onChange={handleFilterChange}>
                <option value="">All Types</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Electric">Electric</option>
                <option value="Luxury">Luxury</option>
              </select>
            </div>

            <div className="form-group">
              <label>Availability</label>
              <select name="available" value={filters.available} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="true">Available Only</option>
                <option value="false">Unavailable</option>
              </select>
            </div>

            <div className="form-group">
              <label>Min Price ($/day)</label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Max Price ($/day)</label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="500"
                min="0"
              />
            </div>

            <button type="submit" className="btn btn-primary filter-btn">
              Apply Filters
            </button>
            <button type="button" className="btn btn-outline filter-btn" onClick={handleReset}>
              Reset
            </button>

          </form>
        </aside>

        {/* Cars Grid */}
        <div className="cars-results">
          <div className="results-header">
            <p>{cars.length} car{cars.length !== 1 ? 's' : ''} found</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <div className="spinner-wrapper"><div className="spinner" /></div>
          ) : cars.length === 0 ? (
            <div className="no-results">
              <p>🚗 No cars match your filters.</p>
              <button className="btn btn-outline" onClick={handleReset}>Clear Filters</button>
            </div>
          ) : (
            <div className="cars-grid">
              {cars.map(car => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Cars;