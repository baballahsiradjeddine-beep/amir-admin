/**
 * Google Drive Backup Module
 * 
 * This module provides backup and restore functionality for the SQLite database
 * using Google Drive API.
 * 
 * TODO (Electron Integration):
 * - In Electron, this module should run in the main process
 * - Use ipcMain.handle() to expose backup/restore functions to renderer
 * - Example:
 *   ipcMain.handle('backup:toDrive', () => backupToDrive(getDatabasePath()));
 *   ipcMain.handle('backup:fromDrive', () => restoreFromDrive(getDatabasePath()));
 * 
 * Configuration:
 * - Set GOOGLE_SERVICE_ACCOUNT_KEYFILE environment variable to the path of your
 *   Google Cloud Service Account JSON key file
 * - Or set GOOGLE_SERVICE_ACCOUNT_KEY with the JSON content directly
 * - The Service Account must have access to Google Drive API
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Backup configuration
const BACKUP_PREFIX = 'backup-';
const BACKUP_EXTENSION = '.db';
const BACKUP_FOLDER_NAME = 'BossNouadiBackups';
const MAX_BACKUPS = 30;

/**
 * Generate a timestamped backup filename
 */
function generateBackupFileName(): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  return `${BACKUP_PREFIX}${dateStr}${BACKUP_EXTENSION}`;
}


// Types
export interface BackupResult {
  success: boolean;
  message: string;
  fileId?: string;
  timestamp?: string;
}

export interface RestoreResult {
  success: boolean;
  message: string;
  timestamp?: string;
}

/**
 * Get Google Drive client
 * Supports both OAuth2 (User) and Service Account
 */
async function getDriveClient(refreshToken?: string) {
  // 1. If refreshToken is provided, use User OAuth2
  if (refreshToken) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return google.drive({ version: 'v3', auth: oauth2Client });
  }

  // 2. Fallback to Service Account
  const keyFilePath = process.env.GOOGLE_SERVICE_ACCOUNT_KEYFILE;
  const keyContent = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!keyFilePath && !keyContent) {
    throw new Error(
      'Google Drive credentials not configured. ' +
      'Please link your account or set Service Account environment variables.'
    );
  }

  let credentials;

  if (keyContent) {
    try {
      credentials = JSON.parse(keyContent);
    } catch {
      throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_KEY JSON format');
    }
  } else if (keyFilePath) {
    if (!fs.existsSync(keyFilePath)) {
      throw new Error(`Service account key file not found: ${keyFilePath}`);
    }
    const keyFileContent = fs.readFileSync(keyFilePath, 'utf8');
    credentials = JSON.parse(keyFileContent);
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * Find or create the backup folder in Google Drive
 */
async function getOrCreateBackupFolder(drive: any): Promise<string> {
  // Search for existing folder
  const folderSearch = await drive.files.list({
    q: `name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });

  if (folderSearch.data.files && folderSearch.data.files.length > 0) {
    return folderSearch.data.files[0].id;
  }

  // Create new folder
  const folderMetadata = {
    name: BACKUP_FOLDER_NAME,
    mimeType: 'application/vnd.google-apps.folder',
  };

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id',
  });

  console.log('[Backup] Created backup folder:', folder.data.id);
  return folder.data.id;
}

/**
 * Clean up old backups, keeping only the most recent MAX_BACKUPS
 */
async function cleanupOldBackups(drive: any, folderId: string) {
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and name contains '${BACKUP_PREFIX}' and trashed=false`,
      fields: 'files(id, name, createdTime)',
      orderBy: 'createdTime desc',
    });

    const files = response.data.files || [];

    if (files.length > MAX_BACKUPS) {
      console.log(`[Backup] Found ${files.length} backups, cleaning up ${files.length - MAX_BACKUPS} oldest ones...`);

      const filesToDelete = files.slice(MAX_BACKUPS);
      for (const file of filesToDelete) {
        if (file.id) {
          await drive.files.delete({ fileId: file.id });
          console.log(`[Backup] Deleted old backup: ${file.name} (${file.id})`);
        }
      }
    }
  } catch (error) {
    console.error('[Backup] Cleanup failed:', error);
  }
}

/**
 * Find the latest backup file in Google Drive
 */
async function findLatestBackupFile(drive: any, folderId: string): Promise<string | null> {
  const fileSearch = await drive.files.list({
    q: `'${folderId}' in parents and name contains '${BACKUP_PREFIX}' and trashed=false`,
    fields: 'files(id, name, modifiedTime)',
    orderBy: 'modifiedTime desc',
    pageSize: 1,
  });

  if (fileSearch.data.files && fileSearch.data.files.length > 0) {
    return fileSearch.data.files[0].id;
  }

  return null;
}


/**
 * Backup a data buffer (e.g. ZIP of Supabase data) to Google Drive
 */
export async function backupBufferToDrive(content: Buffer, refreshToken?: string, customFileName?: string): Promise<BackupResult> {
  try {
    console.log('[Backup] Starting buffer backup to Google Drive...');

    const drive = await getDriveClient(refreshToken);
    const folderId = await getOrCreateBackupFolder(drive);

    const fileName = customFileName || generateBackupFileName();

    // Check if a backup with this name already exists
    const existingFileSearch = await drive.files.list({
      q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id)',
    });

    const body = new (require('stream').PassThrough)();
    body.end(content);
    const media = { mimeType: 'application/zip', body };

    let response;
    const fileId = existingFileSearch.data.files?.[0]?.id;

    if (fileId) {
      response = await drive.files.update({
        fileId: fileId,
        requestBody: { name: fileName },
        media,
        fields: 'id, name, modifiedTime',
      });
      console.log('[Backup] Updated existing backup file:', fileName);
    } else {
      response = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
        },
        media,
        fields: 'id, name, modifiedTime',
      });
      console.log('[Backup] Created new backup file:', fileName);
    }

    // Clean up old backups (keep only 30)
    await cleanupOldBackups(drive, folderId);

    const timestamp = new Date().toISOString();
    return {
      success: true,
      message: 'تم حفظ النسخة السحابية بنجاح على Google Drive (يتم الاحتفاظ بآخر 30 نسخة)',
      fileId: (response as any).data.id || undefined,
      timestamp,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Backup] Buffer backup failed:', errorMessage);
    return { success: false, message: `فشل الحفظ السحابي: ${errorMessage}` };
  }
}

