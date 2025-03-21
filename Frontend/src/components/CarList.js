import React, { useState, useEffect } from 'react';

function CarList() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/cars')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setCars(data);
        setLoading(false);
      })
      .catch(error => {
        setError('Failed to load cars: ' + error.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="car-list">
      <h2>Available Cars</h2>
      <div className="car-grid">
        {cars.map(car => (
          <div key={car.id} className="car-card">
            <img src={car.image} alt={`${car.make} ${car.model}`} />
            <h3>{car.make} {car.model}</h3>
            <p>Year: {car.year}</p>
            <p>Type: {car.type}</p>
            <p className="price">${car.pricePerDay} per day</p>
            <button className="btn primary">Rent Now</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CarList;