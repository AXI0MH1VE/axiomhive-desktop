/**
 * Electron Main Process
 * Manages the desktop application window and embedded backend server
 */

import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import { AxiomDatabase } from './database';
import { AxiomServer } from './server';

let mainWindow: BrowserWindow | null = null;
let server: AxiomServer | null = null;
let db: AxiomDatabase | null = null;

const SERVER_PORT = 3737;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Axiom Hive - Deterministic AI Platform',
    backgroundColor: '#0a0a0a',
    icon: path.join(__dirname, '../assets/icon.png')
  });

  // Create application menu
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'New Inference',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('navigate', '/inference');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            mainWindow?.webContents.send('navigate', '/dashboard');
          }
        },
        {
          label: 'Audit Logs',
          accelerator: 'CmdOrCtrl+L',
          click: () => {
            mainWindow?.webContents.send('navigate', '/audit');
          }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            mainWindow?.webContents.send('show-about');
          }
        },
        {
          label: 'Documentation',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://axiomhive.com/docs');
          }
        }
      ]
    }
  ]);
  
  Menu.setApplicationMenu(menu);

  // Load the app
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function startBackend() {
  try {
    // Initialize database
    db = new AxiomDatabase();
    console.log('Database initialized');

    // Start server
    server = new AxiomServer(db, SERVER_PORT);
    await server.start();
    console.log(`Backend server started on port ${SERVER_PORT}`);
  } catch (error) {
    console.error('Failed to start backend:', error);
    app.quit();
  }
}

// App lifecycle
app.whenReady().then(async () => {
  await startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (db) {
    db.close();
  }
});

// IPC handlers
ipcMain.handle('get-server-url', () => {
  return `http://localhost:${SERVER_PORT}`;
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});
