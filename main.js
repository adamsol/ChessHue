
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

import path from 'path';
import { fileURLToPath } from 'url';

import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import initContextMenu from 'electron-context-menu';
import Store from 'electron-store';

import { Engine } from './src/engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app_menu_template = [
    {
        label: 'View',
        submenu: [
            { role: 'reload' }, { role: 'toggledevtools' },
            { type: 'separator' },
            { role: 'resetzoom' }, { role: 'zoomin' }, { role: 'zoomout' },
            { type: 'separator' },
            { role: 'togglefullscreen' },
        ],
    },
];
Menu.setApplicationMenu(Menu.buildFromTemplate(app_menu_template));

initContextMenu();
Store.initRenderer();

app.whenReady().then(async () => {
    const window = new BrowserWindow({
        webPreferences: {
            preload: path.join(app.getAppPath(), 'preload.cjs'),
            sandbox: false,  // https://github.com/sindresorhus/electron-store/issues/268#issuecomment-1809555869
        },
        icon: path.join(__dirname, 'img/logo.jpg'),
    });
    window.maximize();

    // https://stackoverflow.com/questions/45570589/electron-protocol-handler-not-working-on-windows
    app.setAsDefaultProtocolClient('chess', process.execPath, [path.resolve(process.argv[1])]);

    ipcMain.handle('get-protocol-url', () => decodeURIComponent(process.argv[2]?.split('://')[1] ?? ''));

    const move_classification_engine = new Engine((...args) => window.webContents.send('move-classification-evaluation-callback', ...args));
    ipcMain.handle('evaluate-for-move-classification', async (event, ...args) => await move_classification_engine.evaluate(...args));

    const live_analysis_engine = new Engine((...args) => window.webContents.send('live-analysis-evaluation-callback', ...args));
    ipcMain.handle('evaluate-for-live-analysis', async (event, ...args) => await live_analysis_engine.evaluate(...args));

    await window.loadFile('index.html');
});
