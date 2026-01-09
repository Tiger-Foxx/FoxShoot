import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Square3Stack3DIcon, 
  Cog6ToothIcon, 
  PhotoIcon, 
  FilmIcon, 
  PlayIcon, 
  StopIcon,
  QueueListIcon,
  SparklesIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { convertFileSrc } from '@tauri-apps/api/core';
import clsx from 'clsx';

// Components
import { UploadZone } from './components/UploadZone';
import { ProgressBar } from './components/ProgressBar';
import { OptionsPanel } from './components/OptionsPanel';
import { BatchList } from './components/BatchList';
import { PreviewCard } from './components/PreviewCard';
import { ToastContainer } from './components/ToastContainer';

// Hooks/Utils
import { useUpscaleCLI } from './hooks/useUpscaleCLI';
import { getFileType } from './utils/fileUtils';

function App() {
  const [activeTab, setActiveTab ] = useState('upscale'); // 'upscale', 'engine'
  const [files, setFiles] = useState([]);
  const [processedFiles, setProcessedFiles] = useState({});
  const [currentFileIndex, setCurrentFileIndex] = useState(-1);
  const [showQueue, setShowQueue] = useState(true);
  
  const [options, setOptions] = useState({
    scale: 2,
    quality: 'medium',
    format: 'mp4',
    noAudio: false,
    preset: 'medium',
    tileSize: 0
  });

  const { runUpscale, cancelUpscale, processing, progress } = useUpscaleCLI();

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
    let startIndex = currentFileIndex + 1;
    if (startIndex >= files.length) startIndex = 0;

    const processNext = async (idx) => {
      if (idx >= files.length) {
        setCurrentFileIndex(-1);
        return;
      }
      setCurrentFileIndex(idx);
      const file = files[idx];
      const type = getFileType(file.name);
      
      const inputPath = file.path; 
      if (!inputPath) {
         await new Promise(r => setTimeout(r, 1000));
         await processNext(idx + 1);
         return;
      }

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
         args.push('--quality', options.quality, '--format', options.format);
         if (options.preset !== 'medium') args.push('--preset', options.preset);
         if (options.noAudio) args.push('--no-audio');
      }
      if (options.tileSize > 0) args.push('--tile-size', String(options.tileSize));

      await runUpscale(args, async () => {
        setProcessedFiles(prev => ({ ...prev, [idx]: outPath }));
        await processNext(idx + 1);
      }, () => setCurrentFileIndex(-1));
    };

    processNext(startIndex);
  }, [files, processing, currentFileIndex, options, runUpscale]);

  const activeIndex = currentFileIndex !== -1 ? currentFileIndex : (files.length > 0 ? 0 : -1);
  const activeFile = files[activeIndex];

  return (
    <div className="h-screen w-screen bg-background text-white flex overflow-hidden mesh-bg">
      <ToastContainer />

      {/* --- SIDEBAR NAV --- */}
      <aside className="w-16 glass flex flex-col items-center py-6 gap-8 z-50">
        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 p-2">
           <img src="/logo-fox-shoot.png" alt="Fox" className="w-full h-full object-contain" />
        </div>

        <nav className="flex flex-col gap-4">
           <SideNavIcon 
              icon={PhotoIcon} 
              active={activeTab === 'upscale'} 
              onClick={() => setActiveTab('upscale')} 
              label="Upscale" 
           />
           <SideNavIcon 
              icon={Cog6ToothIcon} 
              active={activeTab === 'engine'} 
              onClick={() => setActiveTab('engine')} 
              label="Engine" 
           />
        </nav>

        <div className="mt-auto">
           <div className={clsx(
             "w-2 h-2 rounded-full",
             processing ? "bg-primary animate-pulse" : "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
           )} />
        </div>
      </aside>

      {/* --- MAIN STAGE --- */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-16 px-8 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">
              {activeTab === 'upscale' ? 'Precision Upscaling' : 'Engine Configuration'}
            </h2>
            <SparklesIcon className="w-4 h-4 text-primary animate-pulse-slow ml-2" />
          </div>

          <div className="flex items-center gap-4">
             {files.length > 0 && (
               <button 
                 onClick={() => setShowQueue(!showQueue)}
                 className="p-2 hover:bg-white/5 rounded-lg transition-colors relative"
               >
                 <QueueListIcon className="w-5 h-5 text-gray-400" />
                 <span className="absolute -top-1 -right-1 bg-primary text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                   {files.length}
                 </span>
               </button>
             )}
          </div>
        </header>

        <div className="flex-1 p-8 flex flex-col gap-6 overflow-hidden">
          
          <AnimatePresence mode="wait">
            {activeTab === 'upscale' ? (
              <motion.div 
                key="upscale"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex flex-col gap-6"
              >
                 {/* PREVIEW ZONE */}
                 <div className="flex-1 min-h-0">
                    <PreviewCard 
                      original={activeFile ? activeFile.preview : null} 
                      processed={activeFile && processedFiles[files.indexOf(activeFile)] ? convertFileSrc(processedFiles[files.indexOf(activeFile)]) : null}
                    />
                 </div>

                 {/* ACTION BAR */}
                 <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-8">
                       <ProgressBar 
                         percent={progress.percent} 
                         eta={progress.eta}
                         status={progress.status}
                         isProcessing={processing}
                       />
                    </div>
                    <div className="col-span-4 flex gap-2">
                       {processing ? (
                         <button 
                           onClick={cancelUpscale}
                           className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 py-3 rounded-xl hover:bg-red-500/20 transition-all uppercase text-xs font-bold tracking-widest"
                         >
                           <StopIcon className="w-4 h-4" /> Stop
                         </button>
                       ) : (
                         <button 
                           onClick={processQueue}
                           disabled={files.length === 0}
                           className={clsx(
                             "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all uppercase text-xs font-bold tracking-widest shadow-xl",
                             files.length > 0 
                               ? "bg-primary text-white hover:bg-primary-dark hover:shadow-primary/20 glow-primary" 
                               : "bg-white/5 text-gray-500 cursor-not-allowed"
                           )}
                         >
                           <PlayIcon className="w-4 h-4" /> Start Loop
                         </button>
                       )}
                    </div>
                 </div>
              </motion.div>
            ) : (
              <motion.div 
                key="engine"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="flex-1 glass rounded-3xl p-10 flex flex-col items-center justify-center"
              >
                <div className="w-full max-w-2xl">
                   <OptionsPanel options={options} setOptions={setOptions} disabled={processing} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* --- QUEUE DRAWER (RIGHT) --- */}
      <AnimatePresence>
        {showQueue && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="w-80 h-full glass p-6 flex flex-col gap-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Project Files</h3>
              <button 
                onClick={() => setShowQueue(false)}
                className="p-1 hover:bg-white/5 rounded"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>

            <UploadZone onDropFiles={handleDropFiles} />

            <div className="flex-1 min-h-0">
               <BatchList 
                 files={files} 
                 onRemove={handleRemove} 
                 currentFileIndex={currentFileIndex}
                 processing={processing}
               />
            </div>
            
            {files.length > 0 && !processing && (
              <button 
                onClick={() => handleRemove('all')}
                className="text-[10px] uppercase font-bold text-gray-500 hover:text-red-400 self-center transition-colors"
              >
                Flush Queue
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SideNavIcon = ({ icon: Icon, active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={clsx(
      "group relative p-3 rounded-xl transition-all duration-300",
      active 
        ? "bg-primary text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]" 
        : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
    )}
  >
    <Icon className="w-6 h-6" />
    <span className="absolute left-full ml-4 px-2 py-1 bg-black text-[10px] font-bold uppercase tracking-widest rounded border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100]">
      {label}
    </span>
  </button>
);

export default App;
