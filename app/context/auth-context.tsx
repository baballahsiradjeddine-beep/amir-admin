'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  backupPath?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { email?: string; password?: string; backupPath?: string }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isLoading: boolean;
  isInitialized: boolean;
  isSetupRequired: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSetupRequired, setIsSetupRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Helper to map Supabase user to our internal user shape
  const mapUser = (sbUser: SupabaseUser): User => {
    return {
      id: sbUser.id,
      email: sbUser.email || '',
      backupPath: sbUser.user_metadata?.backup_path || undefined,
    };
  };

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If login fails, try signup (just for seamless first-time experience if desired, or throw error)
        // Check if error is 'Invalid login credentials' - standard auth flow
        // For this specific app migration, maybe check if user exists.
        // Let's stick to standard behavior: Throw if invalid.
        throw error;
      }

      if (data.user) {
        setUser(mapUser(data.user));
        console.log('[Auth] User logged in:', data.user.email);
      }
    } catch (err: any) {
      console.error('[Auth] Login error:', err.message);
      setError(err.message === 'Invalid login credentials' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dashboard/settings`, // Page where user can update password
      });

      if (error) throw error;
      console.log('[Auth] Password reset email sent');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: { email?: string; password?: string; backupPath?: string }) => {
    setIsLoading(true);
    try {
      const updates: any = {};

      if (data.email) updates.email = data.email;
      if (data.password) updates.password = data.password;
      if (data.backupPath !== undefined) {
        updates.data = { backup_path: data.backupPath };
      }

      const { data: updatedUser, error } = await supabase.auth.updateUser(updates);

      if (error) throw error;

      if (updatedUser.user) {
        setUser(mapUser(updatedUser.user));
        console.log('[Auth] Profile updated');
      }
    } catch (err: any) {
      console.error('[Auth] Profile update error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  }, [router]);

  // Initial Session Check & Listener
  useEffect(() => {
    const initAuth = async () => {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(mapUser(session.user));
      } else {
        setUser(null);
      }

      setIsInitialized(true);

      // Listen for changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(mapUser(session.user));
        } else {
          setUser(null);
        }
        setIsInitialized(true);
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateProfile,
        resetPassword,
        isLoading,
        isInitialized,
        isSetupRequired,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (undefined === context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
