import { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  const redirectToSphereLogin = () => {
    const appOrigin = window.location.origin;
    const callback = `${appOrigin}/sso/callback`;
    const sphereSsoBase = import.meta.env.VITE_SPHERE_SSO_URL || 'http://127.0.0.1:8000/sso/login';
    const redirectUrl = `${sphereSsoBase}?redirect=${encodeURIComponent(callback)}`;
    window.location.href = redirectUrl;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    redirectToSphereLogin();
    return null;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
              Access Denied
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}