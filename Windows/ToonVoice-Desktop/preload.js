const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('toonVoiceDesktop', {
  saveMp4: (payload) => ipcRenderer.invoke('toonvoice:save-mp4', payload)
});
