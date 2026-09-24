import { create } from 'zustand';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/models';

interface AuthStore {
  // Supabase session state
  session: Session | null;
  supabaseUser: User | null;

  // App-level user profile (from profiles table)
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => () => void; // returns unsubscribe
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, name?: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  loginWithOAuth: (provider: 'google' | 'apple') => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  setUser: (user: UserProfile) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()((set) => ({
  session: null,
  supabaseUser: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: () => {
    if (!supabaseConfigured) { set({ isLoading: false }); return () => {}; }
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        supabaseUser: session?.user ?? null,
        isAuthenticated: !!session,
        isLoading: false,
      });
    });

    // Listen for auth state changes (login, logout, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        supabaseUser: session?.user ?? null,
        isAuthenticated: !!session,
        isLoading: false,
      });
    });

    return () => subscription.unsubscribe();
  },

  login: async (email, password) => {
    if (!supabaseConfigured) { const error = 'This installation is in demo mode. Configure your own backend to use accounts.'; set({ error, isLoading: false }); return { error }; }
    set({ error: null, isLoading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ error: error.message, isLoading: false });
      return { error: error.message };
    }
    set({ isLoading: false });
    return { error: null };
  },

  signup: async (email, password, name) => {
    if (!supabaseConfigured) { const error = 'This installation is in demo mode. Configure your own backend to use accounts.'; set({ error, isLoading: false }); return { error, needsConfirmation: false }; }
    set({ error: null, isLoading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      set({ error: error.message, isLoading: false });
      return { error: error.message, needsConfirmation: false };
    }

    // Supabase returns a user with identities=[] when email already exists
    // and email confirmations are enabled
    const needsConfirmation = !!data.user && !data.session;
    set({ isLoading: false });
    return { error: null, needsConfirmation };
  },

  loginWithOAuth: async (provider) => {
    if (!supabaseConfigured) { set({ error: 'Accounts require your own backend configuration.' }); return; }
    set({ error: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      set({ error: error.message });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null, supabaseUser: null, user: null, isAuthenticated: false, error: null });
  },

  resetPassword: async (email) => {
    if (!supabaseConfigured) { const error = 'This installation is in demo mode. Configure your own backend to use accounts.'; set({ error, isLoading: false }); return { error }; }
    set({ error: null });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    if (error) {
      set({ error: error.message });
      return { error: error.message };
    }
    return { error: null };
  },

  updatePassword: async (newPassword) => {
    if (!supabaseConfigured) { const error = 'This installation is in demo mode. Configure your own backend to use accounts.'; set({ error, isLoading: false }); return { error }; }
    set({ error: null });
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      set({ error: error.message });
      return { error: error.message };
    }
    return { error: null };
  },

  setUser: (user) => set({ user }),
  clearError: () => set({ error: null }),
}));
