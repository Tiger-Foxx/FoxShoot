import { useState, useCallback, useRef, useEffect } from 'react';
import { Command } from '@tauri-apps/plugin-shell';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getBackendConfig, buildCommandArgs, isDev } from '../utils/backendConfig';

export const useUpscaleCLI = () => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, eta: 0, status: 'Idle' });
  const childRef = useRef(null);
  const backendConfigRef = useRef(null);
  const { t } = useTranslation();

  // Load backend config on mount
  useEffect(() => {
    getBackendConfig().then(config => {
      backendConfigRef.current = config;
      console.log('Backend config loaded:', config);
    });
  }, []);

  const runUpscale = useCallback(async (args, onComplete, onError) => {
    setProcessing(true);
    setProgress({ percent: 0, eta: 0, status: 'Starting...' });
    
    try {
      // Get backend configuration (dev vs prod)
      const config = backendConfigRef.current || await getBackendConfig();
      const { command, scriptPath, usesPython } = config;
      
      // Build final arguments
      const finalArgs = buildCommandArgs(scriptPath, args, usesPython);
      
      console.log(`Running [${isDev ? 'DEV' : 'PROD'}]:`, command, finalArgs);

      // Create the command
      let cmd;
      if (usesPython) {
        // Dev mode: use python with script path
        cmd = Command.create('python', finalArgs);
      } else {
        // Prod mode: use the registered foxshoot-engine command
        cmd = Command.create('foxshoot-engine', finalArgs);
      }

      let stderrBuffer = '';

      // Setup stdout listener BEFORE spawning - THIS IS THE KEY FOR STREAMING
      cmd.stdout.on('data', (line) => {
        console.log('STDOUT chunk:', line);
        try {
          const lines = line.split('\n').filter(Boolean);
          lines.forEach(l => {
            try {
              const data = JSON.parse(l);
              if (data.percent !== undefined) {
                console.log('Progress update:', data.percent);
                setProgress({
                  percent: data.percent,
                  eta: data.eta_seconds || 0,
                  status: data.status || 'Processing...'
                });
              }
              if (data.error) {
                toast.error(`Backend: ${data.error}`);
              }
            } catch (e) {
              // Non-JSON line
              if (l.trim() && !l.startsWith('Processing')) {
                console.log('Backend:', l);
              }
            }
          });
        } catch (e) {
          console.error("Parse error:", e);
        }
      });

      // Setup stderr listener
      cmd.stderr.on('data', (line) => {
        console.error('STDERR:', line);
        stderrBuffer += line + '\n';
      });

      // Spawn the process (non-blocking)
      const child = await cmd.spawn();
      childRef.current = child;
      console.log('Process spawned, pid:', child.pid);

      // Wait for process to complete using a promise
      return new Promise((resolve, reject) => {
        cmd.on('close', (data) => {
          console.log('Process closed with code:', data.code);
          childRef.current = null;
          setProcessing(false);
          
          if (data.code === 0) {
            setProgress({ percent: 100, eta: 0, status: t('common.complete') });
            toast.success(t('common.output_ready'));
            if (onComplete) onComplete();
            resolve();
          } else {
            console.error('Process failed. STDERR:', stderrBuffer);
            toast.error(`Process failed (code ${data.code})`);
            if (stderrBuffer) {
              const firstError = stderrBuffer.split('\n').find(l => l.includes('Error') || l.includes('Exception')) || stderrBuffer.split('\n')[0];
              if (firstError) toast.error(firstError.substring(0, 100));
            }
            if (onError) onError();
            reject(new Error(`Exit code ${data.code}`));
          }
        });

        cmd.on('error', (error) => {
          console.error('Process error:', error);
          toast.error(`Process error: ${error}`);
          setProcessing(false);
          childRef.current = null;
          if (onError) onError(error);
          reject(error);
        });
      });

    } catch (err) {
      console.error("Launch error:", err);
      toast.error(`Failed to launch: ${err.message || err}`);
      setProcessing(false);
      if (onError) onError(err);
      throw err;
    }
  }, [t]);

  const cancelUpscale = useCallback(async () => {
    if (childRef.current) {
      await childRef.current.kill();
      toast(t('common.abort'), { icon: '🛑' });
      setProcessing(false);
      setProgress({ percent: 0, eta: 0, status: 'Cancelled' });
    }
  }, [t]);

  return {
    runUpscale,
    cancelUpscale,
    processing,
    progress
  };
};
