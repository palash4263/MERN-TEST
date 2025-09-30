import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import AddAgent from './pages/AddAgent';
import AgentsList from './pages/AgentsList';
import UploadCSV from './pages/UploadCSV';
import Distributions from './pages/Distributions';

export default function App() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/agents', label: 'Agents' },
    { path: '/upload', label: 'Upload CSV' },
    { path: '/distributions', label: 'Distributions' },
  ];

  return (
    <div className="app">
      <header className="navbar">
        <div className="nav-brand" onClick={() => navigate('/dashboard')}>
          <div className="brand-logo" aria-hidden="true">🚀</div>
          <div className="brand-text">
            <div className="brand-name">AgentFlow</div>
            <div className="brand-sub">Outreach Manager</div>
          </div>
        </div>

        <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {link.label}
            </NavLink>
          ))}
          <button
            className="nav-logout"
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              navigate('/');
            }}
          >
            Logout
          </button>
        </nav>

        <button
          className="nav-toggle"
          onClick={() => setMenuOpen((s) => !s)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="/agents/add" element={<AddAgent />} />
          <Route path="/agents" element={<AgentsList />} />
          <Route path="/upload" element={<UploadCSV />} />
          <Route path="/distributions" element={<Distributions />} />
        </Routes>
      </main>
    </div>
  );
}
