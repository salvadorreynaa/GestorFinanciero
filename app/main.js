const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;

// --- DATOS PRINCIPALES ---
const dataFilePath = path.join(__dirname, 'datos.json');
console.log("Ruta exacta del archivo de datos:", dataFilePath);

async function leerDatos() {
  try {
    const dataJSON = await fsPromises.readFile(dataFilePath, 'utf-8');
    return dataJSON ? JSON.parse(dataJSON) : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log("Archivo datos.json no encontrado, creando uno nuevo");
      await escribirDatos([]); // crea archivo vacío
      return [];
    }
    console.error('Error al leer o parsear datos:', error);
    return [];
  }
}

async function escribirDatos(datos) {
  await fsPromises.writeFile(dataFilePath, JSON.stringify(datos, null, 2), 'utf-8');
}

ipcMain.handle('leer-datos', async () => {
  console.log('Solicitud para leer datos recibida');
  return await leerDatos();
});

ipcMain.handle('escribir-datos', async (event, datos) => {
  console.log('Solicitud para escribir datos:', datos);
  try {
    await escribirDatos(datos);
    console.log("Datos escritos correctamente");
    return true;
  } catch (err) {
    console.error("Error al escribir datos:", err);
    throw err;
  }
});

ipcMain.handle('test-ipc', async (event, mensaje) => {
  console.log('Mensaje recibido en main:', mensaje);
  return 'Respuesta desde main: ¡Recibido tu mensaje!';
});

// --- CONTACTOS ---
const contactosPath = path.join(__dirname, 'contactos.json');

async function leerContactos() {
  try {
    const dataJSON = await fsPromises.readFile(contactosPath, 'utf-8');
    return dataJSON ? JSON.parse(dataJSON) : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log("Archivo contactos.json no encontrado, creando uno nuevo");
      await escribirContactos([]); // crea archivo vacío
      return [];
    }
    console.error('Error al leer o parsear contactos:', error);
    return [];
  }
}

async function escribirContactos(datos) {
  await fsPromises.writeFile(contactosPath, JSON.stringify(datos, null, 2), 'utf-8');
}

ipcMain.handle('leer-contactos', async () => {
  console.log('Solicitud para leer contactos recibida');
  return await leerContactos();
});

ipcMain.handle('escribir-contactos', async (event, datos) => {
  console.log('Solicitud para escribir contactos:', datos);
  try {
    await escribirContactos(datos);
    console.log("Contactos escritos correctamente");
    return true;
  } catch (err) {
    console.error("Error al escribir contactos:", err);
    throw err;
  }
});

// --- NUEVO: ventana de movimientos ---

let ventanaMovimientos = null;

function createMovimientosWindow() {
  if (ventanaMovimientos) {
    ventanaMovimientos.focus();
    return;
  }

  ventanaMovimientos = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'img/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });
  ventanaMovimientos.maximize(); // <-- Aquí sí está bien

  ventanaMovimientos.loadFile('movimientos.html');

  ventanaMovimientos.on('closed', () => {
    ventanaMovimientos = null;
  });
}

ipcMain.handle('abrir-movimientos', () => {
  createMovimientosWindow();
});

// -- ventana principal --

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'img/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });
  mainWindow.maximize();
  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


// --- EMPRESAS ---
const empresasPath = path.join(__dirname, 'empresas.json');

async function leerEmpresas() {
  try {
    const dataJSON = await fsPromises.readFile(empresasPath, 'utf-8');
    return dataJSON ? JSON.parse(dataJSON) : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log("Archivo empresas.json no encontrado, creando uno nuevo");
      await escribirEmpresas([]); // crea archivo vacío
      return [];
    }
    console.error('Error al leer o parsear empresas:', error);
    return [];
  }
}

async function escribirEmpresas(empresas) {
  await fsPromises.writeFile(empresasPath, JSON.stringify(empresas, null, 2), 'utf-8');
}

ipcMain.handle('leer-empresas', async () => {
  console.log('Solicitud para leer empresas recibida');
  return await leerEmpresas();
});

ipcMain.handle('escribir-empresas', async (event, empresas) => {
  console.log('Solicitud para escribir empresas:', empresas);
  try {
    await escribirEmpresas(empresas);
    console.log("Empresas escritas correctamente");
    return true;
  } catch (err) {
    console.error("Error al escribir empresas:", err);
    throw err;
  }
});



// --- TIPOS DE INGRESO ---
const tipoIngresoPath = path.join(__dirname, 'tipoingreso.json');

async function leerTipoingreso() {
  try {
    const dataJSON = await fsPromises.readFile(tipoIngresoPath, 'utf-8');
    return dataJSON ? JSON.parse(dataJSON) : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log("Archivo tipoingreso.json no encontrado, creando uno nuevo");
      await escribirTipoingreso([]); // crea archivo vacío
      return [];
    }
    console.error('Error al leer o parsear tipoingreso:', error);
    return [];
  }
}

async function escribirTipoingreso(tipos) {
  await fsPromises.writeFile(tipoIngresoPath, JSON.stringify(tipos, null, 2), 'utf-8');
}

ipcMain.handle('leer-Tipoingreso', async () => {
  return await leerTipoingreso();
});
ipcMain.handle('escribir-Tipoingreso', async (event, tipos) => {
  await escribirTipoingreso(tipos);
  return true;
});

// --- TIPOS DE EGRESO ---
const tipoEgresoPath = path.join(__dirname, 'tipoegreso.json');

async function leerTipoegreso() {
  try {
    const dataJSON = await fsPromises.readFile(tipoEgresoPath, 'utf-8');
    return dataJSON ? JSON.parse(dataJSON) : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log("Archivo tipoegreso.json no encontrado, creando uno nuevo");
      await escribirTipoegreso([]); // crea archivo vacío
      return [];
    }
    console.error('Error al leer o parsear tipoegreso:', error);
    return [];
  }
}

async function escribirTipoegreso(tipos) {
  await fsPromises.writeFile(tipoEgresoPath, JSON.stringify(tipos, null, 2), 'utf-8');
}

ipcMain.handle('leer-Tipoegreso', async () => {
  return await leerTipoegreso();
});
ipcMain.handle('escribir-Tipoegreso', async (event, tipos) => {
  await escribirTipoegreso(tipos);
  return true;
});