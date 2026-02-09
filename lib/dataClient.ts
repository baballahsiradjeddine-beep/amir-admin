/**
 * Data Client Abstraction Layer
 * 
 * This module provides a unified interface for all data operations.
 * Currently uses SQLite directly, but designed to be easily replaced with IPC
 * when running in Electron.
 * 
 * TODO (Electron Integration):
 * - Replace direct SQLite calls with ipcRenderer.invoke() calls
 * - Example:
 *   export async function getCompanies(userId: string) {
 *     return await ipcRenderer.invoke('db:getCompanies', userId);
 *   }
 * - The main process will handle the actual SQLite operations
 * - This allows the renderer process to remain decoupled from Node.js APIs
 */

// Re-export types
export type {
  Company,
  Fournisseur,
  Transaction,
  FundCapital,
  CurrencyCompany,
  CurrencyTransaction,
  User,
} from './sqlite/queries';

// Import SQLite queries
import * as sqliteQueries from './sqlite/queries';

// ========== Users ==========

export async function getUserByEmail(email: string) {
  // TODO (Electron): return await ipcRenderer.invoke('db:getUserByEmail', email);
  return sqliteQueries.getUserByEmail(email);
}

export async function createUser(email: string, passwordHash: string) {
  // TODO (Electron): return await ipcRenderer.invoke('db:createUser', email, passwordHash);
  return sqliteQueries.createUser(email, passwordHash);
}

// ========== Companies ==========

export async function getCompanies(userId: string) {
  // TODO (Electron): return await ipcRenderer.invoke('db:getCompanies', userId);
  return sqliteQueries.getCompanies(userId);
}

export async function addCompany(userId: string, company: Partial<sqliteQueries.Company>) {
  // TODO (Electron): return await ipcRenderer.invoke('db:addCompany', userId, company);
  return sqliteQueries.addCompany(userId, company);
}

export async function updateCompany(companyId: string, updates: Partial<sqliteQueries.Company>) {
  // TODO (Electron): return await ipcRenderer.invoke('db:updateCompany', companyId, updates);
  return sqliteQueries.updateCompany(companyId, updates);
}

export async function deleteCompany(companyId: string) {
  // TODO (Electron): return await ipcRenderer.invoke('db:deleteCompany', companyId);
  return sqliteQueries.deleteCompany(companyId);
}

// ========== Fournisseurs ==========

export async function getFournisseurs(userId: string) {
  // TODO (Electron): return await ipcRenderer.invoke('db:getFournisseurs', userId);
  return sqliteQueries.getFournisseurs(userId);
}

export async function addFournisseur(userId: string, fournisseur: Partial<sqliteQueries.Fournisseur>) {
  // TODO (Electron): return await ipcRenderer.invoke('db:addFournisseur', userId, fournisseur);
  return sqliteQueries.addFournisseur(userId, fournisseur);
}

export async function updateFournisseur(fournisseurId: string, updates: Partial<sqliteQueries.Fournisseur>) {
  // TODO (Electron): return await ipcRenderer.invoke('db:updateFournisseur', fournisseurId, updates);
  return sqliteQueries.updateFournisseur(fournisseurId, updates);
}

export async function deleteFournisseur(fournisseurId: string) {
  // TODO (Electron): return await ipcRenderer.invoke('db:deleteFournisseur', fournisseurId);
  return sqliteQueries.deleteFournisseur(fournisseurId);
}

// ========== Transactions ==========

export async function getTransactions(userId: string) {
  // TODO (Electron): return await ipcRenderer.invoke('db:getTransactions', userId);
  return sqliteQueries.getTransactions(userId);
}

export async function addTransaction(userId: string, transaction: Partial<sqliteQueries.Transaction>) {
  // TODO (Electron): return await ipcRenderer.invoke('db:addTransaction', userId, transaction);
  return sqliteQueries.addTransaction(userId, transaction);
}

export async function deleteTransaction(transactionId: string) {
  // TODO (Electron): return await ipcRenderer.invoke('db:deleteTransaction', transactionId);
  return sqliteQueries.deleteTransaction(transactionId);
}

// ========== Fund Capital ==========

export async function getFundCapital(userId: string) {
  // TODO (Electron): return await ipcRenderer.invoke('db:getFundCapital', userId);
  return sqliteQueries.getFundCapital(userId);
}

export async function setFundCapital(userId: string, amount: number, passwordHash: string) {
  // TODO (Electron): return await ipcRenderer.invoke('db:setFundCapital', userId, amount, passwordHash);
  return sqliteQueries.setFundCapital(userId, amount, passwordHash);
}

// ========== Currency Companies ==========

export async function getCurrencyCompanies(userId: string) {
  // TODO (Electron): return await ipcRenderer.invoke('db:getCurrencyCompanies', userId);
  return sqliteQueries.getCurrencyCompanies(userId);
}

export async function addCurrencyCompany(userId: string, company: Partial<sqliteQueries.CurrencyCompany>) {
  // TODO (Electron): return await ipcRenderer.invoke('db:addCurrencyCompany', userId, company);
  return sqliteQueries.addCurrencyCompany(userId, company);
}

export async function updateCurrencyCompany(companyId: string, updates: Partial<sqliteQueries.CurrencyCompany>) {
  // TODO (Electron): return await ipcRenderer.invoke('db:updateCurrencyCompany', companyId, updates);
  return sqliteQueries.updateCurrencyCompany(companyId, updates);
}

export async function deleteCurrencyCompany(companyId: string) {
  // TODO (Electron): return await ipcRenderer.invoke('db:deleteCurrencyCompany', companyId);
  return sqliteQueries.deleteCurrencyCompany(companyId);
}

// ========== Currency Transactions ==========

export async function getCurrencyTransactions(userId: string) {
  // TODO (Electron): return await ipcRenderer.invoke('db:getCurrencyTransactions', userId);
  return sqliteQueries.getCurrencyTransactions(userId);
}

export async function addCurrencyTransaction(userId: string, transaction: Partial<sqliteQueries.CurrencyTransaction>) {
  // TODO (Electron): return await ipcRenderer.invoke('db:addCurrencyTransaction', userId, transaction);
  return sqliteQueries.addCurrencyTransaction(userId, transaction);
}

export async function deleteCurrencyTransaction(transactionId: string) {
  // TODO (Electron): return await ipcRenderer.invoke('db:deleteCurrencyTransaction', transactionId);
  return sqliteQueries.deleteCurrencyTransaction(transactionId);
}
