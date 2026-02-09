
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'bossnouadi.db');
console.log('Opening DB at:', dbPath);
const db = new Database(dbPath);

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
}

const email = 'siradj.eddine.baballah@gmail.com';
const newPassword = 'testtest';
const newHash = simpleHash(newPassword);

console.log('Resetting password for:', email);
console.log('New Password:', newPassword);
console.log('New Hash:', newHash);

try {
    const info = db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(newHash, email);

    if (info.changes > 0) {
        console.log('Password updated successfully.');
    } else {
        console.log('User not found or update failed.');
    }
} catch (error) {
    console.error('Error updating password:', error);
}
