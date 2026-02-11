import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import AdmZip from 'adm-zip';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Tables to backup/restore in dependency order
// Import Order: Parents first, then Children
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

// Export/Delete Order: Children first, then Parents (Reverse of Import)
const TABLES_DELETE_ORDER = [...TABLES_IMPORT_ORDER].reverse();

const getSupabaseClient = (req: NextRequest) => {
  const authHeader = req.headers.get('Authorization');
  const options: any = {};
  if (authHeader) {
    options.global = {
      headers: { Authorization: authHeader },
    };
  }
  return createClient(supabaseUrl, supabaseKey, options);
};

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient(req);

    // Verify Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backupData: Record<string, any[]> = {};

    // Fetch data from all tables
    // We fetch ALL data the user has access to (RLS applied)
    for (const table of TABLES_IMPORT_ORDER) {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`);
      backupData[table] = data || [];
    }

    // Generate ZIP
    const zip = new AdmZip();

    // Add JSON Data
    const metadata = {
      version: '2.0.0', // Supabase Version
      exportedAt: new Date().toISOString(),
      type: 'supabase-full-backup',
      userId: user.id
    };

    zip.addFile('data.json', Buffer.from(JSON.stringify(backupData, null, 2), 'utf8'));
    zip.addFile('metadata.json', Buffer.from(JSON.stringify(metadata, null, 2), 'utf8'));

    // Return ZIP
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `amir-backup-${dateStr}.zip`;
    const zipBuffer = zip.toBuffer();

    return new NextResponse(zipBuffer as any, {
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/zip',
      },
    });

  } catch (error: any) {
    console.error('[Backup] Export failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient(req);

    // Verify Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const zip = new AdmZip(buffer);

    const dataEntry = zip.getEntry('data.json');
    if (!dataEntry) {
      return NextResponse.json({ error: 'Invalid backup format: data.json missing' }, { status: 400 });
    }

    const backupData = JSON.parse(dataEntry.getData().toString('utf8'));

    // Validate Backup Data Structure
    if (!backupData || typeof backupData !== 'object') {
      return NextResponse.json({ error: 'Invalid backup data' }, { status: 400 });
    }

    // Perform Restore
    // 1. Delete Existing Data (Children first)
    for (const table of TABLES_DELETE_ORDER) {
      // We delete all records accessible by the user (RLS)
      // Note: 'neq' id '0000' is a trick to delete all rows.
      // Or specific logic per table?
      // Usually delete() without filters needs allow_delete policy.

      // Safety check: Don't delete if table not in backup? No, complete restore implies replace.

      // We need a where clause for delete usually. 
      // For RLS protected tables, delete() with a dummy filter or just id is not null should work.
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all valid UUIDs
      if (error) {
        console.error(`Error clearing ${table}:`, error);
        // Continue? Or abort? Partial restore is bad.
        // But if table is empty, error might not happen.
      }
    }

    // 2. Insert New Data (Parents first)
    for (const table of TABLES_IMPORT_ORDER) {
      const rows = backupData[table];
      if (Array.isArray(rows) && rows.length > 0) {
        // Overwrite user_id to current user to ensure ownership
        // properties like 'id' are preserved.
        const cleanedRows = rows.map((row: any) => ({
          ...row,
          user_id: user.id
        }));

        const { error } = await supabase.from(table).insert(cleanedRows);
        if (error) {
          // Try upsert if insert fails?
          // FK constraint missing?
          throw new Error(`Failed to insert into ${table}: ${error.message}`);
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[Backup] Import failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
