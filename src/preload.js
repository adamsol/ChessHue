
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    getProtocolUrl: () => ipcRenderer.invoke('get-protocol-url'),
    evaluateForMoveClassification: (...args) => ipcRenderer.invoke('evaluate-for-move-classification', ...args),
    evaluateForLiveAnalysis: (...args) => ipcRenderer.invoke('evaluate-for-live-analysis', ...args),
    setEvaluationCallback: callback => ipcRenderer.on('evaluation-callback', (event, ...args) => callback(...args)),
});
