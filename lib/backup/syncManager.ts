/**
 * Sync Manager
 * 
 * Handles automatic synchronization of the database with Google Drive.
 * Provides periodic backup functionality and online status detection.
 * 
 * TODO (Electron Integration):
 * - In Electron, run sync in main process
 * - Use ipcMain to communicate sync status to renderer
 * - Schedule sync using electron's powerMonitor for better battery handling
 */

// Types
export interface SyncStatus {
  isOnline: boolean;
  lastSync: string | null;
  isSyncing: boolean;
  error: string | null;
}

// Singleton state
let syncStatus: SyncStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastSync: null,
  isSyncing: false,
  error: null,
};

let syncInterval: NodeJS.Timeout | null = null;
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Start automatic sync
 */
export function startAutoSync(): void {
  if (typeof window === 'undefined') return;
  
  // Set up online/offline listeners
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Initial online status
  syncStatus.isOnline = navigator.onLine;
  
  // Start periodic sync
  if (!syncInterval) {
    syncInterval = setInterval(async () => {
      if (syncStatus.isOnline && !syncStatus.isSyncing) {
        await performSync();
      }
    }, SYNC_INTERVAL_MS);
    
    console.log('[Sync] Auto-sync started');
  }
  
  // Perform initial sync if online
  if (syncStatus.isOnline) {
    performSync();
  }
}

/**
 * Stop automatic sync
 */
export function stopAutoSync(): void {
  if (typeof window === 'undefined') return;
  
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('[Sync] Auto-sync stopped');
  }
}

/**
 * Handle coming online
 */
async function handleOnline(): Promise<void> {
  console.log('[Sync] Connection restored');
  syncStatus.isOnline = true;
  syncStatus.error = null;
  
  // Trigger immediate sync when coming back online
  await performSync();
}

/**
 * Handle going offline
 */
function handleOffline(): void {
  console.log('[Sync] Connection lost');
  syncStatus.isOnline = false;
}

/**
 * Perform a sync operation (backup to Google Drive)
 */
export async function performSync(): Promise<SyncStatus> {
  if (!syncStatus.isOnline) {
    syncStatus.error = 'لا يوجد اتصال بالإنترنت';
    return { ...syncStatus };
  }
  
  if (syncStatus.isSyncing) {
    return { ...syncStatus };
  }
  
  syncStatus.isSyncing = true;
  syncStatus.error = null;
  
  try {
    const response = await fetch('/api/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'backup' }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      syncStatus.lastSync = new Date().toISOString();
      syncStatus.error = null;
      console.log('[Sync] Backup completed:', syncStatus.lastSync);
    } else {
      syncStatus.error = result.message;
      console.error('[Sync] Backup failed:', result.message);
    }
  } catch (error) {
    syncStatus.error = error instanceof Error ? error.message : 'فشل المزامنة';
    console.error('[Sync] Sync error:', error);
  } finally {
    syncStatus.isSyncing = false;
  }
  
  return { ...syncStatus };
}

/**
 * Restore from Google Drive
 */
export async function performRestore(): Promise<{ success: boolean; message: string }> {
  if (!syncStatus.isOnline) {
    return { success: false, message: 'لا يوجد اتصال بالإنترنت' };
  }
  
  try {
    const response = await fetch('/api/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'restore' }),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'فشل الاستعادة';
    return { success: false, message };
  }
}

/**
 * Get current sync status
 */
export function getSyncStatus(): SyncStatus {
  return { ...syncStatus };
}

/**
 * Check backup status from server
 */
export async function checkBackupStatus(): Promise<{
  configured: boolean;
  exists?: boolean;
  lastModified?: string;
}> {
  try {
    const response = await fetch('/api/backup?action=status');
    return await response.json();
  } catch (error) {
    console.error('[Sync] Error checking backup status:', error);
    return { configured: false };
  }
}

/**
 * Manual sync trigger
 */
export async function triggerManualSync(): Promise<SyncStatus> {
  console.log('[Sync] Manual sync triggered');
  return await performSync();
}
