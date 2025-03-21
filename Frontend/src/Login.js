import React, { useState } from 'react';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear errors when the user starts typing again
    if (name === 'username') setUsernameError('');
    if (name === 'password') setPasswordError('');
  };

  const validateForm = () => {
    let isValid = true;
    let usernameErrorMessage = '';
    let passwordErrorMessage = '';

    if (!formData.username.trim()) {
      usernameErrorMessage = 'Username is required';
      isValid = false;
    }

    if (!formData.password.trim()) {
      passwordErrorMessage = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      passwordErrorMessage = 'Password must be at least 6 characters';
      isValid = false;
    }

    setUsernameError(usernameErrorMessage);
    setPasswordError(passwordErrorMessage);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return; // Stop if the form is invalid
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to home page or dashboard
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = loading || !formData.username.trim() || !formData.password.trim();

  return (
    <div className="auth-form">
      <h2>Login</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          {usernameError && <div className="error-message">{usernameError}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {passwordError && <div className="error-message">{passwordError}</div>}
        </div>

        <button
          type="submit"
          className="btn primary"
          disabled={isSubmitDisabled}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p>
        Don't have an account? <a href="/register">Register</a>
      </p>
    </div>
  );
}

export default Login;