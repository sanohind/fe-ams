import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useToast } from '../../hooks/useToast';
import { userManager } from '../../auth/oidcConfig';
import apiService from '../../services/api';

export default function SSOCallback() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false); // Use ref to prevent multiple processing

  useEffect(() => {
    // Prevent multiple processing
    if (processingRef.current) {
      console.log("Callback already processing, skipping...");
      return;
    }
    
    processingRef.current = true;

    const handleSSOCallback = async () => {
      try {
        console.log("Processing OIDC Callback...");
        console.log("Current URL:", window.location.href);
        console.log("URL Search:", window.location.search);
        console.log("URL Hash:", window.location.hash);
        
        // Parse URL manually to check state
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        console.log("Code from URL:", code ? 'present' : 'missing');
        console.log("State from URL:", state ? 'present' : 'missing');
        
        // If no code in URL, check if user is already authenticated
        if (!code) {
          console.log("No code in URL, checking if user is already authenticated...");
          const existingUser = await userManager.getUser();
          if (existingUser && !existingUser.expired) {
            console.log("User already authenticated, staying on callback page");
            // Don't redirect - user is already authenticated
            return;
          }
          // If no code and no user, it might be a refresh - don't throw error
          console.warn("No code in URL and no authenticated user");
          // Don't redirect - let the app handle it
          return;
        }
        
        // Check localStorage for stored state (for debugging)
        const storedStateKeys = Object.keys(localStorage).filter(key => 
          key.includes('oidc') || key.includes('state')
        );
        console.log("Stored state keys in localStorage:", storedStateKeys);
        
        // Validate state parameter exists
        if (!state) {
          throw new Error('State parameter not found in URL. Make sure query params are before hash.');
        }
        
        console.log("Code and state found in URL, proceeding with token exchange...");
        
        // Check if we already have a user (prevent double processing)
        // This prevents using the same authorization code twice
        const existingUser = await userManager.getUser();
        let user;
        
        if (existingUser && !existingUser.expired) {
          console.log("User already authenticated, skipping callback");
          user = existingUser;
        } else {
          // Since user was redirected from Sphere (external redirect),
          // state might not be in localStorage. We need to handle this manually.
          // Try signinRedirectCallback first, if it fails due to state mismatch,
          // we'll do manual token exchange
          
          try {
            // Try normal callback first
            user = await userManager.signinRedirectCallback();
          } catch (callbackError: any) {
            // If error is about state not found, do manual token exchange
            if (callbackError.message && callbackError.message.includes('state')) {
              console.warn("State not found in storage (external redirect), doing manual token exchange...");
              
              // Manual token exchange
              const authority = import.meta.env.VITE_OIDC_AUTHORITY || 'http://127.0.0.1:8000/api';
              const client_id = import.meta.env.VITE_OIDC_CLIENT_ID || '2';
              const client_secret = import.meta.env.VITE_OIDC_CLIENT_SECRET;
              const redirect_uri = `${window.location.origin}/#/callback`;
              
              // Exchange authorization code for access token
              const tokenResponse = await fetch(`${authority}/oauth/token`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Accept': 'application/json',
                },
                body: new URLSearchParams({
                  grant_type: 'authorization_code',
                  code: code,
                  redirect_uri: redirect_uri,
                  client_id: client_id,
                  ...(client_secret ? { client_secret: client_secret } : {}),
                }),
              });
              
              if (!tokenResponse.ok) {
                const errorData = await tokenResponse.json();
                const errorMsg = errorData.error_description || errorData.error || 'Token exchange failed';
                
                // Handle specific errors
                if (errorData.hint && errorData.hint.includes('revoked')) {
                  // Code already used - clear URL and redirect to login
                  window.history.replaceState({}, document.title, window.location.pathname + window.location.hash.split('?')[0]);
                  throw new Error('Authorization code has already been used. Please try logging in again from Sphere.');
                }
                
                throw new Error(errorMsg);
              }
              
              const tokenData = await tokenResponse.json();
              console.log("Token exchange successful:", tokenData);
              
              // Create user object with proper structure
              const expiresAt = Date.now() + (tokenData.expires_in * 1000);
              
              // Decode id_token for profile
              let profile: any = {};
              if (tokenData.id_token) {
                try {
                  const parts = tokenData.id_token.split('.');
                  if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                    profile = payload;
                  }
                } catch (e) {
                  console.warn("Could not decode id_token:", e);
                }
              }
              
              // Create user data object
              const userData = {
                id_token: tokenData.id_token || '',
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                token_type: tokenData.token_type || 'Bearer',
                expires_in: tokenData.expires_in,
                expires_at: expiresAt,
                scope: tokenData.scope || 'openid profile email',
                session_state: state,
                profile: profile,
                state: state,
              };
              
              // Store directly in localStorage in the format oidc-client-ts expects
              // Format: oidc.user:{authority}:{client_id}
              const storageKey = `oidc.user:${authority}:${client_id}`;
              
              // IMPORTANT: Set token in apiService immediately so AuthContext can use it
              apiService.setToken(tokenData.access_token);
              console.log("Token set in apiService:", tokenData.access_token.substring(0, 20) + '...');
              
              // Store user data in localStorage
              localStorage.setItem(storageKey, JSON.stringify(userData));
              console.log("User stored in localStorage:", storageKey);
              
              // Create user object for immediate use
              user = {
                ...userData,
                expired: false,
              } as any;
              
              // Verify user was stored by reading it back
              const storedUser = await userManager.getUser();
              if (storedUser) {
                user = storedUser;
                console.log("User verified from localStorage");
              } else {
                console.warn("User not found in localStorage after storing, but token is set");
                // Even if getUser() fails, we have the token set, so we can continue
              }
              
              // Trigger userLoaded event manually to notify AuthContext
              // This ensures AuthContext detects the user immediately
              try {
                // Dispatch custom event that AuthContext can listen to
                window.dispatchEvent(new CustomEvent('oidc-user-loaded', { 
                  detail: { user: userData } 
                }));
                console.log("User loaded event dispatched");
              } catch (e) {
                console.warn("Failed to dispatch user loaded event:", e);
              }
              
              console.log("Manual token exchange successful");
            } else {
              // Re-throw if it's a different error
              throw callbackError;
            }
          }
        }
        
        // Ensure user is set
        if (!user) {
          throw new Error('Failed to authenticate user');
        }
        
        console.log("OIDC Callback successful, user:", user);
        
        // IMPORTANT: Set token in apiService immediately
        // This ensures ProtectedRoute can detect authenticated user
        if (user && user.access_token) {
          apiService.setToken(user.access_token);
          console.log("Token set in apiService for immediate use");
        }
        
        toast.success('Login successful!', { title: 'Welcome' });
        
        // IMPORTANT: Clear query strings (code, state) from URL and redirect to dashboard
        // Use window.location.href for full page navigation to ensure AuthContext re-initializes
        // This will trigger AuthContext to detect the authenticated user
        setTimeout(() => {
          // Clear URL and redirect to dashboard with hash routing
          window.location.href = '/#/';
        }, 500); // Small delay to show success toast
        
        console.log("Redirecting to dashboard with hash routing...");

      } catch (err: any) {
        console.error("OIDC Callback Error:", err);
        console.error("Error details:", {
          message: err.message,
          error: err.error,
          error_description: err.error_description,
          stack: err.stack
        });
        const errorMsg = err.message || 'SSO callback failed';
        setError(errorMsg);
        toast.error(errorMsg, { title: 'Authentication Failed' });
      } finally {
        setLoading(false);
      }
    };

    handleSSOCallback();
    
    // Cleanup function to prevent memory leaks
    return () => {
      // Component unmounting - nothing to clean up
    };
  }, []); // Empty dependency array - only run once on mount

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Completing Secure Login...</p>
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
                 // Retry login
                 userManager.signinRedirect();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry Login
            </button>
            <button
               onClick={() => navigate('/')}
               className="ml-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:underline"
            >
               Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}