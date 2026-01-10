import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatETA } from '../utils/formatETA';
import { useMediaInfo } from '../hooks/useMediaInfo';
import { PlayIcon, StopIcon, FolderOpenIcon, TrashIcon, CheckCircleIcon, FilmIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Command } from '@tauri-apps/plugin-shell';
import { convertFileSrc } from '@tauri-apps/api/core';
import { UploadZone } from './UploadZone';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const formatFileSize = (mb) => {
  if (!mb) return null;
  if (mb >= 1000) return `${(mb / 1000).toFixed(2)} GB`;
  return `${mb.toFixed(1)} MB`;
};

const formatDuration = (seconds) => {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export const VideoLab = ({ 
  files = [],
  processedFiles = {},
  currentIndex = -1,
  onDrop,
  onRemove,
  progress, 
  processing, 
  onStart, 
  onStop, 
  options, 
  setOptions 
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { t } = useTranslation();
  const activeFile = files[activeIndex];
  const processedFile = processedFiles[activeIndex];
  
  // Fetch media info from backend
  const { info: mediaInfo, loading: mediaLoading } = useMediaInfo(activeFile?.path);
  
  // Video refs for synchronization
  const originalVideoRef = useRef(null);
  const enhancedVideoRef = useRef(null);
  
  // Show comparison for THIS video if it's processed (even while other videos are still processing)
  const isThisVideoBeingProcessed = processing && currentIndex === activeIndex;
  const showComparison = !!processedFile && !isThisVideoBeingProcessed;
  const hasMultiple = files.length > 1;

  // Sync videos when one seeks or plays
  useEffect(() => {
    if (!showComparison) return;
    
    const originalVideo = originalVideoRef.current;
    const enhancedVideo = enhancedVideoRef.current;
    if (!originalVideo || !enhancedVideo) return;

    const syncVideos = () => {
      if (Math.abs(originalVideo.currentTime - enhancedVideo.currentTime) > 0.1) {
        enhancedVideo.currentTime = originalVideo.currentTime;
      }
    };

    const handlePlay = () => {
      enhancedVideo.currentTime = originalVideo.currentTime;
      enhancedVideo.play();
    };
    
    const handlePause = () => enhancedVideo.pause();
    const handleSeeked = () => { enhancedVideo.currentTime = originalVideo.currentTime; };

    originalVideo.addEventListener('play', handlePlay);
    originalVideo.addEventListener('pause', handlePause);
    originalVideo.addEventListener('seeked', handleSeeked);
    originalVideo.addEventListener('timeupdate', syncVideos);

    return () => {
      originalVideo.removeEventListener('play', handlePlay);
      originalVideo.removeEventListener('pause', handlePause);
      originalVideo.removeEventListener('seeked', handleSeeked);
      originalVideo.removeEventListener('timeupdate', syncVideos);
    };
  }, [showComparison, activeIndex]);

  const openOutputFolder = async (filePath) => {
    try {
      const folderPath = filePath.split('\\').slice(0, -1).join('\\');
      const command = Command.create('cmd', ['/c', 'explorer', folderPath]);
      await command.execute();
    } catch (err) {
      console.error('Failed to open folder:', err);
      toast.error(t('common.error_folder'));
    }
  };

  const handleClearAll = () => {
    onRemove('all');
    setActiveIndex(0);
  };

  // Empty state
  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <UploadZone onDropFiles={onDrop} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4 p-4">
      
      {/* LEFT: QUEUE (only if multiple files) */}
      {hasMultiple && (
        <div className="w-64 bg-panel border border-white/5 flex flex-col">
          <div className="p-3 border-b border-white/5 flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase text-gray-400">{t('batch.queue_count', { count: files.length })}</span>
            {!processing && (
              <button onClick={handleClearAll} className="text-gray-600 hover:text-red-500" title={t('common.remove')}>
                <TrashIcon className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {files.map((f, i) => {
              const isProcessing = i === currentIndex && processing;
              const isProcessed = !!processedFiles[i];
              const canDelete = !isProcessing; // Can delete if not currently processing
              
              return (
                <div 
                  key={i} 
                  className={`group flex items-center gap-2 p-2 cursor-pointer text-xs border transition-colors ${
                    i === activeIndex 
                      ? "bg-white/10 text-white border-white/10" 
                      : "text-gray-500 hover:text-gray-300 border-transparent"
                  } ${isProcessed ? "border-l-2 border-l-green-500" : ""} ${
                    isProcessing ? "border-l-2 border-l-primary" : ""
                  }`}
                >
                  <div onClick={() => setActiveIndex(i)} className="flex items-center gap-2 flex-1 min-w-0">
                    {isProcessed ? (
                      <CheckCircleIcon className="w-3 h-3 text-green-500 shrink-0" />
                    ) : isProcessing ? (
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <FilmIcon className="w-3 h-3 text-gray-600 shrink-0" />
                    )}
                    <span className="truncate flex-1 font-mono">{f.name}</span>
                  </div>
                  {canDelete && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 transition-all p-0.5"
                      title="Remove from queue"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="p-2 border-t border-white/5">
            <UploadZone onDropFiles={onDrop} minimal />
          </div>
        </div>
      )}
      
      {/* CENTER: MONITOR */}
      <div className="flex-1 flex flex-col gap-4">
        
        {/* VIEWPORT */}
        <div className="flex-1 bg-black border border-white/10 relative overflow-hidden">

            {/* Video Display */}
            {!showComparison ? (
              <div className="absolute inset-0 flex items-center justify-center group">
                  {activeFile ? (
                     <video 
                        src={convertFileSrc(activeFile.path)} 
                        className="w-full h-full object-contain" 
                        muted
                        loop autoPlay playsInline
                        controls
                     />
                  ) : (
                     <div className="text-gray-700 font-mono text-xs tracking-widest">{t('batch.no_signals').toUpperCase()}</div>
                  )}
              </div>
            ) : (
              // SYNCHRONIZED SIDE BY SIDE COMPARISON
              <div className="absolute inset-0 flex">
                <div className="flex-1 relative border-r border-primary/30">
                  <video 
                    ref={originalVideoRef}
                    src={convertFileSrc(activeFile.path)} 
                    className="w-full h-full object-contain" 
                    muted loop autoPlay playsInline
                    controls
                  />
                  <div className="absolute top-4 left-4 bg-black/80 px-2 py-1 text-[10px] font-bold text-gray-400 border border-white/10 pointer-events-none">
                    {t('common.original').toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 relative">
                  <video 
                    ref={enhancedVideoRef}
                    src={convertFileSrc(processedFile)} 
                    className="w-full h-full object-contain" 
                    muted loop autoPlay playsInline
                  />
                  <div className="absolute top-4 right-4 bg-primary/90 px-2 py-1 text-[10px] font-bold text-black border border-primary pointer-events-none">
                    {t('common.enhanced').toUpperCase()}
                  </div>
                </div>
              </div>
            )}
            
            {/* SCANLINE EFFECT */}
            {processing && activeIndex === currentIndex && (
              <div className="absolute inset-0 pointer-events-none">
                 <div className="w-full h-1 bg-primary/50 shadow-[0_0_20px_rgba(249,115,22,0.8)] absolute top-0 animate-[scan_2s_linear_infinite]" 
                      style={{ animationName: 'scan' }} />
                 <style>{`@keyframes scan { 0% { top: 0% } 100% { top: 100% } }`}</style>
              </div>
            )}

            {/* OVERLAYS */}
            {!showComparison && (
              <div className="absolute top-4 left-4 flex flex-col gap-1 z-10">
                 <div className="text-[10px] bg-black/80 border border-white/20 text-primary px-2 py-0.5 font-bold font-mono">
                    {processing && activeIndex === currentIndex ? `● ${t('common.processing').toUpperCase()}` : processedFile ? `✓ ${t('common.complete').toUpperCase()}` : `○ ${t('common.standby').toUpperCase()}`}
                 </div>
                 {activeFile && <div className="text-[10px] text-gray-400 font-mono pl-1">{activeFile.name}</div>}
              </div>
            )}

            {/* REMOVE BUTTON - Single video mode only */}
            {!hasMultiple && activeFile && !processing && (
              <button 
                onClick={handleClearAll}
                className="absolute top-4 right-4 z-10 p-2 bg-black/80 border border-white/20 hover:border-red-500/50 hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                title={t('common.remove')}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
        </div>

        {/* TIMELINE / PROGRESS */}
        <div className="h-24 bg-panel border border-white/5 p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" 
                 style={{ backgroundImage: 'linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 100%' }} 
            />
            <div className="flex justify-between items-end relative z-10">
                <div>
                   <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{t('common.processing')}</div>
                   <div className="text-2xl font-mono text-white">{progress.percent.toFixed(1)}<span className="text-sm text-gray-600">%</span></div>
                </div>
                <div className="text-right">
                   <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{t('common.eta')}</div>
                   <div className="text-xl font-mono text-primary">{formatETA(progress.eta)}</div>
                </div>
            </div>
            <div className="w-full h-2 bg-black border border-white/10 mt-2 relative">
                <motion.div 
                   className="h-full bg-primary relative"
                   initial={{ width: 0 }}
                   animate={{ width: `${progress.percent}%` }}
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white" />
                </motion.div>
            </div>
        </div>
      </div>

      {/* RIGHT: CONTROLS */}
      <div className="w-72 flex flex-col gap-4">
         
         <div className="p-4 border border-white/10 bg-panel flex flex-col gap-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">{t('video_lab.config')}</h3>
            
            <ControlGroup label={t('video_lab.mode')}>
               <select className="w-full p-2 text-xs bg-black text-gray-300 border border-white/10">
                  <option>Anime Video</option>
                  <option>General</option>
               </select>
            </ControlGroup>

            <ControlGroup label={t('video_lab.scale')}>
               <div className="grid grid-cols-3 gap-1">
                 {[2, 3, 4].map(s => (
                   <button 
                     key={s}
                     onClick={() => setOptions(p => ({...p, scale: s }))}
                     disabled={processing}
                     className={`py-2 text-xs font-bold border transition-colors ${
                       options.scale === s 
                         ? "bg-primary text-black border-primary" 
                         : "bg-black text-gray-500 border-white/10 hover:border-white/30"
                     }`}
                   >
                     {s}x
                   </button>
                 ))}
               </div>
            </ControlGroup>

            <ControlGroup label={t('video_lab.format')}>
               <div className="flex gap-1">
                 {['mp4', 'mkv', 'webm'].map(f => (
                   <button 
                     key={f}
                     onClick={() => setOptions(p => ({...p, format: f }))}
                     disabled={processing}
                     className={`flex-1 py-2 text-[10px] font-bold uppercase border transition-colors ${
                       options.format === f 
                         ? "bg-white text-black border-white" 
                         : "bg-black text-gray-500 border-white/10 hover:border-white/30"
                     }`}
                   >
                     {f}
                   </button>
                 ))}
               </div>
            </ControlGroup>
         </div>

         {/* MEDIA INFO */}
         {activeFile && (
           <div className="p-4 border border-white/10 bg-panel space-y-3">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
               {t('video_lab.media_info')}
               {mediaLoading && <div className="w-2 h-2 border border-primary border-t-transparent rounded-full animate-spin" />}
             </h3>
             
             {mediaInfo ? (
               <div className="space-y-2 text-[10px]">
                 {/* Resolution */}
                 <div className="flex justify-between">
                   <span className="text-gray-600">{t('video_lab.resolution')}</span>
                   <span className="text-white font-mono">{mediaInfo.width}×{mediaInfo.height}</span>
                 </div>
                 {/* Duration */}
                 {mediaInfo.duration_seconds && (
                   <div className="flex justify-between">
                     <span className="text-gray-600">{t('video_lab.duration')}</span>
                     <span className="text-gray-300 font-mono">{formatDuration(mediaInfo.duration_seconds)}</span>
                   </div>
                 )}
                 {/* FPS */}
                 {mediaInfo.fps && (
                   <div className="flex justify-between">
                     <span className="text-gray-600">{t('video_lab.fps')}</span>
                     <span className="text-gray-300 font-mono">{mediaInfo.fps.toFixed(2)} {t('common.fps_label')}</span>
                   </div>
                 )}
                 {/* Frame Count */}
                 {mediaInfo.frame_count && (
                   <div className="flex justify-between">
                     <span className="text-gray-600">{t('video_lab.frames')}</span>
                     <span className="text-gray-300 font-mono">{mediaInfo.frame_count.toLocaleString()}</span>
                   </div>
                 )}
                 {/* File Size */}
                 {mediaInfo.size_mb && (
                   <div className="flex justify-between">
                     <span className="text-gray-600">{t('video_lab.size')}</span>
                     <span className="text-gray-300 font-mono">{formatFileSize(mediaInfo.size_mb)}</span>
                   </div>
                 )}
                 {/* Codec */}
                 <div className="flex justify-between">
                   <span className="text-gray-600">{t('video_lab.codec')}</span>
                   <span className="text-gray-300 font-mono uppercase">{mediaInfo.video_codec || t('common.unknown')}</span>
                 </div>
                 {/* Audio */}
                 <div className="flex justify-between">
                   <span className="text-gray-600">{t('video_lab.audio')}</span>
                   <span className={`font-mono uppercase ${mediaInfo.has_audio ? 'text-green-400' : 'text-gray-600'}`}>
                     {mediaInfo.has_audio ? mediaInfo.audio_codec || t('common.yes') : t('common.none')}
                   </span>
                 </div>
                 
                 {/* Output Preview */}
                 <div className="pt-2 mt-2 border-t border-white/5">
                   <div className="flex justify-between text-primary">
                     <span className="font-bold">{t('video_lab.output')}</span>
                     <span className="font-mono">{mediaInfo.width * options.scale}×{mediaInfo.height * options.scale}</span>
                   </div>
                 </div>
               </div>
             ) : (
               <div className="text-[10px] text-gray-600 font-mono">
                 {mediaLoading ? t('common.analyzing') : t('common.no_info')}
               </div>
             )}
           </div>
         )}

         {/* OUTPUT INFO */}
         {processedFile && (
           <div className="p-3 bg-green-500/10 border border-green-500/30 space-y-2">
             <div className="text-[10px] text-green-400 font-bold uppercase">{t('common.output_ready')}</div>
             <button 
               onClick={() => openOutputFolder(processedFile)}
               className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-bold uppercase border border-green-500/30 hover:bg-green-500/10 text-green-400 transition-colors"
             >
               <FolderOpenIcon className="w-4 h-4" />
               {t('common.open_folder')}
             </button>
           </div>
         )}

         {/* CLEAR BUTTON (when done) */}
         {!processing && Object.keys(processedFiles).length > 0 && (
           <button 
             onClick={handleClearAll}
             className="w-full py-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase border border-white/10 hover:border-white/30 text-gray-400 hover:text-white transition-colors"
           >
             <PlusIcon className="w-4 h-4" />
             {t('common.new_session')}
           </button>
         )}

         {/* ACTION BUTTON */}
         <div className="mt-auto">
            {processing ? (
               <button onClick={onStop} className="w-full py-4 bg-red-900/20 border border-red-500/50 text-red-500 font-bold uppercase tracking-widest text-xs hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2">
                 <StopIcon className="w-4 h-4" /> {t('common.abort')}
               </button>
            ) : (
               <button onClick={onStart} disabled={files.length === 0} className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest text-xs hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                 <PlayIcon className="w-4 h-4" /> {hasMultiple ? t('video_lab.process_all', { count: files.length }) : t('video_lab.process_all', { count: '' }).split('(')[0].trim()}
               </button>
            )}
         </div>

      </div>
    </div>
  );
};

const ControlGroup = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-[10px] text-gray-600 font-bold uppercase">{label}</label>
    {children}
  </div>
);
