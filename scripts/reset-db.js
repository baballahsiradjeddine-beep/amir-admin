
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database file path - matching lib/sqlite/db.ts
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'bossnouadi.db');

try {
    if (!fs.existsSync(DB_FILE)) {
        console.log('Database file not found at:', DB_FILE);
        process.exit(0);
    }

    const db = new Database(DB_FILE);
    console.log('Connected to database at:', DB_FILE);

    const tables = [
        'companies',
        'fournisseurs',
        'transactions',
        'fund_capital',
        'fund_transactions',
        'currency_companies',
        'currency_transactions',
        'trash'
    ];

    db.transaction(() => {
        for (const table of tables) {
            try {
                db.prepare(`DELETE FROM ${table}`).run();
                console.log(`Cleared table: ${table}`);
            } catch (err) {
                if (err.message.includes('no such table')) {
                    console.log(`Table ${table} does not exist, skipping.`);
                } else {
                    throw err;
                }
            }
        }
    })();

    console.log('Database reset successfully!');
    db.close();
} catch (err) {
    console.error('Error resetting database:', err);
    process.exit(1);
}
