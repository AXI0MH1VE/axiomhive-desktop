/**
 * Electron Preload Script
 * Exposes safe APIs to the renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getServerUrl: () => ipcRenderer.invoke('get-server-url'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  onNavigate: (callback: (route: string) => void) => {
    ipcRenderer.on('navigate', (_, route) => callback(route));
  },
  onShowAbout: (callback: () => void) => {
    ipcRenderer.on('show-about', () => callback());
  }
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      getServerUrl: () => Promise<string>;
      getAppVersion: () => Promise<string>;
      getUserDataPath: () => Promise<string>;
      onNavigate: (callback: (route: string) => void) => void;
      onShowAbout: (callback: () => void) => void;
    };
  }
}
