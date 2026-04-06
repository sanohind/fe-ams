import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import apiService from '../services/api';
import { userManager } from '../auth/oidcConfig';
import { User } from 'oidc-client-ts';

interface AppUser {
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
  user: AppUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Consider authenticated if token exists
  const isAuthenticated = !!token;

  const login = async () => {
    setIsLoading(true);
    try {
      await userManager.signinRedirect();
    } catch (err) {
      console.error('Login failed:', err);
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear local state
      setUser(null);
      setToken(null);
      apiService.clearToken();
      localStorage.removeItem('auth_token');

      // Trigger OIDC logout
      await userManager.signoutRedirect();
    } catch (err) {
      console.error('Logout failed:', err);
      // Fallback
      window.location.replace('/');
    }
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user?.role) {
      return false;
    }

    const { slug: userRoleSlug } = user.role;
    const departmentCode = user.department?.code;
    const isWarehouse = departmentCode === 'WH';

    // Direct role match
    if (roles.includes(userRoleSlug)) {
        if ((userRoleSlug === 'admin' || userRoleSlug === 'operator') && !isWarehouse) {
            return false;
        }
        if (userRoleSlug === 'superadmin') {
            return true;
        }
        if ((userRoleSlug === 'admin' || userRoleSlug === 'operator') && isWarehouse) {
            return true;
        }
    }

    // Legacy role support
    if (roles.includes('admin-warehouse') && userRoleSlug === 'admin' && isWarehouse) return true;
    if (roles.includes('operator-warehouse') && userRoleSlug === 'operator' && isWarehouse) return true;

    return (
        roles.includes(userRoleSlug) ||
        (roles.includes('admin-warehouse') && userRoleSlug === 'admin' && isWarehouse) ||
        (roles.includes('operator-warehouse') && userRoleSlug === 'operator' && isWarehouse)
    );
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Build public path check
        const currentPath = window.location.hash
          ? window.location.hash.replace('#', '') || '/'
          : window.location.pathname;
        const publicRoutes = ['/driver', '/arrival-dashboard', '/sso/callback', '/callback'];
        const isPublicRoute = publicRoutes.some(route => currentPath.startsWith(route));
        
        // Skip auth initialization for public routes
        if (isPublicRoute) {
            setIsLoading(false);
            return;
        }

        // Check if SSO is enabled via env
        const ssoEnabled = import.meta.env.VITE_SSO_ENABLED !== 'false'; // Default true if not set

        if (!ssoEnabled) {
            console.log('SSO is disabled (Mock Mode). Setting up mock superadmin...');
            setToken('non-sso-mode');
            apiService.setToken('non-sso-mode');

            // Set mock superadmin user for full access
            setUser({
                id: 1,
                name: 'Super Admin (Non Auth)',
                email: 'superadmin@besphere.com',
                username: 'superadmin',
                role: {
                    id: 1,
                    name: 'Superadmin',
                    slug: 'superadmin',
                    level: 1
                },
                department: {
                    id: 1,
                    name: 'Warehouse',
                    code: 'WH'
                }
            });

            setIsLoading(false);
            return;
        }

        // Check OIDC user - retry logic for race conditions
        let oidcUser = await userManager.getUser();
        
        // If user not found, wait a bit and retry (in case of race condition after redirect)
        if (!oidcUser || oidcUser.expired) {
          console.log("OIDC user not found on first try, retrying...");
          await new Promise(resolve => setTimeout(resolve, 200));
          oidcUser = await userManager.getUser();
        }
        
        if (oidcUser && !oidcUser.expired) {
          console.log("OIDC User found:", oidcUser);
          setToken(oidcUser.access_token);
          apiService.setToken(oidcUser.access_token);
          
          // Fetch full profile from API if needed
          try {
             const response = await apiService.getMe();
             if (response.success && (response.data as any)?.user) {
                 setUser((response.data as any).user);
             }
          } catch (e) {
              console.warn("Failed to fetch API profile:", e);
          }
        } else {
            console.log("No OIDC user found or expired after retry");
            
            // Clean up potentially expired OIDC user to prevent caching issues
            if (oidcUser && oidcUser.expired) {
               console.log("Clearing expired OIDC user from cache...");
               try {
                 await userManager.removeUser();
               } catch (err) {
                 console.error("Failed to clear expired user:", err);
               }
            }

            // Check if token exists in localStorage as fallback
            const storedToken = localStorage.getItem('auth_token');
            if (storedToken) {
              console.log("Found token in localStorage, using it");
              setToken(storedToken);
              apiService.setToken(storedToken);
              try {
                const response = await apiService.getMe();
                if (response.success && (response.data as any)?.user) {
                  setUser((response.data as any).user);
                }
              } catch (e) {
                console.warn("Failed to fetch API profile with stored token:", e);
              }
            }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Events
    const onUserLoaded = async (loadedUser: User) => {
        console.log('OIDC User loaded event', loadedUser);
        setToken(loadedUser.access_token);
        apiService.setToken(loadedUser.access_token);
        try {
            const response = await apiService.getMe();
            if (response.success && (response.data as any)?.user) {
                setUser((response.data as any).user);
            }
        } catch (e) {
            console.warn("Failed to fetch user profile after user loaded:", e);
        }
    };

    const onAccessTokenExpired = () => {
        console.log('Access token expired event');
        // Let silent renew handle it, or logout if failed
        // For now, logging out might be too aggressive if silent renew is enabled
        // userManager.signinSilent() might be triggered automatically
    };

    // Listen for custom event from SSOCallback
    const onCustomUserLoaded = async (event: CustomEvent) => {
        console.log('Custom OIDC user loaded event', event.detail);
        const userData = event.detail?.user;
        if (userData && userData.access_token) {
            setToken(userData.access_token);
            apiService.setToken(userData.access_token);
            try {
                const response = await apiService.getMe();
                if (response.success && (response.data as any)?.user) {
                    setUser((response.data as any).user);
                }
            } catch (e) {
                console.warn("Failed to fetch user profile after custom user loaded:", e);
            }
        }
    };

    userManager.events.addUserLoaded(onUserLoaded);
    userManager.events.addAccessTokenExpired(onAccessTokenExpired);
    window.addEventListener('oidc-user-loaded', onCustomUserLoaded as unknown as EventListener);

    initializeAuth();

    return () => {
        userManager.events.removeUserLoaded(onUserLoaded);
        userManager.events.removeAccessTokenExpired(onAccessTokenExpired);
        window.removeEventListener('oidc-user-loaded', onCustomUserLoaded as unknown as EventListener);
    };
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