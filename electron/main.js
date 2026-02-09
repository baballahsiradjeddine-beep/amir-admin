const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

// Logging setup
const logFile = path.join(app.getPath('userData'), 'debug.log');
const log = (m) => {
    try {
        console.log(m);
        fs.appendFileSync(logFile, new Date().toISOString() + ': ' + m + '\n');
    } catch (e) { }
};

log('--- APPLICATION STARTING ---');

let mainWindow;
let serverProcess;

// IPC Handlers
ipcMain.handle('select-directory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    if (canceled) {
        return null;
    } else {
        return filePaths[0];
    }
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        backgroundColor: '#020817',
        show: false,
        icon: path.join(__dirname, '../public/logo.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Clear cache to resolve "Failed to load chunk" errors in development
    mainWindow.webContents.session.clearCache().then(() => {
        log('Cleared window cache');
    });

    Menu.setApplicationMenu(null);
    mainWindow.once('ready-to-show', () => mainWindow.show());

    // Listen for load failures
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        log(`CRITICAL: Failed to load URL ${validatedURL}: ${errorDescription} (${errorCode})`);
    });


    // Splash Screen HTML as Base64 to prevent rendering issues
    const splashHtml = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
        <meta charset="utf-8">
        <style>
            body { background: #020817; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; user-select: none; }
            .spinner { width: 50px; height: 50px; border: 4px solid #1e293b; border-top-color: #f97316; border-radius: 50%; animation: spin 1s linear infinite; margin-top: 20px; }
            @keyframes spin { 100% { transform: rotate(360deg); } }
            h2 { margin: 0; font-weight: normal; }
            p { color: #94a3b8; margin-top: 20px; font-size: 14px; }
        </style>
    </head>
    <body>
        <h2>Amir Nouadi Management</h2>
        <div class="spinner"></div>
        <p id="status">جاري تشغيل النظام...</p>
    </body>
    </html>`;

    mainWindow.loadURL('data:text/html;base64,' + Buffer.from(splashHtml).toString('base64'));

    // Check server readiness
    const checkServer = () => {
        const url = 'http://127.0.0.1:3000';
        log(`Checking server at ${url}...`);

        http.get(url, (res) => {
            log(`Server check response: ${res.statusCode}`);
            if (res.statusCode === 200) {
                log('Server is ready, loading main app...');
                mainWindow.loadURL(url);
            } else {
                log(`Server returned ${res.statusCode}, retrying in 1s...`);
                setTimeout(checkServer, 1000);
            }
        }).on('error', (err) => {
            log(`Server check error: ${err.message}. Retrying...`);
            setTimeout(checkServer, 1000);
        });
    };

    checkServer();
}

const startServer = async () => {
    if (!app.isPackaged) {
        log('Development mode: Expecting external server on port 3000');
        return;
    }

    try {
        log('Starting internal production server via spawn...');

        const dbPath = path.join(app.getPath('userData'), 'data');
        if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });

        // Back to the stable path: root server.js
        let serverScript = path.join(process.resourcesPath, 'app.asar.unpacked/server.js');

        if (!fs.existsSync(serverScript)) {
            // Fallback for non-asar
            serverScript = path.join(process.resourcesPath, 'app/server.js');
        }

        if (!fs.existsSync(serverScript)) {
            log('Note: Root server.js not found, trying app.asar...');
            serverScript = path.join(process.resourcesPath, 'app.asar/server.js');
        }

        log(`Server script location: ${serverScript}`);

        const env = {
            ...process.env,
            PORT: '3000',
            NODE_ENV: 'production',
            HOSTNAME: '127.0.0.1',
            DB_PATH: dbPath,
            ELECTRON_RUN_AS_NODE: '1'
        };

        serverProcess = spawn(process.execPath, [serverScript], {
            env,
            cwd: path.dirname(serverScript),
            windowsHide: true
        });

        serverProcess.stdout.on('data', (data) => log('SERVER: ' + data));
        serverProcess.stderr.on('data', (data) => log('SERVER ERROR: ' + data));

        serverProcess.on('close', (code) => {
            log(`Server process exited with code ${code}`);
        });

        serverProcess.on('error', (err) => {
            log('Failed to start server process: ' + err.message);
        });

    } catch (err) {
        log('CRITICAL: Internal server failed to start: ' + err.message);
    }
};

app.whenReady().then(async () => {
    await startServer();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (serverProcess) serverProcess.kill();
    if (process.platform !== 'darwin') app.quit();
});
