
const { contextBridge, ipcRenderer } = require('electron');
const Store = require('electron-store');

const store = new Store();

contextBridge.exposeInMainWorld('electron', {
    getProtocolUrl: () =>
        ipcRenderer.invoke('get-protocol-url'),
    evaluateForMoveClassification: (...args) =>
        ipcRenderer.invoke('evaluate-for-move-classification', ...args),
    setMoveClassificationEvaluationCallback: callback =>
        ipcRenderer.removeAllListeners('move-classification-evaluation-callback').on('move-classification-evaluation-callback', (event, ...args) => callback(...args)),
    evaluateForLiveAnalysis: (...args) =>
        ipcRenderer.invoke('evaluate-for-live-analysis', ...args),
    setLiveAnalysisEvaluationCallback: callback =>
        ipcRenderer.removeAllListeners('live-analysis-evaluation-callback').on('live-analysis-evaluation-callback', (event, ...args) => callback(...args)),
    store: {
        get: (...args) => store.get(...args),
        set: (...args) => store.set(...args),
    },
});
