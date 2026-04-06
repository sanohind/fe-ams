import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

// Get OIDC configuration from environment or use defaults
const authority = import.meta.env.VITE_OIDC_AUTHORITY || 'http://127.0.0.1:8000/api';
const client_id = import.meta.env.VITE_OIDC_CLIENT_ID || '2';
const client_secret = import.meta.env.VITE_OIDC_CLIENT_SECRET;

const oidcConfig = {
  authority: authority,
  client_id: client_id,
  client_secret: client_secret, // Required for confidential clients
  redirect_uri: `${window.location.origin}/#/callback`,
  response_type: 'code',
  scope: 'openid profile email',
  post_logout_redirect_uri: `${window.location.origin}/`,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  automaticSilentRenew: true,
  loadUserInfo: true,
  // Important: Use query response mode for hash routing
  // This tells oidc-client-ts to read response from query string, not hash
  response_mode: 'query' as const,
};

export const userManager = new UserManager(oidcConfig);

export const OIDC_CONFIG = oidcConfig;
