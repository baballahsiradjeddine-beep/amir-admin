
/**
 * Client-side API for database operations (Supabase Version)
 * 
 * This module now directly proxies calls to the Supabase queries,
 * eliminating the need for the /api/db endpoint for data operations.
 */

// Import everything from Supabase queries
export * from './supabase/queries';

// --- Auth / User Compatibility Layer ---
// The AuthContext previously used these functions. We need to keep them or
// mock them until AuthContext is fully migrated to Supabase Auth.
// Ideally, AuthContext should use supabase.auth methods directly.

import type { User } from './supabase/queries';

export async function getUserByEmail(email: string): Promise<User | null> {
  // Supabase Auth handles this internally. This function is deprecated.
  return null;
}

export async function createUser(email: string, passwordHash: string, recoveryCodeHash?: string): Promise<User> {
  // Supabase Auth handles this via signUp. This function is deprecated.
  // Returning a mock user to satisfy Type compliance if needed temporarily
  return { id: 'supabase-user', email, passwordHash: '', createdAt: '', updatedAt: '' };
}

export async function resetPassword(email: string, newPasswordHash: string): Promise<boolean> {
  // Supabase Auth handles this via resetPasswordForEmail.
  return true;
}

export async function getFirstUser(): Promise<User | null> {
  return null;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User> {
  return { id: userId, email: '', passwordHash: '', createdAt: '', updatedAt: '' };
}

export async function getUserCount(): Promise<number> {
  return 1; // Always return > 0 to bypass "Setup Required" mode in legacy auth context
}

// Deprecated Trash Type export if not in queries (it is in queries now)
// export type TrashItemType = 'company' | 'fournisseur' | 'transaction' | 'currency_company' | 'currency_transaction';
