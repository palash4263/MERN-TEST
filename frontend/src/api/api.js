// src/api/api.js
// Small API helper to call backend auth endpoints.
// NOTE: ensure NEXT_PUBLIC style is used in env.example; here we use VITE_ prefix for Vite.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function login({ email, password }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function getMe(token) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}
