import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAgent } from '../api/agents';


export default function AddAgent() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverMsg, setServerMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  function validateFields() {
    const e = {};
    if (!name || name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!email || !/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!mobile || !/^\+\d{6,15}$/.test(mobile)) e.mobile = 'Mobile must include country code, e.g. +919876543210';
    if (!password || password.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerMsg(null);
    const errors = validateFields();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setLoading(true);
    try {
      const resp = await createAgent({ name: name.trim(), email: email.trim(), mobile: mobile.trim(), password });
      setServerMsg({ type: 'success', text: `Agent created: ${resp.agent?.email || ''}` });
      // reset fields
      setName(''); setEmail(''); setMobile(''); setPassword('');
      setFieldErrors({});
      // optionally auto-redirect after 1.2s:
      // setTimeout(() => navigate('/agents'), 1200);
    } catch (err) {
      console.error('Create agent error', err);
      const text = (err && err.message) || (err && err.errors && err.errors[0] && err.errors[0].msg) || 'Failed to create agent';
      setServerMsg({ type: 'error', text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-wrap">
      <section className="card form-card">
        <header className="card-head">
          <div>
            <h2>Add Agent</h2>
            <p className="muted">Create an agent with name, email, mobile (with country code) and password.</p>
          </div>

          <div className="head-actions">
            <button className="btn ghost" onClick={() => navigate('/agents')} aria-label="View agents">View Agents</button>
            <button className="btn" onClick={() => navigate('/dashboard')} aria-label="Back to dashboard">Back</button>
          </div>
        </header>

        <form className="grid-form" onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <label htmlFor="agent-name">Name</label>
            <input
              id="agent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Agent Name"
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? 'name-error' : undefined}
              autoComplete="name"
            />
            {fieldErrors.name && <div id="name-error" className="field-error">{fieldErrors.name}</div>}
          </div>

          <div className="form-row">
            <label htmlFor="agent-email">Email</label>
            <input
              id="agent-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@example.com"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              autoComplete="email"
            />
            {fieldErrors.email && <div id="email-error" className="field-error">{fieldErrors.email}</div>}
          </div>

          <div className="form-row">
            <label htmlFor="agent-mobile">Mobile (with country code)</label>
            <input
              id="agent-mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+919876543210"
              aria-invalid={!!fieldErrors.mobile}
              aria-describedby={fieldErrors.mobile ? 'mobile-error' : undefined}
              autoComplete="tel"
            />
            {fieldErrors.mobile && <div id="mobile-error" className="field-error">{fieldErrors.mobile}</div>}
          </div>

          <div className="form-row">
            <label htmlFor="agent-password">Password</label>
            <input
              id="agent-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              autoComplete="new-password"
            />
            {fieldErrors.password && <div id="password-error" className="field-error">{fieldErrors.password}</div>}
          </div>

          <div className="form-actions-row">
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn primary" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Create Agent'}
              </button>

              <button type="button" className="btn" onClick={() => { setName(''); setEmail(''); setMobile(''); setPassword(''); setFieldErrors({}); setServerMsg(null); }}>
                Reset
              </button>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button type="button" className="btn ghost" onClick={() => navigate('/upload')}>Upload CSV</button>
            </div>
          </div>

          {/* server message */}
          {serverMsg && (
            <div className={`server-alert ${serverMsg.type === 'success' ? 'success' : 'error'}`} role="status">
              {serverMsg.text}
            </div>
          )}
        </form>
      </section>
    </main>
  );
}
