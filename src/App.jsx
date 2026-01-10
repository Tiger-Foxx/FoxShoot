import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LandingPage } from './components/LandingPage';
import { ImageStudio } from './components/ImageStudio';
import { VideoLab } from './components/VideoLab';
import { ToastContainer } from './components/ToastContainer';
import { useUpscaleCLI } from './hooks/useUpscaleCLI';
import { getFileType } from './utils/fileUtils';
import { HomeIcon, PhotoIcon, FilmIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

function App() {
  const [mode, setMode] = useState('landing'); // 'landing', 'image', 'video'
  
  // SHARED STATE
  const [files, setFiles] = useState([]);
  const [processedFiles, setProcessedFiles] = useState({});
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

  // --- LOGIC ---
  const handleDropFiles = useCallback((newFiles) => {
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

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

  const processQueue = useCallback(async () => {
    if (processing || files.length === 0) return;
    
    // Determining scope based on Mode
    // Image Mode: Process All
    // Video Mode: Process FIRST selected/active only (for now)
    
    let startIndex = currentFileIndex + 1;
    if (startIndex >= files.length) startIndex = 0;

    const processNext = async (idx) => {
      // Logic identical to previous App.jsx but cleaned
      if (idx >= files.length) {
        setCurrentFileIndex(-1);
        return;
      }
      setCurrentFileIndex(idx);
      const file = files[idx];
      const type = getFileType(file.name);
      
      if (!file.path) {
         // mock
         await new Promise(r => setTimeout(r, 1000));
         await processNext(idx + 1);
         return;
      }

      const parts = file.path.split('.');
      const ext = parts.pop();
      const basePath = parts.join('.');
      const outPath = `${basePath}_upscaled_${options.scale}x.${type === 'video' ? options.format : ext}`;

      const args = ['-i', file.path, '-o', outPath, '-s', String(options.scale)];
      
      if (type === 'video') {
         args.push('--quality', options.quality, '--format', options.format);
         if (options.preset !== 'medium') args.push('--preset', options.preset);
         if (options.noAudio) args.push('--no-audio');
      }
      if (options.tileSize > 0) args.push('--tile-size', String(options.tileSize));

      await runUpscale(args, async () => {
        setProcessedFiles(prev => ({ ...prev, [idx]: outPath }));
        // Continue if Image Mode
        if (mode === 'image') await processNext(idx + 1);
        else setCurrentFileIndex(-1); // Video mode stops after one for safety/ux
      }, () => setCurrentFileIndex(-1));
    };

    processNext(startIndex);
  }, [files, processing, currentFileIndex, options, runUpscale, mode]);

  // --- RENDER ---
  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col font-sans overflow-hidden select-none">
      <ToastContainer />
      
      {/* GLOBAL NAVBAR (Hidden on Landing) */}
      {mode !== 'landing' && (
        <header className="h-12 border-b border-white/10 bg-panel flex items-center justify-between px-4 z-50">
           <div className="flex items-center gap-6">
              <button onClick={() => setMode('landing')} className="hover:text-primary transition-colors">
                 <HomeIcon className="w-5 h-5" />
              </button>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex gap-1 bg-black p-1 rounded-sm border border-white/5">
                 <NavTab 
                    active={mode === 'image'} 
                    onClick={() => setMode('image')} 
                    icon={PhotoIcon} 
                    label="IMAGE STUDIO" 
                 />
                 <NavTab 
                    active={mode === 'video'} 
                    onClick={() => setMode('video')} 
                    icon={FilmIcon} 
                    label="VIDEO LAB" 
                 />
              </div>
           </div>

           <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500">
              <span className={clsx("w-2 h-2 rounded-full", processing ? "bg-primary animate-pulse" : "bg-green-500")} />
              <span>{processing ? "ENGINE BUSY" : "SYSTEM IDLE"}</span>
           </div>
        </header>
      )}

      {/* CONTENT SWITCHER */}
      <main className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
           {mode === 'landing' && (
             <motion.div key="landing" className="absolute inset-0" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
               <LandingPage onSelectMode={setMode} />
             </motion.div>
           )}

           {mode === 'image' && (
             <motion.div key="image" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <ImageStudio 
                 files={files}
                 onDrop={handleDropFiles}
                 onRemove={handleRemove}
                 processedFiles={processedFiles}
                 processing={processing}
                 onStart={processQueue}
                 options={options}
                 setOptions={setOptions}
               />
             </motion.div>
           )}

           {mode === 'video' && (
             <motion.div key="video" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <VideoLab 
                 file={files[0]} // Just take first for the Lab
                 onStart={processQueue}
                 onStop={cancelUpscale}
                 progress={progress}
                 processing={processing}
                 options={options}
                 setOptions={setOptions}
               />
               
               {/* Video Lab drop overlay if empty */}
               {files.length === 0 && (
                   <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-96">
                          <UploadZone onDropFiles={handleDropFiles} />
                      </div>
                   </div>
               )}
             </motion.div>
           )}
        </AnimatePresence>
      </main>

    </div>
  );
}

const NavTab = ({ active, onClick, icon: Icon, label }) => (
  <button 
    onClick={onClick}
    className={clsx(
      "flex items-center gap-2 px-3 py-1 rounded-sm text-[10px] font-bold tracking-wider transition-all",
      active ? "bg-white text-black" : "text-gray-500 hover:text-white"
    )}
  >
    <Icon className="w-3 h-3" />
    {label}
  </button>
);

export default App;
