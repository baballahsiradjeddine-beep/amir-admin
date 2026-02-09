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

// Backup file name on Google Drive
const BACKUP_FILE_NAME = 'bossnouadi-backup.db';
const BACKUP_FOLDER_NAME = 'BossNouadiBackups';

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
 * Get Google Drive client using Service Account credentials
 */
async function getDriveClient() {
  // TODO: Configure these environment variables
  // GOOGLE_SERVICE_ACCOUNT_KEYFILE: Path to the JSON key file
  // GOOGLE_SERVICE_ACCOUNT_KEY: JSON content of the key (alternative)

  const keyFilePath = process.env.GOOGLE_SERVICE_ACCOUNT_KEYFILE;
  const keyContent = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!keyFilePath && !keyContent) {
    throw new Error(
      'Google Drive credentials not configured. ' +
      'Set GOOGLE_SERVICE_ACCOUNT_KEYFILE or GOOGLE_SERVICE_ACCOUNT_KEY environment variable.'
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
 * Find existing backup file in Google Drive
 */
async function findBackupFile(drive: any, folderId: string): Promise<string | null> {
  const fileSearch = await drive.files.list({
    q: `name='${BACKUP_FILE_NAME}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id, name, modifiedTime)',
    orderBy: 'modifiedTime desc',
  });

  if (fileSearch.data.files && fileSearch.data.files.length > 0) {
    return fileSearch.data.files[0].id;
  }

  return null;
}

/**
 * Backup the SQLite database to Google Drive
 * 
 * @param dbPath - Path to the SQLite database file
 * @returns BackupResult with success status and details
 */
export async function backupToDrive(dbPath: string): Promise<BackupResult> {
  try {
    // Check if database file exists
    if (!fs.existsSync(dbPath)) {
      return {
        success: false,
        message: `Database file not found: ${dbPath}`,
      };
    }

    console.log('[Backup] Starting backup to Google Drive...');

    const drive = await getDriveClient();
    const folderId = await getOrCreateBackupFolder(drive);

    // Check if backup file already exists
    const existingFileId = await findBackupFile(drive, folderId);

    const fileMetadata = {
      name: BACKUP_FILE_NAME,
      parents: existingFileId ? undefined : [folderId],
    };

    const media = {
      mimeType: 'application/x-sqlite3',
      body: fs.createReadStream(dbPath),
    };

    let response;

    if (existingFileId) {
      // Update existing file
      response = await drive.files.update({
        fileId: existingFileId,
        requestBody: { name: BACKUP_FILE_NAME },
        media,
        fields: 'id, name, modifiedTime',
      });
      console.log('[Backup] Updated existing backup file');
    } else {
      // Create new file
      response = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, name, modifiedTime',
      });
      console.log('[Backup] Created new backup file');
    }

    const timestamp = new Date().toISOString();
    console.log('[Backup] Backup completed:', response.data.id);

    return {
      success: true,
      message: 'تم حفظ النسخة الاحتياطية بنجاح على Google Drive',
      fileId: response.data.id || undefined,
      timestamp,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Backup] Backup failed:', errorMessage);

    return {
      success: false,
      message: `فشل حفظ النسخة الاحتياطية: ${errorMessage}`,
    };
  }
}

/**
 * Restore the SQLite database from Google Drive
 * 
 * @param dbPath - Path where the database should be restored
 * @returns RestoreResult with success status and details
 */
export async function restoreFromDrive(dbPath: string): Promise<RestoreResult> {
  try {
    console.log('[Backup] Starting restore from Google Drive...');

    const drive = await getDriveClient();
    const folderId = await getOrCreateBackupFolder(drive);
    const fileId = await findBackupFile(drive, folderId);

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
export async function getBackupInfo(): Promise<{
  exists: boolean;
  lastModified?: string;
  fileId?: string;
}> {
  try {
    const drive = await getDriveClient();
    const folderId = await getOrCreateBackupFolder(drive);

    const fileSearch = await drive.files.list({
      q: `name='${BACKUP_FILE_NAME}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, modifiedTime)',
      orderBy: 'modifiedTime desc',
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
export function isBackupConfigured(): boolean {
  return !!(process.env.GOOGLE_SERVICE_ACCOUNT_KEYFILE || process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
}
