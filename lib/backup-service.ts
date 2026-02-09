import { getDatabase, getDatabasePath } from '@/lib/sqlite/db';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

export async function performAutoBackup(userId?: string) {
    try {
        const db = getDatabase();

        // Get user backup path
        let user;
        if (userId) {
            user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
        } else {
            // Fallback to first user (Owner) if no ID provided (common in single-tenant local apps)
            user = db.prepare('SELECT * FROM users ORDER BY created_at ASC LIMIT 1').get() as any;
        }

        if (!user || !user.backup_path) {
            return; // No backup path configured
        }

        const backupPath = user.backup_path;

        // Validate path again before working
        if (!fs.existsSync(backupPath)) return;

        // Create temp DB copy
        const tempDbPath = path.join(path.dirname(getDatabasePath()), `temp-auto-backup-${Date.now()}.db`);
        db.prepare(`VACUUM INTO ?`).run(tempDbPath);

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        const zip = new AdmZip();

        zip.addLocalFile(tempDbPath, '', 'bossnouadi.db');
        if (fs.existsSync(uploadsDir)) {
            zip.addLocalFolder(uploadsDir, 'uploads');
        }

        const metadata = JSON.stringify({
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            type: 'auto-backup'
        }, null, 2);
        zip.addFile('backup-info.json', Buffer.from(metadata, 'utf8'));

        // Write directly to user's folder with a date-based filename
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const targetFile = path.join(backupPath, `bossnouadi-backup-${dateStr}.zip`);
        zip.writeZip(targetFile);

        // Rotation Logic: Keep last 30 daily backups
        try {
            const files = fs.readdirSync(backupPath);
            const dailyBackups = files
                .filter(f => f.startsWith('bossnouadi-backup-') && f.endsWith('.zip'))
                .sort(); // Lexicographical sort works for YYYY-MM-DD

            if (dailyBackups.length > 30) {
                const toDelete = dailyBackups.slice(0, dailyBackups.length - 30);
                for (const fileToDelete of toDelete) {
                    const fullPath = path.join(backupPath, fileToDelete);
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                    }
                }
            }
        } catch (rotationError) {
            console.error('[Backup] Rotation failed:', rotationError);
        }

        // Cleanup temp file
        if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);

        console.log(`[Backup] Daily auto-backup saved to: ${targetFile}`);

    } catch (error) {
        console.error('[Backup] Auto-backup failed:', error);
    }
}
