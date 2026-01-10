/**
 * FoxShoot - Backend Path Configuration
 * 
 * Handles the difference between development and production modes:
 * - DEV: Uses Python script (../backend/upscale_cli.py)
 * - PROD: Uses compiled executable (foxshoot-engine/foxshoot-engine.exe)
 */

// Check if we're in development mode
const isDev = import.meta.env.DEV;

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
    // The foxshoot-engine folder should be next to the main exe
    // We use a shell command that doesn't require absolute path
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
