import { motion } from 'framer-motion';
import { formatETA } from '../utils/formatETA';
import { PlayIcon, StopIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { convertFileSrc } from '@tauri-apps/api/core';

export const VideoLab = ({ 
  file, 
  processedFile, 
  progress, 
  processing, 
  onStart, 
  onStop, 
  options, 
  setOptions 
}) => {
  return (
    <div className="flex h-full gap-6 p-6">
      
      {/* LEFT: MONITOR */}
      <div className="flex-1 flex flex-col gap-4">
        
        {/* VIEWPORT */}
        <div className="flex-1 bg-black border border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 flex items-center justify-center">
                {file ? (
                   <video 
                      src={convertFileSrc(file.path)} 
                      className="w-full h-full object-contain opacity-70 group-hover:opacity-100 transition-all duration-500" 
                      muted
                      loop
                      autoPlay
                      playsInline
                   />
                ) : (
                   <div className="text-gray-700 font-mono text-xs tracking-widest">NO SIGNAL INPUT</div>
                )}
            </div>
            
            {/* SCANLINE EFFECT (ONLY IF PROCESSING) */}
            {processing && (
              <div className="absolute inset-0 pointer-events-none">
                 <div className="w-full h-1 bg-primary/50 shadow-[0_0_20px_rgba(249,115,22,0.8)] absolute top-0 animate-[scan_2s_linear_infinite]" 
                      style={{ animationName: 'scan' }} />
                 <style>{`@keyframes scan { 0% { top: 0% } 100% { top: 100% } }`}</style>
              </div>
            )}

            {/* OVERLAYS */}
            <div className="absolute top-4 left-4 flex flex-col gap-1">
               <div className="text-[10px] bg-black/80 border border-white/20 text-primary px-2 py-0.5 font-bold font-mono">
                  {processing ? "● ENCODING" : "○ STANDBY"}
               </div>
               {file && <div className="text-[10px] text-gray-400 font-mono pl-1">{file.name}</div>}
            </div>
        </div>

        {/* TIMELINE / PROGRESS */}
        <div className="h-32 bg-panel border border-white/5 p-4 flex flex-col justify-between relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-10" 
                 style={{ backgroundImage: 'linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 100%' }} 
            />

            <div className="flex justify-between items-end relative z-10">
                <div>
                   <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Rendering Engine</div>
                   <div className="text-2xl font-mono text-white">{progress.percent.toFixed(1)}<span className="text-sm text-gray-600">%</span></div>
                </div>
                <div className="text-right">
                   <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Time Remaining</div>
                   <div className="text-xl font-mono text-primary">{formatETA(progress.eta)}</div>
                </div>
            </div>

            {/* Bar */}
            <div className="w-full h-2 bg-black border border-white/10 mt-2 relative">
                <motion.div 
                   className="h-full bg-primary relative"
                   initial={{ width: 0 }}
                   animate={{ width: `${progress.percent}%` }}
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white" /> {/* Playhead */}
                </motion.div>
            </div>
        </div>

      </div>

      {/* RIGHT: RACK (CONTROLS) */}
      <div className="w-80 flex flex-col gap-4">
         
         <div className="p-5 border border-white/10 bg-panel flex flex-col gap-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">Encoder Config</h3>
            
            <ControlGroup label="Model Algorithm">
               <select className="sharp-input w-full p-2 text-xs bg-black text-gray-300">
                  <option>Real-ESRGAN (Anime Video)</option>
                  <option>Real-ESRGAN (General)</option>
               </select>
            </ControlGroup>

            <ControlGroup label="Upscale Factor">
               <div className="grid grid-cols-3 gap-1">
                 {[2, 3, 4].map(s => (
                   <button 
                     key={s}
                     onClick={() => setOptions(p => ({...p, scale: s }))}
                     disabled={processing}
                     className={clsx(
                       "py-2 text-xs font-bold border border-white/10 hover:border-white/30 transition-colors",
                       options.scale === s ? "bg-primary text-black border-primary" : "bg-black text-gray-500"
                     )}
                   >
                     {s}x
                   </button>
                 ))}
               </div>
            </ControlGroup>

            <ControlGroup label="Export Format">
               <div className="flex gap-1">
                 {['mp4', 'mkv', 'webm'].map(f => (
                   <button 
                     key={f}
                     onClick={() => setOptions(p => ({...p, format: f }))}
                     disabled={processing}
                     className={clsx(
                       "flex-1 py-2 text-[10px] font-bold uppercase border border-white/10 hover:border-white/30",
                       options.format === f ? "bg-white text-black" : "bg-black text-gray-500"
                     )}
                   >
                     {f}
                   </button>
                 ))}
               </div>
            </ControlGroup>
            
            <ControlGroup label="Hardware Tiling (VRAM)">
               <select 
                 value={options.tileSize}
                 onChange={(e) => setOptions(p => ({...p, tileSize: parseInt(e.target.value) }))}
                 className="sharp-input w-full p-2 text-xs bg-black text-gray-300"
               >
                 <option value={0}>Auto (Smart)</option>
                 <option value={256}>256 (Safe)</option>
                 <option value={128}>128 (Low VRAM)</option>
               </select>
            </ControlGroup>

         </div>

         {/* ACTION BUTTON */}
         <div className="mt-auto">
            {processing ? (
               <button onClick={onStop} className="w-full py-4 bg-red-900/20 border border-red-500/50 text-red-500 font-bold uppercase tracking-widest text-xs hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2">
                 <StopIcon className="w-4 h-4" /> ABORT SEQUENCE
               </button>
            ) : (
               <button onClick={onStart} disabled={!file} className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest text-xs hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                 <PlayIcon className="w-4 h-4" /> INITIATE RENDER
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
