import { writable, derived, get } from 'svelte/store';
import { ConvexClient } from 'convex/browser';

// Create Convex client
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || '';
export const convex = new ConvexClient(CONVEX_URL);

// Generate unique session ID for presence
export const sessionId = typeof window !== 'undefined' 
  ? `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  : '';

// Auth state
export interface User {
  _id: string;
  aveId: string;
  handle: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    token: null,
    loading: true
  });

  return {
    subscribe,
    setUser: (user: User | null, token: string | null) => {
      update(state => ({ ...state, user, token, loading: false }));
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    },
    setLoading: (loading: boolean) => {
      update(state => ({ ...state, loading }));
    },
    logout: () => {
      localStorage.removeItem('auth_token');
      set({ user: null, token: null, loading: false });
    },
    init: async () => {
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const user = await convex.query('auth:getCurrentUser' as any, { token });
          if (user) {
            set({ user: user as User, token, loading: false });
            return;
          }
        } catch (e) {
          console.error('Failed to restore session:', e);
        }
      }
      set({ user: null, token: null, loading: false });
    }
  };
}

export const auth = createAuthStore();

// Derived stores for convenience
export const user = derived(auth, $auth => $auth.user);
export const isAuthenticated = derived(auth, $auth => $auth.user !== null);
export const isLoading = derived(auth, $auth => $auth.loading);

// Logout function
export async function logout(): Promise<void> {
  const token = getToken();
  if (token) {
    try {
      await runMutation('auth:deleteSession', { token });
    } catch (e) {
      console.error('Failed to delete session:', e);
    }
  }
  auth.logout();
}

// Helper to get current user ID
export function getUserId(): string | null {
  const state = get(auth);
  return state.user?._id ?? null;
}

// Helper to get token
export function getToken(): string | null {
  const state = get(auth);
  return state.token;
}

// Helper to run mutations
export async function runMutation<T>(
  mutationName: string,
  args: Record<string, unknown>
): Promise<T> {
  return await convex.mutation(mutationName as any, args);
}

// Helper to run queries (one-time)
export async function runQuery<T>(
  queryName: string,
  args: Record<string, unknown>
): Promise<T> {
  return await convex.query(queryName as any, args);
}

// Create a reactive store that subscribes to Convex queries
export function createConvexStore<T>(
  queryName: string,
  argsGetter: () => Record<string, unknown>
) {
  const { subscribe, set } = writable<{ data: T | null; loading: boolean; error: string | null }>({
    data: null,
    loading: true,
    error: null
  });

  let unsubscribe: (() => void) | null = null;
  let started = false;

  function start() {
    if (started || typeof window === 'undefined') return;
    started = true;

    const args = argsGetter();
    
    try {
      unsubscribe = convex.onUpdate(
        queryName as any,
        args,
        (result: T) => {
          set({ data: result, loading: false, error: null });
        }
      );
    } catch (e) {
      set({ data: null, loading: false, error: String(e) });
    }
  }

  function stop() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    started = false;
  }

  return {
    subscribe: (run: (value: { data: T | null; loading: boolean; error: string | null }) => void) => {
      start();
      const unsub = subscribe(run);
      return () => {
        unsub();
        stop();
      };
    },
    refresh: () => {
      stop();
      set({ data: null, loading: true, error: null });
      start();
    }
  };
}
