import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

export default function SSOCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Compatibility fallback:
  // Sphere terbaru sudah memakai /#/sso/callback, tapi blok ini memastikan
  // instance backend lama (atau URL yang dimodifikasi browser) tetap dibersihkan
  // sebelum React Router memproses token.
  useEffect(() => {
    const pathname = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;
    
    // Case 1: /sso/callback?token=... (without hash) - redirect to hash version
    if (pathname === '/sso/callback' && !hash) {
      // Extract only the query string (token), ignore any hash that might be in the URL
      const cleanSearch = search.split('#')[0]; // Remove hash from search if present
      
      // If there's a hash in the search string (e.g., ?token=...#/supplier-contacts)
      // Extract it and store it for later redirect
      if (search.includes('#')) {
        const hashPart = search.split('#')[1];
        if (hashPart && hashPart.startsWith('/')) {
          sessionStorage.setItem('sso_redirect_path', hashPart);
        }
      }
      
      window.location.replace('#' + pathname + cleanSearch);
      return;
    }
    
    // Case 2: /sso/callback?token=...#/supplier-contacts (hash in URL after query)
    // This happens when Sphere SSO adds hash to the URL
    if (pathname === '/sso/callback' && hash && !hash.startsWith('#/sso/callback')) {
      // Extract hash part and store it
      const redirectPath = hash.replace('#', '');
      if (redirectPath && redirectPath !== '/sso/callback') {
        sessionStorage.setItem('sso_redirect_path', redirectPath);
      }
      // Clean URL to only have callback with token
      const cleanSearch = search.split('#')[0];
      window.location.replace('#' + pathname + cleanSearch);
      return;
    }
    
    // Case 3: #/sso/callback?token=...#/supplier-contacts (hash contains both)
    if (hash && hash.includes('/sso/callback') && hash.includes('?')) {
      const hashParts = hash.split('#').filter(p => p);
      const callbackPart = hashParts.find(part => part.includes('/sso/callback'));
      const otherPart = hashParts.find(part => !part.includes('/sso/callback') && part.startsWith('/'));
      
      if (callbackPart && otherPart) {
        // Store the other path for redirect
        sessionStorage.setItem('sso_redirect_path', otherPart);
        // Clean hash to only have callback
        const cleanHash = '#' + callbackPart.split('#')[0];
        if (window.location.hash !== cleanHash) {
          window.location.replace(cleanHash);
          return;
        }
      }
    }
  }, []);

  useEffect(() => {
    const handleSSOCallback = async () => {
      try {
        const token = searchParams.get('token');
        
        if (!token) {
          setError('No token provided');
          setLoading(false);
          return;
        }

        // Set token and fetch user before navigating
        await login(token);
        toast.success('Login successful!', { title: 'Welcome' });
        
        // Check if there's a stored redirect path from before SSO redirect
        const redirectPath = sessionStorage.getItem('sso_redirect_path');
        if (redirectPath) {
          sessionStorage.removeItem('sso_redirect_path');
          // Navigate to the original path user was trying to access
          navigate(redirectPath);
        } else {
          // Default to home
          navigate('/');
        }

      } catch (err: any) {
        const errorMsg = err.message || 'SSO callback failed';
        setError(errorMsg);
        toast.error(errorMsg, { title: 'Authentication Failed' });
      } finally {
        setLoading(false);
      }
    };

    handleSSOCallback();
  }, [searchParams, navigate, login, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
              Authentication Failed
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              {error}
            </p>
            <button
              onClick={() => {
                const appOrigin = window.location.origin;
                const callback = `${appOrigin}/#/sso/callback`;
                const sphereSsoBase = import.meta.env.VITE_SPHERE_SSO_URL || 'http://127.0.0.1:8000/sso/login';
                window.location.href = `${sphereSsoBase}?redirect=${encodeURIComponent(callback)}`;
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}