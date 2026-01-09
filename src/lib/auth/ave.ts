// Ave OAuth PKCE Authentication for Conlanger

const AVE_AUTH_URL = 'https://aveid.net/authorize';
const AVE_TOKEN_URL = 'https://api.aveid.net/api/oauth/token';
const CLIENT_ID = import.meta.env.VITE_AVE_CLIENT_ID || 'app_410708d4acd03edd8eeb8a8eb88ecfe7';

// Generate random string for PKCE
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

// Base64 URL encoding
function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Generate code verifier for PKCE
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

// Generate code challenge from verifier
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(hash));
}

// Start the Ave login flow
export async function startAveLogin(redirectUri: string): Promise<void> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandomString(32);

  // Store for callback verification
  sessionStorage.setItem('ave_code_verifier', codeVerifier);
  sessionStorage.setItem('ave_oauth_state', state);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'profile',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  window.location.href = `${AVE_AUTH_URL}?${params.toString()}`;
}

// Handle the OAuth callback
export async function handleAveCallback(redirectUri: string): Promise<AveUser | null> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');

  if (error) {
    console.error('Ave OAuth error:', error);
    return null;
  }

  if (!code || !state) {
    return null;
  }

  // Verify state
  const savedState = sessionStorage.getItem('ave_oauth_state');
  if (state !== savedState) {
    console.error('State mismatch - possible CSRF attack');
    return null;
  }

  const codeVerifier = sessionStorage.getItem('ave_code_verifier');
  if (!codeVerifier) {
    console.error('Code verifier not found');
    return null;
  }

  try {
    // Exchange code for token - NOTE: Use camelCase field names!
    const response = await fetch(AVE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grantType: 'authorization_code',
        code: code,
        redirectUri: redirectUri,
        clientId: CLIENT_ID,
        codeVerifier: codeVerifier
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Token exchange failed:', errorData);
      return null;
    }

    const data = await response.json();

    // Clean up
    sessionStorage.removeItem('ave_code_verifier');
    sessionStorage.removeItem('ave_oauth_state');

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);

    return {
      id: data.user.id,
      handle: data.user.handle,
      displayName: data.user.displayName,
      email: data.user.email || null,
      avatarUrl: data.user.avatarUrl || null,
      accessToken: data.access_token
    };
  } catch (error) {
    console.error('Ave callback error:', error);
    return null;
  }
}

// Check if this is a callback URL
export function isAveCallback(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.has('code') && params.has('state');
}

export interface AveUser {
  id: string;
  handle: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  accessToken: string;
}
