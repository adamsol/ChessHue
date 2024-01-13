
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

import path from 'path';

import { app, BrowserWindow, ipcMain } from 'electron';
import initContextMenu from 'electron-context-menu';
import Store from 'electron-store';

import { Engine } from './src/engine.js';

initContextMenu();
Store.initRenderer();

app.whenReady().then(async () => {
    const window = new BrowserWindow({
        webPreferences: {
            preload: path.join(app.getAppPath(), 'preload.cjs'),
            sandbox: false,  // https://github.com/sindresorhus/electron-store/issues/268#issuecomment-1809555869
        },
    });
    window.maximize();

    // https://stackoverflow.com/questions/45570589/electron-protocol-handler-not-working-on-windows
    app.setAsDefaultProtocolClient('chess', process.execPath, [path.resolve(process.argv[1])]);

    ipcMain.handle('get-protocol-url', () => decodeURIComponent(process.argv[2]?.split('://')[1] ?? ''));

    const move_classification_engine = new Engine();
    ipcMain.handle('evaluate-for-move-classification', async (event, ...args) => move_classification_engine.evaluate(...args));

    const live_analysis_engine = new Engine((...args) => window.webContents.send('evaluation-callback', ...args));
    ipcMain.handle('evaluate-for-live-analysis', async (event, ...args) => live_analysis_engine.evaluate(...args));

    await window.loadFile('src/index.html');
});
