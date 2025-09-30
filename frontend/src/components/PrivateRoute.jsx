import React from 'react';
import { Navigate } from 'react-router-dom';

// Small wrapper to protect routes in react-router v6
export default function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  return children;
}
