/**
 * SQLite Database Queries
 * 
 * This module provides all database operations for the application.
 * It mirrors the existing Supabase queries API to ensure minimal UI changes.
 * 
 * TODO (Electron Integration):
 * - These functions should be exposed via ipcMain.handle() in Electron
 * - Example:
 *   ipcMain.handle('db:getCompanies', (event, userId) => getCompanies(userId));
 *   ipcMain.handle('db:addCompany', (event, userId, company) => addCompany(userId, company));
 */

import { getDatabase, generateUUID, getCurrentTimestamp } from './db';

// Type definitions (matching the existing interfaces)
export interface Company {
  id: string;
  userId: string;
  name: string;
  owner: string;
  description: string;
  initialCapital: number;
  workingCapital: number;
  sharePercentage: number;
  isActive: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Fournisseur {
  id: string;
  userId: string;
  name: string;
  currency: string;
  currencies?: string[];
  balance: number;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'company' | 'fournisseur';
  amount: number;
  rate: number;
  description: string;
  companyId?: string | null;
  fournisseurId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FundCapital {
  id: string;
  userId: string;
  amount: number;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface FundTransaction {
  id: string;
  userId: string;
  type: 'set' | 'add' | 'withdraw';
  amount: number;
  description: string;
  createdAt: string;
}

export interface CurrencyCompany {
  id: string;
  userId: string;
  name: string;
  baseCurrency: string;
  baseCurrencies?: string[];
  targetCurrency: string;
  targetCurrencies?: string[];
  exchangeRate: number;
  commissionPercentage: number;
  description: string;
  image: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CurrencyTransaction {
  id: string;
  userId: string;
  currencyCompanyId: string;
  fromAmount: number;
  toAmount: number;
  exchangeRateUsed: number;
  commissionAmount: number;
  description: string;
  usdFournisseurId?: string | null;
  dzdCompanyId?: string | null;
  usdDescription?: string | null;
  dzdDescription?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Helper: Convert snake_case DB row to camelCase object
function toCamelCase<T>(row: any): T {
  if (!row) return row;
  const result: any = {};
  for (const key in row) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      // Handle JSON arrays stored as strings
      if ((camelKey === 'currencies' || camelKey === 'baseCurrencies' || camelKey === 'targetCurrencies') && typeof row[key] === 'string') {
        try {
          result[camelKey] = JSON.parse(row[key]);
        } catch {
          result[camelKey] = row[key];
        }
      } else if (camelKey === 'isActive') {
        result[camelKey] = Boolean(row[key]);
      } else {
        result[camelKey] = row[key];
      }
    }
  }
  return result as T;
}

// Helper: Convert camelCase object to snake_case for DB
function toSnakeCase(obj: any): any {
  if (!obj) return obj;
  const result: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      // Handle arrays to JSON strings
      if (Array.isArray(obj[key])) {
        result[snakeKey] = JSON.stringify(obj[key]);
      } else if (typeof obj[key] === 'boolean') {
        result[snakeKey] = obj[key] ? 1 : 0;
      } else {
        result[snakeKey] = obj[key];
      }
    }
  }
  return result;
}

// ========== Users ==========

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  recoveryCodeHash?: string;
  backupPath?: string;
  createdAt: string;
  updatedAt: string;
}

export function getUserByEmail(email: string): User | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  return row ? toCamelCase<User>(row) : null;
}

export function getFirstUser(): User | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM users ORDER BY created_at ASC LIMIT 1').get();
  return row ? toCamelCase<User>(row) : null;
}

export function createUser(email: string, passwordHash: string, recoveryCodeHash?: string): User {
  const db = getDatabase();
  const id = generateUUID();
  const now = getCurrentTimestamp();

  db.prepare(`
    INSERT INTO users (id, email, password_hash, recovery_code_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, email, passwordHash, recoveryCodeHash || null, now, now);

  return { id, email, passwordHash, recoveryCodeHash, createdAt: now, updatedAt: now };
}

export function resetPassword(email: string, newPasswordHash: string): boolean {
  const db = getDatabase();
  const now = getCurrentTimestamp();

  const result = db.prepare(`
    UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?
  `).run(newPasswordHash, now, email);

  return result.changes > 0;
}

export function updateUser(userId: string, updates: Partial<User>): User {
  const db = getDatabase();
  const snakeUpdates = toSnakeCase(updates);
  const now = getCurrentTimestamp();

  const fields: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(snakeUpdates)) {
    if (key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(userId);

  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  return row ? toCamelCase<User>(row) : { id: userId, email: '', passwordHash: '', createdAt: '', updatedAt: '' };
}

export function getUserCount(): number {
  const db = getDatabase();
  const row = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  return row.count;
}

// ========== Companies ==========

export function getCompanies(userId: string): Company[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT * FROM companies WHERE user_id = ? ORDER BY created_at DESC
  `).all(userId);
  return rows.map(row => toCamelCase<Company>(row));
}

