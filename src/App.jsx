import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { listen } from '@tauri-apps/api/event';
import { LandingPage } from './components/LandingPage';
import { ImageStudio } from './components/ImageStudio';
import { VideoLab } from './components/VideoLab';
import { SettingsPage } from './components/SettingsPage';
import { UploadZone } from './components/UploadZone';
import { ToastContainer } from './components/ToastContainer';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { useUpscaleCLI } from './hooks/useUpscaleCLI';
import { getFileType } from './utils/fileUtils';
import { HomeIcon, PhotoIcon, FilmIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const STORAGE_KEYS = {
  imageFiles: 'foxshoot_image_files',
  videoFiles: 'foxshoot_video_files'
};

function AppContent() {
  const [mode, setMode] = useState('landing'); // 'landing', 'image', 'video', 'settings'
  const { settings } = useSettings();
  const { t } = useTranslation();
  
  // SEPARATE QUEUES FOR IMAGE AND VIDEO
  const [imageFiles, setImageFiles] = useState([]);
  const [imageProcessedFiles, setImageProcessedFiles] = useState({});
  const [imageCurrentIndex, setImageCurrentIndex] = useState(-1);
  
  const [videoFiles, setVideoFiles] = useState([]);
  const [videoProcessedFiles, setVideoProcessedFiles] = useState({});
  const [videoCurrentIndex, setVideoCurrentIndex] = useState(-1);
  
  const [options, setOptions] = useState({
    scale: settings.defaultScale || 2,
    quality: 'medium',
    format: 'mp4',
    noAudio: false,
    preset: 'medium',
    tileSize: 0
  });

  const { runUpscale, cancelUpscale, processing, progress } = useUpscaleCLI();

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const savedImages = localStorage.getItem(STORAGE_KEYS.imageFiles);
      const savedVideos = localStorage.getItem(STORAGE_KEYS.videoFiles);
      if (savedImages) setImageFiles(JSON.parse(savedImages));
      if (savedVideos) setVideoFiles(JSON.parse(savedVideos));
    } catch (err) {
      console.error('Failed to load from localStorage:', err);
    }
  }, []);

  // Save to LocalStorage when queues change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.imageFiles, JSON.stringify(imageFiles));
    } catch (err) {
      console.error('Failed to save images to localStorage:', err);
    }
  }, [imageFiles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.videoFiles, JSON.stringify(videoFiles));
    } catch (err) {
      console.error('Failed to save videos to localStorage:', err);
    }
  }, [videoFiles]);

  // Track if we should auto-start processing (from CLI --enhance)
  const [autoStartEnhance, setAutoStartEnhance] = useState(false);

  // Listen for 'enhance-files' event from Tauri (Windows context menu integration)
  // Supports both single and multiple file selection
  useEffect(() => {
    let unlisten;
    
    const setup = async () => {
      unlisten = await listen('enhance-files', (event) => {
        const filePaths = Array.isArray(event.payload) ? event.payload : [event.payload];
        console.log('Received enhance-files event:', filePaths);
        
        if (!filePaths || filePaths.length === 0) return;
        
        const imageFileObjs = [];
        const videoFileObjs = [];
        
        // Process each file path
        filePaths.forEach(filePath => {
          if (!filePath) return;
          
          const fileName = filePath.split(/[/\\]/).pop();
          const fileType = getFileType(fileName);
          
          const fileObj = {
            file: null,
            path: filePath,
            name: fileName,
            preview: null
          };
          
          if (fileType === 'video') {
            videoFileObjs.push(fileObj);
          } else {
            imageFileObjs.push(fileObj);
          }
        });
        
        // Add files to appropriate queues
        if (imageFileObjs.length > 0) {
          setImageFiles(imageFileObjs);
          setImageProcessedFiles({});
          setMode('image');
          toast.success(`🦊 ${imageFileObjs.length} image${imageFileObjs.length > 1 ? 's' : ''} added`);
        }
        
        if (videoFileObjs.length > 0) {
          setVideoFiles(videoFileObjs);
          setVideoProcessedFiles({});
          if (imageFileObjs.length === 0) {
            setMode('video');
          }
          toast.success(`🦊 ${videoFileObjs.length} video${videoFileObjs.length > 1 ? 's' : ''} added`);
        }
        
        // Mark that we should auto-start
        setAutoStartEnhance(true);
      });
    };
    
    setup();
    
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // Determine current files based on mode
  const files = mode === 'video' ? videoFiles : imageFiles;
  const setFiles = mode === 'video' ? setVideoFiles : setImageFiles;
  const processedFiles = mode === 'video' ? videoProcessedFiles : imageProcessedFiles;
  const setProcessedFiles = mode === 'video' ? setVideoProcessedFiles : setImageProcessedFiles;
  const currentFileIndex = mode === 'video' ? videoCurrentIndex : imageCurrentIndex;
  const setCurrentFileIndex = mode === 'video' ? setVideoCurrentIndex : setImageCurrentIndex;

  // --- LOGIC ---
  const handleDropFiles = useCallback((newFiles) => {
    if (mode === 'video') {
      setVideoFiles(prev => [...prev, ...newFiles]);
    } else {
      setImageFiles(prev => [...prev, ...newFiles]);
    }
  }, [mode]);

  const handleRemove = useCallback((index) => {
    if (processing) return;
    if (index === 'all') {
      setFiles([]);
      setCurrentFileIndex(-1);
      setProcessedFiles({});
    } else {
      setFiles(prev => prev.filter((_, i) => i !== index));
    }
  }, [processing, setFiles, setCurrentFileIndex, setProcessedFiles]);

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
      
      if (!file.path) {
        await new Promise(r => setTimeout(r, 1000));
        await processNext(idx + 1);
        return;
      }

      // Determine output path
      let outPath;
      if (settings.outputFolder) {
        const fileName = file.name.split('.').slice(0, -1).join('.');
        const ext = type === 'video' ? options.format : file.name.split('.').pop();
        outPath = `${settings.outputFolder}\\${fileName}_upscaled_${options.scale}x.${ext}`;
      } else {
        const parts = file.path.split('.');
        const ext = parts.pop();
        const basePath = parts.join('.');
        outPath = `${basePath}_upscaled_${options.scale}x.${type === 'video' ? options.format : ext}`;
      }

      const args = ['-i', file.path, '-o', outPath, '-s', String(options.scale)];
      
      if (type === 'video') {
        args.push('--quality', options.quality, '--format', options.format);
        if (options.preset !== 'medium') args.push('--preset', options.preset);
        if (options.noAudio) args.push('--no-audio');
      }
      if (options.tileSize > 0) args.push('--tile-size', String(options.tileSize));

      await runUpscale(args, async () => {
        setProcessedFiles(prev => ({ ...prev, [idx]: outPath }));
        // Continue to next file in queue
        await processNext(idx + 1);
      }, () => setCurrentFileIndex(-1));
    };

    await processNext(startIndex);
  }, [files, processing, currentFileIndex, options, settings, runUpscale, setCurrentFileIndex, setProcessedFiles]);

  // Auto-start processing when file was added via --enhance CLI
  useEffect(() => {
    if (autoStartEnhance && files.length > 0 && !processing) {
      setAutoStartEnhance(false);
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        processQueue();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoStartEnhance, files, processing, processQueue]);

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col font-sans overflow-hidden select-none">
      <ToastContainer />
      
      {/* GLOBAL NAVBAR (Hidden on Landing) */}
      {mode !== 'landing' && mode !== 'settings' && (
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
                    label={t('nav.image_studio')}
                    count={imageFiles.length > 0 ? imageFiles.length : null}
                 />
                 <NavTab 
                    active={mode === 'video'} 
                    onClick={() => setMode('video')} 
                    icon={FilmIcon} 
                    label={t('nav.video_lab')}
                    count={videoFiles.length > 0 ? videoFiles.length : null}
                 />
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                <span className={clsx("w-2 h-2 rounded-full", processing ? "bg-primary animate-pulse" : "bg-green-500")} />
                <span>{processing ? t('nav.engine_busy') : t('nav.system_idle')}</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <button 
                onClick={() => setMode('settings')} 
                className="p-2 text-gray-500 hover:text-primary transition-colors"
                title={t('common.settings')}
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </button>
           </div>
        </header>
      )}

      {/* CONTENT SWITCHER */}
      <main className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
           {mode === 'landing' && (
             <motion.div key="landing" className="absolute inset-0" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
               <LandingPage onSelectMode={setMode} onOpenSettings={() => setMode('settings')} />
             </motion.div>
           )}

           {mode === 'image' && (
             <motion.div key="image" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <ImageStudio 
                 files={imageFiles}
                 onDrop={(f) => setImageFiles(prev => [...prev, ...f])}
                 onRemove={(i) => {
                   if (i === 'all') {
                     setImageFiles([]);
                     setImageCurrentIndex(-1);
                     setImageProcessedFiles({});
                   } else {
                     setImageFiles(prev => prev.filter((_, idx) => idx !== i));
                   }
                 }}
                 processedFiles={imageProcessedFiles}
                 processing={processing}
                 progress={progress}
                 onStart={processQueue}
                 options={options}
                 setOptions={setOptions}
               />
             </motion.div>
           )}

           {mode === 'video' && (
             <motion.div key="video" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <VideoLab 
                 files={videoFiles}
                 processedFiles={videoProcessedFiles}
                 currentIndex={videoCurrentIndex}
                 onDrop={(f) => setVideoFiles(prev => [...prev, ...f])}
                 onRemove={(i) => {
                   if (i === 'all') {
                     setVideoFiles([]);
                     setVideoCurrentIndex(-1);
                     setVideoProcessedFiles({});
                   } else {
                     setVideoFiles(prev => prev.filter((_, idx) => idx !== i));
                   }
                 }}
                 onStart={processQueue}
                 onStop={cancelUpscale}
                 progress={progress}
                 processing={processing}
                 options={options}
                 setOptions={setOptions}
               />
             </motion.div>
           )}

           {mode === 'settings' && (
             <motion.div key="settings" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <SettingsPage onBack={() => setMode('image')} />
             </motion.div>
           )}
        </AnimatePresence>
      </main>
    </div>
  );
}

const NavTab = ({ active, onClick, icon: Icon, label, count }) => (
   <button 
      onClick={onClick}
      className={clsx(
         "flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all",
         active ? "bg-primary text-black" : "text-gray-500 hover:text-white"
      )}
   >
      <Icon className="w-4 h-4" />
      {label}
      {count && (
        <span className={clsx(
          "ml-1 px-1.5 py-0.5 text-[9px] rounded-sm",
          active ? "bg-black/20 text-black" : "bg-white/10 text-gray-400"
        )}>
          {count}
        </span>
      )}
   </button>
);

export default function App() {
   return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
   );
}
