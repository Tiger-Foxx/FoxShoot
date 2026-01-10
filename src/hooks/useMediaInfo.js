import { useState, useEffect } from 'react';
import { Command } from '@tauri-apps/plugin-shell';

// DEV: Path relative to src-tauri (CWD during tauri dev)
// PROD: This should be configured via resources or bundled executable
const SCRIPT_PATH = '../../backend/upscale_cli.py';

export const useMediaInfo = (filePath) => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!filePath) {
      setInfo(null);
      return;
    }

    const fetchInfo = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching media info for:', filePath);
        const command = Command.create('python', [
          SCRIPT_PATH,
          '--info', filePath,
          '--progress', 'json'
        ]);
        
        const result = await command.execute();
        
        console.log('Media info result:', { code: result.code, stdout: result.stdout, stderr: result.stderr });
        
        if (result.code === 0 && result.stdout) {
          // Parse JSON output
          const lines = result.stdout.trim().split('\n');
          let found = false;
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.file || data.width) {
                console.log('Parsed media info:', data);
                setInfo(data);
                found = true;
                break;
              }
            } catch (e) {
              // Not JSON, continue
            }
          }
          if (!found) {
            console.warn('No valid media info found in output');
          }
        } else {
          console.error('Failed to get media info:', result.stderr);
          setError('Failed to get media info');
        }
      } catch (err) {
        console.error('Error fetching media info:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [filePath]);

  return { info, loading, error };
};