export function getCompanyById(id: string): Company | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
  return row ? toCamelCase<Company>(row) : null;
}

export function addCompany(userId: string, company: Partial<Company>): Company {
  const db = getDatabase();
  const id = (company as any).id ? String((company as any).id) : generateUUID();
  const now = getCurrentTimestamp();
  const snakeCompany = toSnakeCase(company);

  db.prepare(`
    INSERT INTO companies (
      id, user_id, name, owner, description, initial_capital, working_capital,
      share_percentage, is_active, image, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    snakeCompany.name || '',
    snakeCompany.owner || '',
    snakeCompany.description || '',
    snakeCompany.initial_capital || 0,
    snakeCompany.working_capital || 0,
    snakeCompany.share_percentage || 0,
    snakeCompany.is_active ?? 1,
    snakeCompany.image || null,
    now,
    now
  );

  return getCompanyById(id)!;
}

export function updateCompany(companyId: string, updates: Partial<Company>): Company {
  const db = getDatabase();
  const snakeUpdates = toSnakeCase(updates);
  const now = getCurrentTimestamp();

  const fields: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(snakeUpdates)) {
    if (key !== 'id' && key !== 'user_id' && key !== 'created_at') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(companyId);

  db.prepare(`UPDATE companies SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  return getCompanyById(companyId)!;
}

export function deleteCompany(companyId: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM companies WHERE id = ?').run(companyId);
}

// ========== Fournisseurs ==========

export function getFournisseurs(userId: string): Fournisseur[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT * FROM fournisseurs WHERE user_id = ? ORDER BY created_at DESC
  `).all(userId);
  return rows.map(row => toCamelCase<Fournisseur>(row));
}

export function getFournisseurById(id: string): Fournisseur | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM fournisseurs WHERE id = ?').get(id);
  return row ? toCamelCase<Fournisseur>(row) : null;
}

export function addFournisseur(userId: string, fournisseur: Partial<Fournisseur>): Fournisseur {
  const db = getDatabase();
  const id = (fournisseur as any).id ? String((fournisseur as any).id) : generateUUID();
  const now = getCurrentTimestamp();
  const snakeFournisseur = toSnakeCase(fournisseur);

  db.prepare(`
    INSERT INTO fournisseurs (
      id, user_id, name, currency, currencies, balance, image, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    snakeFournisseur.name || '',
    snakeFournisseur.currency || 'USD',
    snakeFournisseur.currencies || null,
    snakeFournisseur.balance || 0,
    snakeFournisseur.image || null,
    now,
    now
  );

  return getFournisseurById(id)!;
}

export function updateFournisseur(fournisseurId: string, updates: Partial<Fournisseur>): Fournisseur {
  const db = getDatabase();
  const snakeUpdates = toSnakeCase(updates);
  const now = getCurrentTimestamp();

  const fields: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(snakeUpdates)) {
    if (key !== 'id' && key !== 'user_id' && key !== 'created_at') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(fournisseurId);

  db.prepare(`UPDATE fournisseurs SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  return getFournisseurById(fournisseurId)!;
}

export function deleteFournisseur(fournisseurId: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM fournisseurs WHERE id = ?').run(fournisseurId);
}

// ========== Transactions ==========

export function getTransactions(userId: string): Transaction[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC
  `).all(userId);
  return rows.map(row => toCamelCase<Transaction>(row));
}

export function getTransactionById(id: string): Transaction | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  return row ? toCamelCase<Transaction>(row) : null;
}

