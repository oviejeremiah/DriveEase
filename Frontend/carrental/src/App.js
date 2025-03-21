import React from 'react';
import './App.css';
import CarList from './components/CarList';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Secure Car Rental</h1>
        <nav>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/cars">Cars</a></li>
            <li><a href="/login">Login</a></li>
            <li><a href="/register">Register</a></li>
          </ul>
        </nav>
      </header>
      <main>
        <section className="hero">
          <h2>Find Your Perfect Rental Car</h2>
          <p>Safe, secure, and convenient car rentals</p>
          <button className="btn primary">Browse Cars</button>
        </section>
        
        <section className="content">
          <CarList />
        </section>
      </main>
      <footer>
        <p>&copy; 2025 Secure Car Rental. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
