// src/api/distributions.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function uploadDistributionFile(file) {
  const fd = new FormData();
  fd.append('file', file);

  const token = localStorage.getItem('token'); // optional auth
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(`${API_BASE}/distributions/upload`, {
    method: 'POST',
    headers,
    body: fd
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function getDistributions(batchId) {
  const token = localStorage.getItem('token'); // optional auth
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const url = `${API_BASE}/distributions${batchId ? `?batchId=${batchId}` : ''}`;
  const res = await fetch(url, { method: 'GET', headers });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}
