import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import apiService from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: {
    id: number;
    name: string;
    slug: string;
    level: number;
  };
  department?: {
    id: number;
    name: string;
    code: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Consider authenticated if token exists; user can be fetched lazily
  const isAuthenticated = !!token;

  const login = async (newToken: string) => {
    setIsLoading(true);
    setToken(newToken);
    apiService.setToken(newToken);
    localStorage.setItem('auth_token', newToken);

    // Try to fetch current user, but don't fail login if it errors
    try {
      const response = await apiService.getMe();
      console.log('Login - /user API response:', response);
      if (response.success && (response.data as any)?.user) {
        console.log('Login - Setting user from API:', (response.data as any).user);
        setUser((response.data as any).user);
      } else {
        console.log('Login - No user data in response:', response);
      }
    } catch (_) {
      // Ignore; user will be fetched later
      console.warn('Login - Could not fetch user data');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear local state first (synchronously to prevent any async operations)
    setUser(null);
    setToken(null);
    apiService.clearToken();
    localStorage.removeItem('auth_token');
    
    // Immediately redirect to SSO login page without any delay
    // This prevents any pending requests from being sent
    const appOrigin = window.location.origin;
    // Use hash routing for callback URL
    const callback = `${appOrigin}/#/sso/callback`;
    const sphereSsoBase = import.meta.env.VITE_SPHERE_SSO_URL || 'http://127.0.0.1:8000/sso/login';
    const redirectUrl = `${sphereSsoBase}?redirect=${encodeURIComponent(callback)}`;
    
    // Use window.location.replace to prevent back button issues
    // and ensure immediate redirect without waiting for any pending operations
    window.location.replace(redirectUrl);
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user?.role) {
      console.log('hasRole: No user or role found', { user, roles });
      return false;
    }
    
    const userRoleSlug = user.role.slug;
    const departmentCode = user.department?.code;
    const isWarehouse = departmentCode === 'WH';
    
    // Direct role match
    if (roles.includes(userRoleSlug)) {
      // For admin and operator, also check if they have warehouse department
      if ((userRoleSlug === 'admin' || userRoleSlug === 'operator') && !isWarehouse) {
        return false;
      }
      // Superadmin always has access
      if (userRoleSlug === 'superadmin') {
        return true;
      }
      // Admin/Operator with warehouse department
      if ((userRoleSlug === 'admin' || userRoleSlug === 'operator') && isWarehouse) {
        return true;
      }
    }
    
    // Legacy role support for backward compatibility
    // admin-warehouse -> admin with department WH
    // operator-warehouse -> operator with department WH
    if (roles.includes('admin-warehouse')) {
      if (userRoleSlug === 'admin' && isWarehouse) {
        return true;
      }
    }
    if (roles.includes('operator-warehouse')) {
      if (userRoleSlug === 'operator' && isWarehouse) {
        return true;
      }
    }
    
    const hasAccess = roles.includes(userRoleSlug) || 
      (roles.includes('admin-warehouse') && userRoleSlug === 'admin' && isWarehouse) ||
      (roles.includes('operator-warehouse') && userRoleSlug === 'operator' && isWarehouse);
    
    console.log('hasRole check:', { 
      userRole: userRoleSlug,
      department: departmentCode,
      isWarehouse,
      requiredRoles: roles, 
      hasAccess 
    });
    return hasAccess;
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we're on a public route - don't initialize auth if so
        // Support hash mode: get path from hash if available, otherwise from pathname
        const currentPath = window.location.hash 
          ? window.location.hash.replace('#', '') || '/'
          : window.location.pathname;
        const publicRoutes = ['/driver', '/arrival-dashboard'];
        const isPublicRoute = publicRoutes.some(route => currentPath.startsWith(route));
        
        if (isPublicRoute) {
          // Skip auth initialization for public routes
          setIsLoading(false);
          return;
        }

        const storedToken = localStorage.getItem('auth_token');
        
        if (storedToken) {
          setToken(storedToken);
          apiService.setToken(storedToken);
          
          // Try to validate token and get user info
          try {
            const response = await apiService.getMe();
            console.log('/user API response:', response);
            if (response.success && (response.data as any)?.user) {
              console.log('Setting user from API:', (response.data as any).user);
              setUser((response.data as any).user);
            } else {
              console.log('No user data in response:', response);
              // If no user data, clear token
              // Don't redirect here - let ProtectedRoute handle it
              setToken(null);
              apiService.clearToken();
              localStorage.removeItem('auth_token');
            }
          } catch (error: any) {
            // If 401 Unauthorized, token is expired - clear token
            // Don't redirect here - let ProtectedRoute handle it
            if (error?.status === 401) {
              setToken(null);
              apiService.clearToken();
              localStorage.removeItem('auth_token');
            } else {
              // Other errors - backend might not be available, keep token for now
              console.warn('Could not validate token with backend:', error);
            }
          }
        } else {
          // No token - don't redirect here, let ProtectedRoute handle it
          // This allows public routes to work without redirect
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Keep app usable; don't force logout here
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}