export function addTransaction(userId: string, transaction: Partial<Transaction>): Transaction {
  const db = getDatabase();
  const id = (transaction as any).id ? String((transaction as any).id) : generateUUID();
  const now = getCurrentTimestamp();
  const snakeTransaction = toSnakeCase(transaction);

  db.prepare(`
    INSERT INTO transactions (
      id, user_id, type, amount, rate, description, company_id, fournisseur_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    snakeTransaction.type || 'company',
    snakeTransaction.amount || 0,
    snakeTransaction.rate || 1,
    snakeTransaction.description || '',
    snakeTransaction.company_id || null,
    snakeTransaction.fournisseur_id || null,
    now,
    now
  );

  return getTransactionById(id)!;
}

export function deleteTransaction(transactionId: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM transactions WHERE id = ?').run(transactionId);
}

// ========== Fund Capital ==========

export function getFundCapital(userId: string): FundCapital | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM fund_capital WHERE user_id = ?').get(userId);
  return row ? toCamelCase<FundCapital>(row) : null;
}

export function setFundCapital(userId: string, amount: number, passwordHash: string, recordTransaction: boolean = true): FundCapital {
  const db = getDatabase();
  const existing = getFundCapital(userId);
  const now = getCurrentTimestamp();

  if (existing) {
    db.prepare(`
      UPDATE fund_capital SET amount = ?, password_hash = ?, updated_at = ? WHERE user_id = ?
    `).run(amount, passwordHash, now, userId);
  } else {
    const id = generateUUID();
    db.prepare(`
      INSERT INTO fund_capital (id, user_id, amount, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, amount, passwordHash, now, now);
  }

  // Record a 'set' transaction in the history if requested
  if (recordTransaction) {
    addFundTransaction(userId, {
      type: 'set',
      amount: amount,
      description: existing ? 'إعادة تعيين رأس المال' : 'إعداد رأس المال الأولي'
    }, false); // Pass false to avoid recursive balance update
  }

  return getFundCapital(userId)!;
}

export function getFundTransactions(userId: string): FundTransaction[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT * FROM fund_transactions WHERE user_id = ? ORDER BY created_at DESC
  `).all(userId);
  return rows.map(row => toCamelCase<FundTransaction>(row));
}

export function addFundTransaction(userId: string, transaction: Partial<FundTransaction>, updateBalance: boolean = true): FundTransaction {
  const db = getDatabase();
  const id = generateUUID();
  const now = getCurrentTimestamp();

  db.prepare(`
    INSERT INTO fund_transactions (id, user_id, type, amount, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    transaction.type || 'add',
    transaction.amount || 0,
    transaction.description || '',
    now
  );

  // Update the main fund_capital balance if requested
  if (updateBalance) {
    const current = getFundCapital(userId);
    if (current) {
      db.prepare(`
        UPDATE fund_capital SET amount = amount + ?, updated_at = ? WHERE user_id = ?
      `).run(transaction.amount || 0, now, userId);
    }
  }

  return {
    id,
    userId,
    type: (transaction.type as any) || 'add',
    amount: transaction.amount || 0,
    description: transaction.description || '',
    createdAt: now
  };
}

// ========== Currency Companies ==========

export function getCurrencyCompanies(userId: string): CurrencyCompany[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT * FROM currency_companies WHERE user_id = ? ORDER BY created_at DESC
  `).all(userId);
  return rows.map(row => toCamelCase<CurrencyCompany>(row));
}

export function getCurrencyCompanyById(id: string): CurrencyCompany | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM currency_companies WHERE id = ?').get(id);
  return row ? toCamelCase<CurrencyCompany>(row) : null;
}

export function addCurrencyCompany(userId: string, company: Partial<CurrencyCompany>): CurrencyCompany {
  const db = getDatabase();
  const id = (company as any).id ? String((company as any).id) : generateUUID();
  const now = getCurrentTimestamp();
  const snakeCompany = toSnakeCase(company);

  db.prepare(`
    INSERT INTO currency_companies (
      id, user_id, name, base_currency, base_currencies, target_currency, target_currencies,
      exchange_rate, commission_percentage, description, image, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    snakeCompany.name || '',
    snakeCompany.base_currency || 'USD',
    snakeCompany.base_currencies || null,
    snakeCompany.target_currency || 'DZD',
    snakeCompany.target_currencies || null,
    snakeCompany.exchange_rate || 1,
    snakeCompany.commission_percentage || 0,
    snakeCompany.description || '',
    snakeCompany.image || null,
    snakeCompany.is_active ?? 1,
    now,
    now
  );

  return getCurrencyCompanyById(id)!;
}

