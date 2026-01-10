import { useState, useCallback, useRef } from 'react';
import { Command } from '@tauri-apps/plugin-shell';
import toast from 'react-hot-toast';

export const useUpscaleCLI = () => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, eta: 0, status: 'Idle' });
  const childProcessRef = useRef(null);

  const runUpscale = useCallback(async (args, onComplete, onError) => {
    setProcessing(true);
    setProgress({ percent: 0, eta: 0, status: 'Starting...' });
    
    try {
      const scriptPath = 'C:\\Users\\donfa\\Desktop\\Fox\\QUALITY-SHOOT-V2\\backend\\upscale_cli.py'; 

      console.log('Running python with args:', [scriptPath, ...args, '--progress', 'json']);

      const command = Command.create('python', [
        scriptPath, 
        ...args,
        '--progress', 'json'
      ]);

      // Listen to stdout
      command.stdout.on('data', (line) => {
        console.log('STDOUT:', line);
        try {
          const lines = line.split('\n').filter(Boolean);
          lines.forEach(l => {
            try {
              const data = JSON.parse(l);
              if (data.percent !== undefined) {
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
              if (l.trim()) console.log('Backend:', l);
            }
          });
        } catch (e) {
          console.error("Parse error:", e);
        }
      });

      // Listen to stderr
      command.stderr.on('data', (line) => {
        console.error('STDERR:', line);
      });

      // Execute and wait for completion (this is the correct V2 way)
      const output = await command.execute();
      
      console.log('Process finished. Code:', output.code);
      console.log('STDOUT full:', output.stdout);
      console.log('STDERR full:', output.stderr);

      if (output.code === 0) {
        setProgress({ percent: 100, eta: 0, status: 'Done!' });
        toast.success("Upscaling Completed!");
        if (onComplete) onComplete();
      } else {
        toast.error(`Process failed (code ${output.code})`);
        if (output.stderr) {
          console.error('Error details:', output.stderr);
          // Show first meaningful line
          const errorLine = output.stderr.split('\n').find(l => l.includes('Error') || l.includes('Exception') || l.trim());
          if (errorLine) toast.error(errorLine.substring(0, 120));
        }
        if (onError) onError();
      }

    } catch (err) {
      console.error("Launch error:", err);
      toast.error(`Failed to launch: ${err.message || err}`);
      if (onError) onError(err);
    } finally {
      setProcessing(false);
      childProcessRef.current = null;
    }
  }, []);

  const cancelUpscale = useCallback(async () => {
    if (childProcessRef.current) {
      await childProcessRef.current.kill();
      toast('Operation Cancelled', { icon: '🛑' });
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
