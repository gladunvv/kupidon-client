import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/auth/use-auth';

export function ProtectedRoute() {
  const { status } = useAuth();

  if (status === 'loading') {
    return null;
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
