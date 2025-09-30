// src/api/agents.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function createAgent({ name, email, mobile, password }) {
  const res = await fetch(`${API_BASE}/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, mobile, password })
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function getAgents({ page = 1, limit = 20, search = '' } = {}) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('limit', limit);
  if (search) params.set('search', search);

  const token = localStorage.getItem('token'); // optional auth
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/agents?${params.toString()}`, {
    method: 'GET',
    headers
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data; // { success, data: [...], meta: {...} }
}

export async function getAgent(id) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/agents/${id}`, {
    method: 'GET',
    headers
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data; // { success, data: {...} }
}
