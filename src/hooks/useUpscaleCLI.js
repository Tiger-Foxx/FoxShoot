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

    // Assuming backend is at ../backend/upscale_cli.py relative to the bundle
    // In dev: we use absolute path or relative to CWD. 
    // Ideally we'd use a compiled binary sidecar, but for flexibility we call python directly.
    // We assume 'python' is in PATH.
    
    try {
      // Absolute path for Dev Mode (Guaranteed to work)
      // In production, this should be resource-bundled or sidecar-bundled.
      const scriptPath = 'C:\\Users\\donfa\\Desktop\\Fox\\QUALITY-SHOOT-V2\\backend\\upscale_cli.py'; 

      const command = Command.create('python', [
        scriptPath, 
        ...args,
        '--progress', 'json' // Force JSON output
      ]);

      command.stdout.on('data', (line) => {
        try {
          // Lines might contain multiple JSONs or partials, but usually flush=True handles it.
          // Support multiple lines in one chunk
          const lines = line.split('\n').filter(Boolean);
          lines.forEach(l => {
             try {
               const data = JSON.parse(l);
               if (data.percent !== undefined) {
                 setProgress({
                   percent: data.percent,
                   eta: data.eta_seconds,
                   status: data.status || 'Processing...'
                 });
               }
               if (data.error) {
                 toast.error(`Error: ${data.error}`);
               }
             } catch (e) {
               // Ignore non-json lines
               // console.log("Stdout:", l);
             }
          });
        } catch (e) {
          console.error("Parse error:", e);
        }
      });

      command.stderr.on('data', (line) => {
        console.error('STDERR:', line);
        // Sometimes valid logs go to stderr, but we can check keywords
        if (line.includes('Error') || line.includes('Traceback')) {
           toast.error('Backend Error: Check console');
        }
      });

      const child = await command.spawn();
      childProcessRef.current = child;

      const output = await command.execute(); // Wait for finish
      
      if (output.code === 0) {
        setProgress({ percent: 100, eta: 0, status: 'Done!' });
        toast.success("Upscaling Completed!");
        if (onComplete) onComplete();
      } else {
        toast.error(`Process failed with code ${output.code}`);
        if (onError) onError();
      }
    } catch (err) {
      console.error("Launch error:", err);
      toast.error("Failed to launch upscaler");
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
