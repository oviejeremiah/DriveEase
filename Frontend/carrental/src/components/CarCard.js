import React from 'react';
import { Link } from 'react-router-dom';
import './CarCard.css';

const CarCard = ({ car }) => {
  return (
    <div className="car-card">
      <div className="car-card-image">
        <img src={car.image} alt={`${car.make} ${car.model}`} />
        <span className={`availability-badge badge ${car.available ? 'badge-success' : 'badge-danger'}`}>
          {car.available ? '● Available' : '● Unavailable'}
        </span>
        <span className="car-type-tag">{car.type}</span>
      </div>

      <div className="car-card-body">
        <div className="car-card-header">
          <h3>{car.make} {car.model}</h3>
          <span className="car-year">{car.year}</span>
        </div>

        <p className="car-description">{car.description}</p>

        <div className="car-specs">
          <span>{car.seats} Seats</span>
          <span>{car.transmission}</span>
          <span>{car.fuel_type}</span>
        </div>

        <div className="car-card-footer">
          <div className="car-price">
            <span className="price-amount">${car.price_per_day}</span>
            <span className="price-unit">/day</span>
          </div>
          <Link to={`/cars/${car.id}`} className="btn btn-primary">
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CarCard;