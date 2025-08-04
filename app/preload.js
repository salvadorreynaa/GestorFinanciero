const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('storageAPI', {
  leerDatos: () => ipcRenderer.invoke('leer-datos'),
  escribirDatos: (datos) => ipcRenderer.invoke('escribir-datos', datos),
  abrirMovimientos: () => ipcRenderer.invoke('abrir-movimientos'),
  testIPC: (mensaje) => ipcRenderer.invoke('test-ipc', mensaje),
  ipcInvoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  leerEmpresas: () => ipcRenderer.invoke('leer-empresas'),
  escribirEmpresas: (empresas) => ipcRenderer.invoke('escribir-empresas', empresas),
  leerTipoingreso: () => ipcRenderer.invoke('leer-Tipoingreso'),
  escribirTipoingreso: (tipos) => ipcRenderer.invoke('escribir-Tipoingreso', tipos),
  leerTipoegreso: () => ipcRenderer.invoke('leer-Tipoegreso'),
  escribirTipoegreso: (tipos) => ipcRenderer.invoke('escribir-Tipoegreso', tipos)
});

contextBridge.exposeInMainWorld('contactosAPI', {
  leerContactos: () => ipcRenderer.invoke('leer-contactos'),
  escribirContactos: (datos) => ipcRenderer.invoke('escribir-contactos', datos)
});
