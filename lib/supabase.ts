/**
 * Legacy Supabase Client - DEPRECATED
 * 
 * This file is kept for backwards compatibility but is no longer used.
 * The application now uses local SQLite database instead of Supabase.
 * 
 * See /lib/sqlite/db.ts for the new database implementation.
 * See /lib/api-client.ts for the new data access layer.
 */

// Legacy types - kept for reference
export interface Company {
  id: string;
  user_id: string;
  name: string;
  owner: string;
  description: string;
  initial_capital: number;
  working_capital: number;
  share_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Fournisseur {
  id: string;
  user_id: string;
  name: string;
  currency: 'USD' | 'RMB';
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'company' | 'fournisseur';
  amount: number;
  rate: number;
  description: string;
  company_id?: string;
  fournisseur_id?: string;
  created_at: string;
  updated_at: string;
}

export interface FundCapital {
  id: string;
  user_id: string;
  amount: number;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

// Placeholder export to prevent import errors
export const supabase = null;
