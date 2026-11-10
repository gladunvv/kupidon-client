import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/auth/use-auth';
import { PageLoading } from '@/routes/RouteStatus';

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <PageLoading />;
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
