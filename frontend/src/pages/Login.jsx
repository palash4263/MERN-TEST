import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/api';

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [serverErr, setServerErr] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  useEffect(() => {
    // basic inline validation as user types
    setFieldErrors((prev) => ({ ...prev, email: validateEmail(email) ? '' : (email ? 'Invalid email' : '') }));
  }, [email]);

  useEffect(() => {
    setFieldErrors((prev) => ({ ...prev, password: password.length >= 6 || !password ? '' : 'Min 6 characters' }));
  }, [password]);

  function validateEmail(e) {
    return /\S+@\S+\.\S+/.test(e);
  }

  const validateForm = () => {
    if (!email) return { email: 'Email is required' };
    if (!validateEmail(email)) return { email: 'Enter a valid email' };
    if (!password) return { password: 'Password is required' };
    if (password.length < 6) return { password: 'Password must be at least 6 characters' };
    return null;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerErr('');
    const v = validateForm();
    if (v) {
      setFieldErrors(v);
      return;
    }
    setLoading(true);

    try {
      const data = await login({ email, password });
      // store token based on remember
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('token', data.token);
      storage.setItem('user', JSON.stringify(data.user || {}));
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error', err);
      // handle different error shapes from backend
      const msg =
        (err && err.message) ||
        (err && err.errors && err.errors[0] && err.errors[0].msg) ||
        'Login failed. Check credentials and try again.';
      setServerErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-heading">
        <header className="card-header">
          <div className="brand">
            <div className="logo">🔐</div>
            <h1 id="login-heading">Sign in</h1>
          </div>
          <p className="lead">Access your dashboard — simple, secure & fast.</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              autoFocus
            />
            {fieldErrors.email && (
              <div id="email-error" className="field-error" role="alert">
                {fieldErrors.email}
              </div>
            )}
          </div>

          <div className="form-row">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-pass"
                onClick={() => setShowPassword((s) => !s)}
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={0}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.password && (
              <div id="password-error" className="field-error" role="alert">
                {fieldErrors.password}
              </div>
            )}
          </div>
 

          <div aria-live="polite" className="server-error-wrapper">
            {serverErr && <div className="server-error" role="alert">{serverErr}</div>}
          </div>

          <div className="submit-row">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true" /> Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
