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
      const response = await apiService.getDashboardStats();
      console.log('Login - Dashboard API response:', response);
      if (response.success && response.data?.user) {
        console.log('Login - Setting user from API:', response.data.user);
        setUser(response.data.user);
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
    setUser(null);
    setToken(null);
    apiService.clearToken();
    localStorage.removeItem('auth_token');
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user?.role) {
      console.log('hasRole: No user or role found', { user, roles });
      return false;
    }
    const hasAccess = roles.includes(user.role.slug);
    console.log('hasRole check:', { 
      userRole: user.role.slug, 
      requiredRoles: roles, 
      hasAccess 
    });
    return hasAccess;
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        
        if (storedToken) {
          setToken(storedToken);
          apiService.setToken(storedToken);
          
          // Try to validate token and get user info
          try {
            const response = await apiService.getDashboardStats();
            console.log('Dashboard API response:', response);
            if (response.success && response.data?.user) {
              console.log('Setting user from API:', response.data.user);
              setUser(response.data.user);
            } else {
              console.log('No user data in response:', response);
            }
          } catch (error) {
            // Backend might not be available, keep token for now
            console.warn('Could not validate token with backend:', error);
          }
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