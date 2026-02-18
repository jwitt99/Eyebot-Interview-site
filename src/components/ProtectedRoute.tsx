import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const username = localStorage.getItem('username');
  
  if (!username) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}
