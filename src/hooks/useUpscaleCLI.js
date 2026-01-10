import { useState, useCallback, useRef } from 'react';
import { Command } from '@tauri-apps/plugin-shell';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const useUpscaleCLI = () => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, eta: 0, status: 'Idle' });
  const childRef = useRef(null);
  const { t } = useTranslation();

  const runUpscale = useCallback(async (args, onComplete, onError) => {
    setProcessing(true);
    setProgress({ percent: 0, eta: 0, status: 'Starting...' });
    
    try {
      // DEV: Path relative to src-tauri (CWD during tauri dev)
      // PROD: This should be configured via resources or env
      const scriptPath = '../../backend/upscale_cli.py'; 

      console.log('Running python with args:', [scriptPath, ...args, '--progress', 'json']);

      const command = Command.create('python', [
        scriptPath, 
        ...args,
        '--progress', 'json'
      ]);

      let stderrBuffer = '';

      // Setup stdout listener BEFORE spawning - THIS IS THE KEY FOR STREAMING
      command.stdout.on('data', (line) => {
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
      command.stderr.on('data', (line) => {
        console.error('STDERR:', line);
        stderrBuffer += line + '\n';
      });

      // Spawn the process (non-blocking)
      const child = await command.spawn();
      childRef.current = child;
      console.log('Process spawned, pid:', child.pid);

      // Wait for process to complete using a promise
      return new Promise((resolve, reject) => {
        command.on('close', (data) => {
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

        command.on('error', (error) => {
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
  }, []);

  const cancelUpscale = useCallback(async () => {
    if (childRef.current) {
      await childRef.current.kill();
      toast(t('common.abort'), { icon: '🛑' });
      setProcessing(false);
      setProgress({ percent: 0, eta: 0, status: 'Cancelled' });
    }
  }, []);

  return {
    runUpscale,
    cancelUpscale,
    processing,
    progress
  };
};
