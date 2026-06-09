import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthProvider';
import { PageLoader } from '../../components/ui/PageLoader';

export function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isPending } = useAdminAuth();
  const location = useLocation();

  if (isPending) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
    );
  }

  return <>{children}</>;
}
