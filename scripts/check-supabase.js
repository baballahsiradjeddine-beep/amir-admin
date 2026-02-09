
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env.local file not found!');
    process.exit(1);
}

const envConfig = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, ''); // Remove quotes
    }
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase URL or Key in .env.local');
    process.exit(1);
}

console.log('🔄 Connecting to Supabase...');
console.log(`   URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
    try {
        // 1. Check basic connection (Auth service always responds)
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError) throw authError;
        console.log('✅ Auth Service: Connected');

        // 2. Check Database Tables (Companies)
        console.log('🔄 Checking Database Tables...');
        // We select 0 rows just to check if table exists. 
        // If RLS is on and we are anon, we might get 0 rows, but NO ERROR.
        // If table doesn't exist, we get error 42P01.
        const { error: dbError } = await supabase.from('companies').select('id').limit(1);

        if (dbError) {
            if (dbError.code === '42P01') {
                console.error('❌ Error: Table "companies" does not exist. Did you run the schema.sql script?');
            } else {
                console.error('❌ Database Error:', dbError.message);
            }
        } else {
            console.log('✅ Database: Table "companies" exists and is accessible.');
        }

        // 3. Check Transactions Table
        const { error: transError } = await supabase.from('transactions').select('id').limit(1);
        if (!transError) {
            console.log('✅ Database: Table "transactions" exists.');
        } else {
            console.error('❌ Database Error checking transactions:', transError.message);
        }

    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
    }
}

checkConnection();
