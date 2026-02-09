/**
 * Legacy Supabase Queries - DEPRECATED
 * 
 * This file is kept for backwards compatibility but is no longer used.
 * The application now uses local SQLite database instead of Supabase.
 * 
 * See /lib/api-client.ts for the new data access layer.
 * See /lib/sqlite/queries.ts for the SQLite implementations.
 */

console.warn('[DEPRECATED] Supabase queries are no longer used. Use /lib/api-client.ts instead.');

// Re-export from the new API client to maintain compatibility
export {
  getCompanies,
  addCompany,
  updateCompany,
  deleteCompany,
  getFournisseurs,
  addFournisseur,
  updateFournisseur,
  deleteFournisseur,
  getTransactions,
  addTransaction,
  deleteTransaction,
  getFundCapital,
  setFundCapital,
  getCurrencyCompanies,
  addCurrencyCompany,
  updateCurrencyCompany,
  deleteCurrencyCompany,
  getCurrencyTransactions,
  addCurrencyTransaction,
  deleteCurrencyTransaction,
} from './api-client';

// Legacy exports kept for backwards compatibility
export const supabaseAdmin = null;
