import React from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

function ProtectedRoute({ children }) {
  const [user] = useAuthState(auth);

  return user ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;
