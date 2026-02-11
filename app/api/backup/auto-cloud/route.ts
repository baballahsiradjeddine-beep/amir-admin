import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import AdmZip from 'adm-zip';
import { backupBufferToDrive } from '@/lib/backup/driveBackup';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const TABLES_IMPORT_ORDER = [
    'fund_capital',
    'companies',
    'fournisseurs',
    'currency_companies',
    'transactions',
    'fund_transactions',
    'currency_transactions',
    'trash'
];

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[Auto-Cloud] Starting automatic backup for user:', user.id);

        const backupData: Record<string, any[]> = {};

        // Fetch data from all tables
        for (const table of TABLES_IMPORT_ORDER) {
            const { data, error } = await supabase.from(table).select('*');
            if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`);
            backupData[table] = data || [];
        }

        // Generate ZIP
        const zip = new AdmZip();
        const metadata = {
            version: '2.0.0',
            exportedAt: new Date().toISOString(),
            type: 'supabase-auto-cloud-backup',
            userId: user.id
        };

        zip.addFile('data.json', Buffer.from(JSON.stringify(backupData, null, 2), 'utf8'));
        zip.addFile('metadata.json', Buffer.from(JSON.stringify(metadata, null, 2), 'utf8'));

        const zipBuffer = zip.toBuffer();

        // Upload to Google Drive
        const refreshToken = user.user_metadata?.google_refresh_token;
        const result = await backupBufferToDrive(zipBuffer, refreshToken);

        if (!result.success) {
            throw new Error(result.message);
        }

        return NextResponse.json({
            success: true,
            message: result.message,
            timestamp: result.timestamp
        });

    } catch (error: any) {
        console.error('[Auto-Cloud] Backup failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
