
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    evaluateForMoveClassification: (...args) => ipcRenderer.invoke('evaluate-for-move-classification', ...args),
    evaluateForLiveAnalysis: (...args) => ipcRenderer.invoke('evaluate-for-live-analysis', ...args),
    setEvaluationCallback: callback => ipcRenderer.on('evaluation-callback', (event, ...args) => callback(...args)),
});
