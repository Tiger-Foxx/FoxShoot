import { useState } from 'react';
import { ComparisonView } from './ComparisonView';
import { UploadZone } from './UploadZone';
import { TrashIcon, FolderOpenIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { convertFileSrc } from '@tauri-apps/api/core';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export const ImageStudio = ({ files, onDrop, onRemove, processedFiles, processing, onStart, options, setOptions }) => {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const activeFile = files[activeFileIndex];
  
  // Convert local paths to displayable URLs
  const originalSrc = activeFile ? convertFileSrc(activeFile.path) : null;
  const processedSrc = activeFile && processedFiles[activeFileIndex] ? convertFileSrc(processedFiles[activeFileIndex]) : null;

  const copyOutputPath = (path) => {
    navigator.clipboard.writeText(path);
    toast.success('Path copied to clipboard!');
  };

  return (
    <div className="flex h-full">
      
      {/* SIDEBAR TOOLS */}
      <div className="w-80 bg-panel border-r border-white/5 flex flex-col p-4 gap-6 z-10">
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

         {/* QUEUE LIST */}
         <div className="flex-1 flex flex-col min-h-0 bg-black/20 border border-white/5">
             <div className="p-2 border-b border-white/5 flex justify-between items-center bg-white/5">
                <span className="text-[10px] font-bold uppercase text-gray-400">Queue ({files.length})</span>
                {files.length > 0 && !processing && (
                  <button onClick={() => onRemove('all')} className="text-gray-600 hover:text-red-500"><TrashIcon className="w-3 h-3" /></button>
                )}
             </div>
             
             <div className="flex-1 overflow-y-auto p-1 space-y-1 custom-scrollbar">
                {files.map((f, i) => (
                   <div 
                      key={i} 
                      onClick={() => setActiveFileIndex(i)}
                      className={clsx(
                         "flex items-center gap-2 p-2 cursor-pointer text-xs border transition-colors",
                         i === activeFileIndex ? "bg-white/10 text-white border-white/10" : "text-gray-500 hover:text-gray-300 border-transparent",
                         processedFiles[i] ? "border-l-2 border-l-green-500" : ""
                      )}
                   >
                       {processedFiles[i] ? (
                         <CheckCircleIcon className="w-3 h-3 text-green-500 shrink-0" />
                       ) : (
                         <div className="w-3 h-3 rounded-full border border-gray-600 shrink-0" />
                       )}
                       <span className="truncate flex-1 font-mono">{f.name}</span>
                   </div>
                ))}
                
                <div className="p-2">
                   <UploadZone onDropFiles={onDrop} minimal />
                </div>
             </div>
         </div>

         {/* OUTPUT INFO */}
         {processedFiles[activeFileIndex] && (
           <div 
             onClick={() => copyOutputPath(processedFiles[activeFileIndex])}
             className="p-3 bg-green-500/10 border border-green-500/30 cursor-pointer hover:bg-green-500/20 transition-colors"
           >
             <div className="text-[10px] text-green-400 font-bold uppercase mb-1 flex items-center gap-1">
               <FolderOpenIcon className="w-3 h-3" /> Output Saved
             </div>
             <div className="text-[9px] text-green-300/70 font-mono truncate">
               {processedFiles[activeFileIndex]}
             </div>
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
