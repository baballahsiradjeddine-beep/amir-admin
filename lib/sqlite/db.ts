/**
 * SQLite Database Client
 * 
 * This module provides the SQLite database connection and initialization.
 * 
 * TODO (Electron Integration):
 * - When running in Electron, use app.getPath('userData') for the database path
 * - Example: const dbPath = path.join(app.getPath('userData'), 'bossnouadi.db');
 * - This module should be called from the Electron main process
 * - Use ipcMain.handle() to expose these functions to the renderer process
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database file path
// TODO (Electron): Replace with app.getPath('userData') when running in Electron
const DB_DIR = process.env.DB_PATH || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'bossnouadi.db');

// Ensure the data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Create database connection
let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_FILE);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase();
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function getDatabasePath(): string {
  return DB_FILE;
}

/**
 * Initialize database schema
 * Creates all necessary tables if they don't exist
 */
function initializeDatabase(): void {
  const database = db!;

  // Create users table (for local authentication)
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      recovery_code_hash TEXT DEFAULT NULL,
      backup_path TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  try {
    const columns = database.prepare("PRAGMA table_info(users)").all() as any[];
    const hasBackupPath = columns.some(c => c.name === 'backup_path');
    if (!hasBackupPath) {
      database.exec("ALTER TABLE users ADD COLUMN backup_path TEXT DEFAULT NULL");
      console.log('[SQLite] Added backup_path column to users table');
    }
  } catch (err) {
    console.warn('[SQLite] Failed to check/add backup_path column:', err);
  }

  // Create companies table
  database.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      owner TEXT NOT NULL,
      description TEXT,
      initial_capital INTEGER NOT NULL DEFAULT 0,
      working_capital INTEGER NOT NULL DEFAULT 0,
      share_percentage INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      image TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, name)
    );
  `);

  // Create fournisseurs table
  database.exec(`
    CREATE TABLE IF NOT EXISTS fournisseurs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      currency TEXT NOT NULL CHECK (currency IN ('USD', 'RMB', 'EUR', 'GBP', 'OTHER')),
      currencies TEXT,
      balance INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, name)
    );
  `);

  // Create transactions table
  database.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('company', 'fournisseur')),
      amount INTEGER NOT NULL,
      rate REAL NOT NULL DEFAULT 1,
      description TEXT,
      company_id TEXT,
      fournisseur_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Create fund_capital table
  database.exec(`
    CREATE TABLE IF NOT EXISTS fund_capital (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      amount INTEGER NOT NULL DEFAULT 0,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Create fund_transactions table
  database.exec(`
    CREATE TABLE IF NOT EXISTS fund_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('set', 'add', 'withdraw')),
      amount INTEGER NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Create currency_companies table
  database.exec(`
    CREATE TABLE IF NOT EXISTS currency_companies (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      base_currency TEXT NOT NULL,
      base_currencies TEXT,
      target_currency TEXT NOT NULL,
      target_currencies TEXT,
      exchange_rate REAL NOT NULL DEFAULT 1,
      commission_percentage REAL NOT NULL DEFAULT 0,
      description TEXT,
      image TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, name)
    );
  `);

  // Create currency_transactions table
  database.exec(`
    CREATE TABLE IF NOT EXISTS currency_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      currency_company_id TEXT NOT NULL,
      from_amount REAL NOT NULL,
      to_amount REAL NOT NULL,
      exchange_rate_used REAL NOT NULL,
      commission_amount REAL NOT NULL DEFAULT 0,
      description TEXT,
      usd_fournisseur_id TEXT,
      dzd_company_id TEXT,
      usd_description TEXT,
      dzd_description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Create trash table (سلة المهملات)
  database.exec(`
    CREATE TABLE IF NOT EXISTS trash (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_type TEXT NOT NULL CHECK (item_type IN ('company', 'fournisseur', 'transaction', 'currency_company', 'currency_transaction')),
      item_data TEXT NOT NULL,
      deleted_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_trash_user_id ON trash(user_id);
    CREATE INDEX IF NOT EXISTS idx_trash_deleted_at ON trash(deleted_at DESC);
  `);

  // Create indexes for better performance
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
    CREATE INDEX IF NOT EXISTS idx_fournisseurs_user_id ON fournisseurs(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_company_id ON transactions(company_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_fournisseur_id ON transactions(fournisseur_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_currency_companies_user_id ON currency_companies(user_id);
    CREATE INDEX IF NOT EXISTS idx_currency_transactions_user_id ON currency_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_currency_transactions_company_id ON currency_transactions(currency_company_id);
    CREATE INDEX IF NOT EXISTS idx_currency_transactions_created_at ON currency_transactions(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_fund_transactions_user_id ON fund_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_fund_transactions_created_at ON fund_transactions(created_at DESC);
  `);

  console.log('[SQLite] Database initialized successfully');
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
