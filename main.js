
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

const path = require('path');

const { app, BrowserWindow, ipcMain } = require('electron');
const contextMenu = require('electron-context-menu');

const { Engine } = require('./src/engine');

app.whenReady().then(async () => {
    contextMenu();

    const window = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'src/preload.js'),
        },
    });
    window.maximize();

    const move_classification_engine = new Engine('./engine.exe');
    ipcMain.handle('evaluate-for-move-classification', async (event, ...args) => move_classification_engine.evaluate(...args));

    const live_analysis_engine = new Engine('./engine.exe', (...args) => window.webContents.send('evaluation-callback', ...args));
    ipcMain.handle('evaluate-for-live-analysis', async (event, ...args) => live_analysis_engine.evaluate(...args));

    await window.loadFile('src/index.html');
});
