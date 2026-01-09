import { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { UploadZone } from './components/UploadZone';
import { BatchList } from './components/BatchList';
import { OptionsPanel } from './components/OptionsPanel';
import { ProgressBar } from './components/ProgressBar';
import { PreviewCard } from './components/PreviewCard';
import { ToastContainer } from './components/ToastContainer';
import { useUpscaleCLI } from './hooks/useUpscaleCLI';
import { getFileType } from './utils/fileUtils';
import { convertFileSrc } from '@tauri-apps/api/core';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

function App() {
  const [files, setFiles] = useState([]);
  const [processedFiles, setProcessedFiles] = useState({}); // { index: path }
  const [currentFileIndex, setCurrentFileIndex] = useState(-1);
  const [options, setOptions] = useState({
    scale: 2,
    quality: 'medium',
    format: 'mp4',
    noAudio: false,
    preset: 'medium',
    tileSize: 0
  });

  const { runUpscale, cancelUpscale, processing, progress } = useUpscaleCLI();

  // Handle file drops
  const handleDropFiles = useCallback((newFiles) => {
    // Check validation if needed
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  // Remove files
  const handleRemove = useCallback((index) => {
    if (processing) return;
    if (index === 'all') {
      setFiles([]);
      setCurrentFileIndex(-1);
      setProcessedFiles({});
    } else {
      setFiles(prev => prev.filter((_, i) => i !== index));
    }
  }, [processing]);

  // Process Queue
  const processQueue = useCallback(async () => {
    if (processing || files.length === 0) return;

    // Find first unprocessed or just start from 0 if refreshed
    // Simple queue logic: process index 0 to N
    // But we want to allow adding files mid-process?
    // Let's iterate.
    
    // For this demo: START button triggers the loop from index 0 (or next pending).
    // If I click start:
    let startIndex = currentFileIndex + 1;
    if (startIndex >= files.length) startIndex = 0; // Restart if done

    // We need a loop function that calls itself or iterate
    // Using a recursive function to sequence:
    
    const processNext = async (idx) => {
      if (idx >= files.length) {
        setCurrentFileIndex(-1); // Done
        return;
      }

      setCurrentFileIndex(idx);
      const file = files[idx];
      const type = getFileType(file.name);
      
      // Determine output path logic (for Phase 2 demo, we save next to input or desktop?)
      // We assume backend handles output naming if we pass folder, but here we pass files.
      // Let's create an output filename.
      // For Tauri, we might default to same folder with suffix.
      // Input path: file.path (Absolute path from dropzone if Tauri configured right, or name)
      // NOTE: react-dropzone in browser gives file objects. In Tauri, 'path' property might be available.
      // If 'path' is missing (browser dev mode), we can't really upscale real files.
      // We'll proceed assuming file.path exists.
      
      const inputPath = file.path; 
      if (!inputPath) {
         // Fallback for browser testing
         console.warn("No path found, skipping real upscale (Browser Mock Mode?)");
         // Mock delay
         await new Promise(r => setTimeout(r, 2000));
         await processNext(idx + 1);
         return;
      }

      // Output path construction (hacky for now, ideal: select output dir)
      // Just append _upscaled
      const parts = inputPath.split('.');
      const ext = parts.pop();
      const basePath = parts.join('.');
      const outPath = `${basePath}_upscaled.${type === 'video' ? options.format : ext}`;

      const args = [
        '-i', inputPath,
        '-o', outPath,
        '-s', String(options.scale),
      ];
      
      if (type === 'video') {
         args.push('--quality', options.quality);
         args.push('--format', options.format);
         if (options.preset !== 'medium') args.push('--preset', options.preset); // Optimization
         if (options.noAudio) args.push('--no-audio');
      }

      if (options.tileSize > 0) {
        args.push('--tile-size', String(options.tileSize));
      }

      // Run
      await runUpscale(args, async () => {
        // On success
        setProcessedFiles(prev => ({ ...prev, [idx]: outPath }));
        // Next
        await processNext(idx + 1);
      }, () => {
        // On Error, stop or continue? Let's stop.
        setCurrentFileIndex(-1);
      });
    };

    processNext(startIndex);
  }, [files, processing, currentFileIndex, options, runUpscale]);

  // Current active file for preview
  const activeIndex = currentFileIndex !== -1 ? currentFileIndex : (files.length > 0 ? 0 : -1);
  const activeFile = files[activeIndex];
  // Simplistic preview logic: if processed exists, show processed path (if browser could read it), else original.
  // Warning: Browser cannot display local files via path directly due to security.
  // Tauri needs `convertFileSrc`.
  // I will import convertFileSrc.
  // But wait, user didn't install @tauri-apps/api/core... but @tauri-apps/api.
  // Tauri V2: import { convertFileSrc } from '@tauri-apps/api/core';
  // Let's try to handle preview image dynamically. 
  // For videos, maybe a thumbnail? PreviewCard logic is basic for now.

  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-sans select-none overflow-hidden">
      <ToastContainer />
      
      {/* Header */}
      <header className="h-14 border-b border-gray-800 flex items-center px-6 bg-surface/50 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <img src="/logo-fox-shoot.png" alt="FoxShoot" className="w-8 h-8 object-contain drop-shadow-lg" />
          <h1 className="text-lg font-bold tracking-tight text-white">
            Fox<span className="text-primary">Shoot</span> <span className="text-xs font-normal text-gray-500 ml-2 border border-gray-700 rounded px-1.5 py-0.5">V2.0</span>
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-4">
           {/* Status Indicator */}
           <div className="flex items-center gap-2 text-xs font-medium px-3 py-1 bg-black/20 rounded-full border border-white/5">
             <div className={clsx("w-2 h-2 rounded-full", processing ? "bg-primary animate-pulse" : "bg-green-500")} />
             {processing ? "ENGINE BUSY" : "ENGINE READY"}
           </div>
        </div>
      </header>

      {/* Main Content - Two Columns */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Upload & Batch */}
        <section className="w-[350px] lg:w-[400px] border-r border-gray-800 bg-surface/30 flex flex-col p-4 gap-4 z-10">
           <UploadZone onDropFiles={handleDropFiles} />
           
           <div className="flex-1 overflow-hidden min-h-0">
             <BatchList 
               files={files} 
               onRemove={handleRemove} 
               currentFileIndex={currentFileIndex}
               processing={processing}
             />
           </div>

           {/* Start Button Area in Sidebar */}
           <div className="mt-auto pt-2">
             {processing ? (
               <button 
                 onClick={cancelUpscale}
                 className="w-full py-3 rounded bg-red-500/10 border border-red-500/50 text-red-500 font-bold hover:bg-red-500/20 transition-all uppercase tracking-wide text-sm"
               >
                 Cancel Job
               </button>
             ) : (
               <button 
                 onClick={processQueue}
                 disabled={files.length === 0}
                 className={clsx(
                   "w-full py-3 rounded font-bold transition-all uppercase tracking-wide text-sm shadow-lg",
                   files.length > 0 
                     ? "bg-primary hover:bg-primary-dark text-white hover:shadow-primary/20" 
                     : "bg-gray-800 text-gray-500 cursor-not-allowed"
                 )}
               >
                 Start Processing
               </button>
             )}
           </div>
        </section>

        {/* Right Panel: Options & Preview */}
        <section className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto custom-scrollbar relative">
           
           {/* Background Grid Pattern */}
           <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
                style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
           </div>



           {/* Top: Preview */}
           <div className="flex-1 z-10 min-h-[300px]">
             <PreviewCard 
               original={activeFile ? activeFile.preview : null} 
               processed={activeFile && processedFiles[files.indexOf(activeFile)] ? convertFileSrc(processedFiles[files.indexOf(activeFile)]) : null}
             />
           </div>

           {/* Middle: Progress */}
           <div className="z-10">
             <ProgressBar 
               percent={progress.percent} 
               eta={progress.eta}
               status={progress.status}
               isProcessing={processing}
             />
           </div>

           {/* Bottom: Options */}
           <div className="z-10">
             <OptionsPanel 
               options={options} 
               setOptions={setOptions} 
               disabled={processing} 
             />
           </div>

        </section>
      </main>
    </div>
  );
}

export default App;
