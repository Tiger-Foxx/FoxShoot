import { useState } from 'react';
import { ComparisonView } from './ComparisonView';
import { UploadZone } from './UploadZone';
import { TrashIcon, FolderOpenIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Command } from '@tauri-apps/plugin-shell';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export const ImageStudio = ({ files, onDrop, onRemove, processedFiles, processing, progress, onStart, options, setOptions }) => {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const activeFile = files[activeFileIndex];
  
  // Convert local paths to displayable URLs
  const originalSrc = activeFile ? convertFileSrc(activeFile.path) : null;
  const processedSrc = activeFile && processedFiles[activeFileIndex] ? convertFileSrc(processedFiles[activeFileIndex]) : null;

  const copyOutputPath = (path) => {
    navigator.clipboard.writeText(path);
    toast.success('Path copied to clipboard!');
  };

  const openOutputFolder = async (filePath) => {
    try {
      // Get folder path from file path
      const folderPath = filePath.split('\\').slice(0, -1).join('\\');
      // Use explorer.exe to open folder on Windows
      const command = Command.create('cmd', ['/c', 'explorer', folderPath]);
      await command.execute();
    } catch (err) {
      console.error('Failed to open folder:', err);
      toast.error('Failed to open folder');
    }
  };

  return (
    <div className="flex h-full">
      
      {/* SIDEBAR TOOLS */}
      <div className="w-80 bg-panel border-r border-white/5 flex flex-col p-4 gap-4 z-10">
         <div className="space-y-1 pb-4 border-b border-white/5">
            <h2 className="text-lg font-black text-white uppercase tracking-tighter">Image Studio</h2>
            <p className="text-xs text-gray-600 font-mono">Pixel Perfect Restoration</p>
         </div>

         {/* SETTINGS MINI */}
         <div className="space-y-4">
            <div className="space-y-1">
               <label className="text-[10px] text-gray-500 font-bold uppercase">Scale Factor</label>
               <div className="flex gap-1">
                  {[2, 3, 4].map(s => (
                     <button
                        key={s}
                        onClick={() => setOptions(o => ({...o, scale: s }))}
                        disabled={processing}
                        className={clsx(
                           "flex-1 py-1.5 text-xs font-bold border border-white/10",
                           options.scale === s ? "bg-primary text-black border-primary" : "text-gray-400 hover:text-white"
                        )}
                     >
                        {s}x
                     </button>
                  ))}
               </div>
            </div>
         </div>

         {/* PROGRESS DISPLAY (when processing) */}
         {processing && progress && (
           <div className="p-3 bg-primary/5 border border-primary/20 space-y-3">
             <div className="flex justify-between items-end">
               <div>
                 <div className="text-[10px] text-primary font-bold uppercase tracking-widest">Processing</div>
                 <div className="text-xs text-gray-400 font-mono truncate max-w-[180px]">{progress.status}</div>
               </div>
               <div className="text-right">
                 <div className="text-2xl font-black text-white tabular-nums">
                   {progress.percent.toFixed(1)}<span className="text-primary text-sm">%</span>
                 </div>
               </div>
             </div>
             
             {/* Progress Bar */}
             <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
               <motion.div 
                 className="h-full bg-primary"
                 initial={{ width: 0 }}
                 animate={{ width: `${progress.percent}%` }}
                 transition={{ duration: 0.3 }}
               />
             </div>
             
             {progress.eta > 0 && (
               <div className="text-[10px] text-gray-500 font-mono text-right">
                 ETA: {Math.round(progress.eta)}s
               </div>
             )}
           </div>
         )}

         {/* QUEUE LIST */}
         <div className="flex-1 flex flex-col min-h-0 bg-black/20 border border-white/5">
             <div className="p-2 border-b border-white/5 flex justify-between items-center bg-white/5">
                <span className="text-[10px] font-bold uppercase text-gray-400">Queue ({files.length})</span>
                {files.length > 0 && !processing && (
                  <button onClick={() => onRemove('all')} className="text-gray-600 hover:text-red-500"><TrashIcon className="w-3 h-3" /></button>
                )}
             </div>
             
             <div className="flex-1 overflow-y-auto p-1 space-y-1 custom-scrollbar">
                {files.map((f, i) => {
                 const isProcessed = !!processedFiles[i];
                 
                 return (
                    <div
                       key={i}
                       className={clsx(
                          "group flex items-center gap-2 p-2 cursor-pointer text-xs border transition-colors",
                          i === activeFileIndex ? "bg-white/10 text-white border-white/10" : "text-gray-500 hover:text-gray-300 border-transparent",
                          isProcessed ? "border-l-2 border-l-green-500" : ""
                       )}
                    >
                        <div onClick={() => setActiveFileIndex(i)} className="flex items-center gap-2 flex-1 min-w-0">
                          {isProcessed ? (
                            <CheckCircleIcon className="w-3 h-3 text-green-500 shrink-0" />
                          ) : (
                            <div className="w-3 h-3 rounded-full border border-gray-600 shrink-0" />
                          )}
                          <span className="truncate flex-1 font-mono">{f.name}</span>
                        </div>
                        {!processing && (
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
                
                <div className="p-2">
                   <UploadZone onDropFiles={onDrop} minimal />
                </div>
             </div>
         </div>

         {/* OUTPUT INFO */}
         {processedFiles[activeFileIndex] && (
           <div className="space-y-2">
             <div 
               onClick={() => copyOutputPath(processedFiles[activeFileIndex])}
               className="p-3 bg-green-500/10 border border-green-500/30 cursor-pointer hover:bg-green-500/20 transition-colors"
             >
               <div className="text-[10px] text-green-400 font-bold uppercase mb-1">Output Saved</div>
               <div className="text-[9px] text-green-300/70 font-mono truncate">
                 {processedFiles[activeFileIndex]}
               </div>
             </div>
             <button 
               onClick={() => openOutputFolder(processedFiles[activeFileIndex])}
               className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-bold uppercase border border-white/10 hover:border-primary/50 hover:text-primary transition-colors"
             >
               <FolderOpenIcon className="w-4 h-4" />
               Open Folder
             </button>
           </div>
         )}

         {/* START BUTTON */}
         <button 
           onClick={onStart} 
           disabled={processing || files.length === 0}
           className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
         >
            {processing ? "PROCESSING..." : "START BATCH"}
         </button>
      </div>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 bg-black relative flex flex-col">
         {/* Top Info Bar */}
         <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 bg-panel">
            <span className="text-[10px] font-mono text-gray-500 uppercase">
               {activeFile ? `${activeFile.name} ${processedSrc ? '[ENHANCED]' : '[SOURCE]'}` : "IDLE"}
            </span>
            <div className="flex gap-4">
               <span className="text-[10px] font-mono text-gray-600">ZOOM: FIT</span>
            </div>
         </div>
         
         {/* Canvas */}
         <div className="flex-1 relative overflow-hidden">
            <ComparisonView 
               original={originalSrc}
               processed={processedSrc}
            />
         </div>
      </div>

    </div>
  );
};
