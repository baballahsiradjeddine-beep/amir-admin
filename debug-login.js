
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'bossnouadi.db');
console.log('Opening DB at:', dbPath);
const db = new Database(dbPath);

const email = 'siradj.eddine.baballah@gmail.com';
const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
}

if (user) {
    console.log('User found:', user);
    console.log('Stored Hash:', user.password_hash);
    console.log('Hash of "testtest":', simpleHash('testtest'));

    if (user.password_hash === simpleHash('testtest')) {
        console.log('Password MATCHES!');
    } else {
        console.log('Password DOES NOT MATCH.');
    }
} else {
    console.log('User NOT found with email:', email);
    const allUsers = db.prepare('SELECT email FROM users').all();
    console.log('Existing users:', allUsers.map(u => u.email));
}
