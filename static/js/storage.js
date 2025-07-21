// storage.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('storageAPI', {
  leerDatos: () => ipcRenderer.invoke('leer-datos'),
  guardarDatos: (datos) => ipcRenderer.invoke('guardar-datos', datos),
});
