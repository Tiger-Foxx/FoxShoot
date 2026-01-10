/**
 * FoxShoot - Backend Path Configuration
 * 
 * Handles the difference between development and production modes:
 * - DEV: Uses Python script (../backend/upscale_cli.py)
 * - PROD: Uses compiled executable (foxshoot-engine/foxshoot-engine.exe)
 */

import { appDataDir } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';

// Check if we're in development mode
const isDev = import.meta.env.DEV;

/**
 * Get the directory where the exe is located (production only)
 * Uses window.__TAURI_INTERNALS__ to get resource dir
 */
const getExeDir = async () => {
  try {
    // Get the resource directory which is next to the exe in production
    const { resourceDir } = await import('@tauri-apps/api/path');
    const resDir = await resourceDir();
    // resourceDir returns the resources folder, we need parent
    // In our case, foxshoot-engine is in the same folder as the exe
    // So we go up one level from _up_/resources to _up_
    const parts = resDir.split('\\');
    parts.pop(); // Remove trailing empty or 'resources'
    if (parts[parts.length - 1] === '') parts.pop();
    return parts.join('\\');
  } catch (e) {
    console.warn('Could not get exe directory:', e);
    return null;
  }
};

/**
 * Get the backend engine configuration
 * @returns {Object} { command: string, args: string[], usesPython: boolean }
 */
export const getBackendConfig = async () => {
  if (isDev) {
    // Development mode - use Python script
    return {
      command: 'python',
      scriptPath: '../../backend/upscale_cli.py',
      usesPython: true
    };
  } else {
    // Production mode - use compiled executable
    // Try to get the actual exe directory for absolute path
    const exeDir = await getExeDir();
    
    if (exeDir) {
      const enginePath = `${exeDir}\\foxshoot-engine\\foxshoot-engine.exe`;
      console.log('Using absolute engine path:', enginePath);
      return {
        command: enginePath,
        scriptPath: null,
        usesPython: false
      };
    }
    
    // Fallback to relative path
    console.log('Using relative engine path');
    return {
      command: 'foxshoot-engine\\foxshoot-engine.exe',
      scriptPath: null,
      usesPython: false
    };
  }
};

/**
 * Build command arguments based on mode
 * @param {string} scriptPath - Path to Python script (dev mode only)
 * @param {string[]} args - User arguments
 * @param {boolean} usesPython - Whether we're using Python
 * @returns {string[]} Final arguments array
 */
export const buildCommandArgs = (scriptPath, args, usesPython) => {
  const baseArgs = [...args, '--progress', 'json'];
  
  if (usesPython && scriptPath) {
    return [scriptPath, ...baseArgs];
  }
  
  return baseArgs;
};

export { isDev };
