
const { contextBridge, ipcRenderer } = require('electron');
const Store = require('electron-store');

const store = new Store();

contextBridge.exposeInMainWorld('electron', {
    getProtocolUrl: () => ipcRenderer.invoke('get-protocol-url'),
    evaluateForMoveClassification: (...args) => ipcRenderer.invoke('evaluate-for-move-classification', ...args),
    evaluateForLiveAnalysis: (...args) => ipcRenderer.invoke('evaluate-for-live-analysis', ...args),
    setEvaluationCallback: callback => ipcRenderer.on('evaluation-callback', (event, ...args) => callback(...args)),
    store: {
        get: (...args) => store.get(...args),
        set: (...args) => store.set(...args),
    },
});
