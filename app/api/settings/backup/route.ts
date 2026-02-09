import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/sqlite/db';
import fs from 'fs';
import { getUserByEmail } from '@/lib/sqlite/queries';

export async function POST(req: NextRequest) {
    try {
        const { email, path: backupPath } = await req.json();

        if (!email || !backupPath) {
            return NextResponse.json({ error: 'Missing email or path' }, { status: 400 });
        }

        // Verify user exists (basic check, normally we use session)
        const db = getDatabase();
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify path exists and is a directory
        try {
            if (!fs.existsSync(backupPath)) {
                return NextResponse.json({ error: 'المسار غير موجود. تأكد من صحة الرابط.' }, { status: 400 });
            }
            const stats = fs.statSync(backupPath);
            if (!stats.isDirectory()) {
                return NextResponse.json({ error: 'المسار المحدد ليس مجلداً.' }, { status: 400 });
            }
            // Try write permission check
            try {
                fs.accessSync(backupPath, fs.constants.W_OK);
            } catch {
                return NextResponse.json({ error: 'لا يملك البرنامج صلاحية الكتابة في هذا المجلد.' }, { status: 400 });
            }

        } catch (e) {
            return NextResponse.json({ error: 'مسار غير صالح' }, { status: 400 });
        }

        // Update User
        db.prepare("UPDATE users SET backup_path = ?, updated_at = datetime('now') WHERE email = ?").run(backupPath, email);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Settings] Update Backup Path failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
