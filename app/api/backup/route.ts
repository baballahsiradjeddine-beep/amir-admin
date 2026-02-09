import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, closeDatabase, getDatabasePath } from '@/lib/sqlite/db';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

export async function GET() {
  try {
    const db = getDatabase();
    // 1. Create a transaction-safe copy of DB
    const tempDbPath = path.join(path.dirname(getDatabasePath()), `temp-backup-${Date.now()}.db`);
    db.prepare(`VACUUM INTO ?`).run(tempDbPath);

    // 2. Prepare paths
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    // 3. Initialize AdmZip
    const zip = new AdmZip();

    // A. Add Database File
    zip.addLocalFile(tempDbPath, '', 'bossnouadi.db');

    // B. Add Uploads Folder (if exists)
    if (fs.existsSync(uploadsDir)) {
      zip.addLocalFolder(uploadsDir, 'uploads');
    }

    // C. Add Metadata
    const metadata = JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      type: 'full-backup'
    }, null, 2);
    zip.addFile('backup-info.json', Buffer.from(metadata, 'utf8'));

    // 4. Generate Buffer
    const zipBuffer = zip.toBuffer();

    // Clean up temp DB
    if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `bossnouadi-full-backup-${dateStr}.zip`;

    return new NextResponse(zipBuffer as any, {
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/zip',
      },
    });

  } catch (error: any) {
    console.error('[Backup] Export failed:', error);
    return NextResponse.json(
      { error: error.message || 'Export failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const isZip = file.name.endsWith('.zip');

    if (!isZip && !file.name.endsWith('.db') && !file.name.endsWith('.sqlite')) {
      return NextResponse.json({ error: 'Invalid file format. Please upload .zip or .db' }, { status: 400 });
    }

    // 1. Close DB Connection
    closeDatabase();

    const dbPath = getDatabasePath();
    const uploadsPath = path.join(process.cwd(), 'public', 'uploads');

    // Safety Backup of current state
    const safetyTs = Date.now();
    if (fs.existsSync(dbPath)) fs.copyFileSync(dbPath, `${dbPath}.old-${safetyTs}`);

    const buffer = Buffer.from(await file.arrayBuffer());

    if (isZip) {
      // --- Handle ZIP Restore ---
      const zip = new AdmZip(buffer);
      const zipEntries = zip.getEntries();

      zipEntries.forEach(function (zipEntry) {
        if (zipEntry.entryName === 'bossnouadi.db') {
          // Extract DB directly to rewrite the file
          fs.writeFileSync(dbPath, zipEntry.getData());
        } else if (zipEntry.entryName.startsWith('uploads/') && !zipEntry.isDirectory) {
          // Extract Image
          // entryName is like "uploads/image.png"
          const fileName = zipEntry.entryName.replace(/^uploads\//, '');
          if (fileName) {
            const targetPath = path.join(uploadsPath, fileName);
            const targetDir = path.dirname(targetPath);
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
            fs.writeFileSync(targetPath, zipEntry.getData());
          }
        }
      });

    } else {
      // --- Handle Legacy DB Restore ---
      fs.writeFileSync(dbPath, buffer);
    }

    // Force Re-init implicitly by next request calling getDatabase()

    return NextResponse.json({ success: true, mode: isZip ? 'full' : 'db-only' });
  } catch (error: any) {
    console.error('[Backup] Import failed:', error);
    return NextResponse.json(
      { error: error.message || 'Import failed' },
      { status: 500 }
    );
  }
}
