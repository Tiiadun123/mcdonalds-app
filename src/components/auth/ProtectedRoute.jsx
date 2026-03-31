import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ adminOnly = false }) {
  const { profile, isAuthenticated, isLoading } = useAuthStore();

  // Show Loading Spinner during initial session check
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-primary-red animate-spin" />
      </div>
    );
  }

  // Not Logged In
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Specific Admin Check
  if (adminOnly && profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Authorized
  return <Outlet />;
}
