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
        const command = Command.create('python', [
          SCRIPT_PATH,
          '--info', filePath,
          '--progress', 'json'
        ]);
        
        const result = await command.execute();
        
        if (result.code === 0 && result.stdout) {
          // Parse JSON output
          const lines = result.stdout.trim().split('\n');
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.file) {
                setInfo(data);
                break;
              }
            } catch (e) {
              // Not JSON, continue
            }
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
