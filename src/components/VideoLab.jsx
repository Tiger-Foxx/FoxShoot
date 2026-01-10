import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatETA } from '../utils/formatETA';
import { PlayIcon, StopIcon, FolderOpenIcon, TrashIcon, CheckCircleIcon, FilmIcon } from '@heroicons/react/24/outline';
import { Command } from '@tauri-apps/plugin-shell';
import { convertFileSrc } from '@tauri-apps/api/core';
import { UploadZone } from './UploadZone';
import toast from 'react-hot-toast';

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
  const activeFile = files[activeIndex];
  const processedFile = processedFiles[activeIndex];
  
  // Auto-show comparison when processing is done
  const showComparison = !!processedFile && !processing;
  const hasMultiple = files.length > 1;

  const openOutputFolder = async (filePath) => {
    try {
      const folderPath = filePath.split('\\').slice(0, -1).join('\\');
      const command = Command.create('cmd', ['/c', 'explorer', folderPath]);
      await command.execute();
    } catch (err) {
      console.error('Failed to open folder:', err);
      toast.error('Failed to open folder');
    }
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
            <span className="text-[10px] font-bold uppercase text-gray-400">Queue ({files.length})</span>
            {!processing && (
              <button onClick={() => onRemove('all')} className="text-gray-600 hover:text-red-500">
                <TrashIcon className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {files.map((f, i) => (
              <div 
                key={i} 
                onClick={() => setActiveIndex(i)}
                className={`flex items-center gap-2 p-2 cursor-pointer text-xs border transition-colors ${
                  i === activeIndex 
                    ? "bg-white/10 text-white border-white/10" 
                    : "text-gray-500 hover:text-gray-300 border-transparent"
                } ${processedFiles[i] ? "border-l-2 border-l-green-500" : ""} ${
                  i === currentIndex && processing ? "border-l-2 border-l-primary" : ""
                }`}
              >
                {processedFiles[i] ? (
                  <CheckCircleIcon className="w-3 h-3 text-green-500 shrink-0" />
                ) : i === currentIndex && processing ? (
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <FilmIcon className="w-3 h-3 text-gray-600 shrink-0" />
                )}
                <span className="truncate flex-1 font-mono">{f.name}</span>
              </div>
            ))}
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
                        className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-all duration-500" 
                        muted loop autoPlay playsInline
                     />
                  ) : (
                     <div className="text-gray-700 font-mono text-xs tracking-widest">NO SIGNAL INPUT</div>
                  )}
              </div>
            ) : (
              <div className="absolute inset-0 flex">
                <div className="flex-1 relative border-r border-primary/30">
                  <video 
                    src={convertFileSrc(activeFile.path)} 
                    className="w-full h-full object-contain" 
                    muted loop autoPlay playsInline
                  />
                  <div className="absolute top-4 left-4 bg-black/80 px-2 py-1 text-[10px] font-bold text-gray-400 border border-white/10">
                    ORIGINAL
                  </div>
                </div>
                <div className="flex-1 relative">
                  <video 
                    src={convertFileSrc(processedFile)} 
                    className="w-full h-full object-contain" 
                    muted loop autoPlay playsInline
                  />
                  <div className="absolute top-4 right-4 bg-primary/90 px-2 py-1 text-[10px] font-bold text-black border border-primary">
                    ENHANCED
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
                    {processing && activeIndex === currentIndex ? "● ENCODING" : processedFile ? "✓ COMPLETE" : "○ STANDBY"}
                 </div>
                 {activeFile && <div className="text-[10px] text-gray-400 font-mono pl-1">{activeFile.name}</div>}
              </div>
            )}
        </div>

        {/* TIMELINE / PROGRESS */}
        <div className="h-24 bg-panel border border-white/5 p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" 
                 style={{ backgroundImage: 'linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 100%' }} 
            />
            <div className="flex justify-between items-end relative z-10">
                <div>
                   <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Progress</div>
                   <div className="text-2xl font-mono text-white">{progress.percent.toFixed(1)}<span className="text-sm text-gray-600">%</span></div>
                </div>
                <div className="text-right">
                   <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">ETA</div>
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
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">Config</h3>
            
            <ControlGroup label="Mode">
               <select className="w-full p-2 text-xs bg-black text-gray-300 border border-white/10">
                  <option>Anime Video</option>
                  <option>General</option>
               </select>
            </ControlGroup>

            <ControlGroup label="Scale">
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

            <ControlGroup label="Format">
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

         {/* OUTPUT INFO */}
         {processedFile && (
           <div className="p-3 bg-green-500/10 border border-green-500/30 space-y-2">
             <div className="text-[10px] text-green-400 font-bold uppercase">Output Ready</div>
             <button 
               onClick={() => openOutputFolder(processedFile)}
               className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-bold uppercase border border-green-500/30 hover:bg-green-500/10 text-green-400 transition-colors"
             >
               <FolderOpenIcon className="w-4 h-4" />
               Open Folder
             </button>
           </div>
         )}

         {/* ACTION BUTTON */}
         <div className="mt-auto">
            {processing ? (
               <button onClick={onStop} className="w-full py-4 bg-red-900/20 border border-red-500/50 text-red-500 font-bold uppercase tracking-widest text-xs hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2">
                 <StopIcon className="w-4 h-4" /> ABORT
               </button>
            ) : (
               <button onClick={onStart} disabled={files.length === 0} className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest text-xs hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                 <PlayIcon className="w-4 h-4" /> {hasMultiple ? `PROCESS ALL (${files.length})` : 'START'}
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