export function updateCurrencyCompany(companyId: string, updates: Partial<CurrencyCompany>): CurrencyCompany {
  const db = getDatabase();
  const snakeUpdates = toSnakeCase(updates);
  const now = getCurrentTimestamp();

  const fields: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(snakeUpdates)) {
    if (key !== 'id' && key !== 'user_id' && key !== 'created_at') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(companyId);

  db.prepare(`UPDATE currency_companies SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  return getCurrencyCompanyById(companyId)!;
}

export function deleteCurrencyCompany(companyId: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM currency_companies WHERE id = ?').run(companyId);
}

// ========== Currency Transactions ==========

export function getCurrencyTransactions(userId: string): CurrencyTransaction[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT * FROM currency_transactions WHERE user_id = ? ORDER BY created_at DESC
  `).all(userId);
  return rows.map(row => toCamelCase<CurrencyTransaction>(row));
}

export function getCurrencyTransactionById(id: string): CurrencyTransaction | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM currency_transactions WHERE id = ?').get(id);
  return row ? toCamelCase<CurrencyTransaction>(row) : null;
}

export function addCurrencyTransaction(userId: string, transaction: Partial<CurrencyTransaction>): CurrencyTransaction {
  const db = getDatabase();
  const id = (transaction as any).id ? String((transaction as any).id) : generateUUID();
  const now = getCurrentTimestamp();
  const snakeTransaction = toSnakeCase(transaction);

  // Convert empty strings to null for foreign key fields
  const currencyCompanyId = snakeTransaction.currency_company_id || null;
  const usdFournisseurId = snakeTransaction.usd_fournisseur_id === '' ? null : snakeTransaction.usd_fournisseur_id;
  const dzdCompanyId = snakeTransaction.dzd_company_id === '' ? null : snakeTransaction.dzd_company_id;

  db.prepare(`
    INSERT INTO currency_transactions (
      id, user_id, currency_company_id, from_amount, to_amount, exchange_rate_used,
      commission_amount, description, usd_fournisseur_id, dzd_company_id,
      usd_description, dzd_description, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    currencyCompanyId,
    snakeTransaction.from_amount || 0,
    snakeTransaction.to_amount || 0,
    snakeTransaction.exchange_rate_used || 1,
    snakeTransaction.commission_amount || 0,
    snakeTransaction.description || '',
    usdFournisseurId || null,
    dzdCompanyId || null,
    snakeTransaction.usd_description || null,
    snakeTransaction.dzd_description || null,
    now,
    now
  );

  return getCurrencyTransactionById(id)!;
}

export function deleteCurrencyTransaction(transactionId: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM currency_transactions WHERE id = ?').run(transactionId);
}

// ========== Trash (سلة المهملات) ==========

export interface TrashItem {
  id: string;
  userId: string;
  itemType: 'company' | 'fournisseur' | 'transaction' | 'currency_company' | 'currency_transaction';
  itemData: Record<string, unknown>;
  deletedAt: string;
}

export function addTrashItem(userId: string, itemType: TrashItem['itemType'], itemData: Record<string, unknown>): TrashItem {
  const db = getDatabase();
  const id = generateUUID();
  const now = getCurrentTimestamp();
  db.prepare(`
    INSERT INTO trash (id, user_id, item_type, item_data, deleted_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, userId, itemType, JSON.stringify(itemData), now);
  const row = db.prepare('SELECT * FROM trash WHERE id = ?').get(id) as any;
  return {
    id: row.id,
    userId: row.user_id,
    itemType: row.item_type,
    itemData: JSON.parse(row.item_data),
    deletedAt: row.deleted_at,
  };
}

export function getTrashItems(userId: string): TrashItem[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT * FROM trash WHERE user_id = ? ORDER BY deleted_at DESC
  `).all(userId) as any[];
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    itemType: row.item_type,
    itemData: JSON.parse(row.item_data),
    deletedAt: row.deleted_at,
  }));
}

export function removeTrashItem(trashId: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM trash WHERE id = ?').run(trashId);
}

// ========== Reset Database ==========

export function resetUserDatabase(userId: string): void {
  const db = getDatabase();
  const queries = [
    'DELETE FROM companies WHERE user_id = ?',
    'DELETE FROM fournisseurs WHERE user_id = ?',
    'DELETE FROM transactions WHERE user_id = ?',
    'DELETE FROM fund_capital WHERE user_id = ?',
    'DELETE FROM fund_transactions WHERE user_id = ?',
    'DELETE FROM currency_companies WHERE user_id = ?',
    'DELETE FROM currency_transactions WHERE user_id = ?',
    'DELETE FROM trash WHERE user_id = ?'
  ];

  const transaction = db.transaction((userId: string) => {
    for (const query of queries) {
      db.prepare(query).run(userId);
    }
  });

  transaction(userId);
}