/**
 * Backup the SQLite database to Google Drive
 * 
 * @param dbPath - Path to the SQLite database file
 * @returns BackupResult with success status and details
 */
export async function backupToDrive(dbPath: string, refreshToken?: string): Promise<BackupResult> {
  try {
    if (!fs.existsSync(dbPath)) {
      return { success: false, message: `Database file not found: ${dbPath}` };
    }

    console.log('[Backup] Starting backup to Google Drive...');

    const drive = await getDriveClient(refreshToken);
    const folderId = await getOrCreateBackupFolder(drive);

    const fileName = generateBackupFileName();

    // Check if a backup for TODAY already exists to avoid duplicates
    const existingFileSearch = await drive.files.list({
      q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id)',
    });

    const fileId = existingFileSearch.data.files?.[0]?.id;
    const body = fs.createReadStream(dbPath);
    const media = { mimeType: 'application/x-sqlite3', body };

    let response;

    if (fileId) {
      // Update today's backup if it already exists
      response = await drive.files.update({
        fileId: fileId,
        requestBody: { name: fileName },
        media,
        fields: 'id, name, modifiedTime',
      });
      console.log('[Backup] Updated today\'s backup file');
    } else {
      // Create a brand new backup file for today
      response = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
        },
        media,
        fields: 'id, name, modifiedTime',
      });
      console.log('[Backup] Created new backup file for today');
    }

    // Clean up old backups (keep only 30)
    await cleanupOldBackups(drive, folderId);

    const timestamp = new Date().toISOString();
    return {
      success: true,
      message: 'تم حفظ النسخة الاحتياطية بنجاح على Google Drive (يتم الاحتفاظ بآخر 30 نسخة)',
      fileId: (response as any).data.id || undefined,
      timestamp,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Backup] Backup failed:', errorMessage);
    return { success: false, message: `فشل حفظ النسخة الاحتياطية: ${errorMessage}` };
  }
}

/**
 * Restore the SQLite database from Google Drive
 * 
 * @param dbPath - Path where the database should be restored
 * @returns RestoreResult with success status and details
 */
export async function restoreFromDrive(dbPath: string, refreshToken?: string): Promise<RestoreResult> {
  try {
    console.log('[Backup] Starting restore from Google Drive...');

    const drive = await getDriveClient(refreshToken);
    const folderId = await getOrCreateBackupFolder(drive);
    const fileId = await findLatestBackupFile(drive, folderId);

    if (!fileId) {
      return {
        success: false,
        message: 'لم يتم العثور على نسخة احتياطية على Google Drive',
      };
    }

    // Ensure the directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Create a backup of the current database before restoring
    if (fs.existsSync(dbPath)) {
      const backupPath = `${dbPath}.backup-${Date.now()}`;
      fs.copyFileSync(dbPath, backupPath);
      console.log('[Backup] Created local backup before restore:', backupPath);
    }

    // Download the file
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    // Write to file
    const dest = fs.createWriteStream(dbPath);

    await new Promise<void>((resolve, reject) => {
      response.data
        .on('end', () => {
          console.log('[Backup] File download completed');
          resolve();
        })
        .on('error', (err: Error) => {
          console.error('[Backup] Download error:', err);
          reject(err);
        })
        .pipe(dest);
    });

    const timestamp = new Date().toISOString();
    console.log('[Backup] Restore completed');

    return {
      success: true,
      message: 'تم استعادة النسخة الاحتياطية بنجاح',
      timestamp,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Backup] Restore failed:', errorMessage);

    return {
      success: false,
      message: `فشل استعادة النسخة الاحتياطية: ${errorMessage}`,
    };
  }
}

/**
 * Get information about the latest backup on Google Drive
 */
export async function getBackupInfo(refreshToken?: string): Promise<{
  exists: boolean;
  lastModified?: string;
  fileId?: string;
}> {
  try {
    const drive = await getDriveClient(refreshToken);
    const folderId = await getOrCreateBackupFolder(drive);

    const fileSearch = await drive.files.list({
      q: `'${folderId}' in parents and name contains '${BACKUP_PREFIX}' and trashed=false`,
      fields: 'files(id, name, modifiedTime)',
      orderBy: 'modifiedTime desc',
      pageSize: 1,
    });

    if (fileSearch.data.files && fileSearch.data.files.length > 0) {
      const file = fileSearch.data.files[0];
      return {
        exists: true,
        lastModified: file.modifiedTime || undefined,
        fileId: file.id || undefined,
      };
    }

    return { exists: false };
  } catch (error) {
    console.error('[Backup] Error getting backup info:', error);
    return { exists: false };
  }
}

/**
 * Check if Google Drive credentials are configured
 */
export function isBackupConfigured(refreshToken?: string): boolean {
  return !!(refreshToken || process.env.GOOGLE_SERVICE_ACCOUNT_KEYFILE || process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
}
