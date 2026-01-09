import { AdjustmentsHorizontalIcon, CpuChipIcon, BoltIcon, Square2StackIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export const OptionsPanel = ({ options, setOptions, disabled }) => {
  const handleChange = (key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="text-center">
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Engine Setup</h2>
        <p className="text-gray-500 text-sm">Fine-tune the upscaling neural network parameters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
        
        {/* SCALE FACTOR */}
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
            <Square2StackIcon className="w-4 h-4" /> Multiplier
          </label>
          <div className="grid grid-cols-3 gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
            {[2, 3, 4].map(s => (
              <button
                key={s}
                onClick={() => handleChange('scale', s)}
                disabled={disabled}
                className={clsx(
                  "py-3 rounded-xl text-sm font-bold transition-all",
                  options.scale === s 
                    ? "bg-primary text-white shadow-xl glow-primary" 
                    : "text-gray-500 hover:text-white"
                )}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* SPEED PRESET */}
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
            <BoltIcon className="w-4 h-4" /> Velocity
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['fast', 'medium', 'slow', 'ultrafast'].map(p => (
              <button
                key={p}
                onClick={() => handleChange('preset', p)}
                disabled={disabled}
                className={clsx(
                  "py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all",
                  options.preset === p 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-white/5 bg-white/5 text-gray-500 hover:border-white/20 hover:text-white"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* VRAM TILING */}
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
            <CpuChipIcon className="w-4 h-4" /> Memory Tiling
          </label>
          <select 
            value={options.tileSize}
            onChange={(e) => handleChange('tileSize', parseInt(e.target.value))}
            disabled={disabled}
            className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl p-4 focus:border-primary focus:outline-none appearance-none cursor-pointer hover:bg-white/10 transition-colors"
          >
            <option value={0} className="bg-background">Auto Control (Smart)</option>
            <option value={400} className="bg-background">400 (Heavy VRAM)</option>
            <option value={256} className="bg-background">256 (Balanced)</option>
            <option value={128} className="bg-background">128 (Safe Mode)</option>
          </select>
        </div>

        {/* ENCODING */}
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
            <AdjustmentsHorizontalIcon className="w-4 h-4" /> Output Format
          </label>
          <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 gap-2">
            {['mp4', 'mkv', 'webm'].map(f => (
              <button
                key={f}
                onClick={() => handleChange('format', f)}
                disabled={disabled}
                className={clsx(
                  "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  options.format === f 
                    ? "bg-white text-black font-bold" 
                    : "text-gray-500 hover:text-white"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

      </div>

      <div className="mt-6 flex justify-center">
         <label className="flex items-center gap-4 cursor-pointer group">
           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-4 py-2 border border-white/5 rounded-full group-hover:border-primary/30 transition-colors">Audio Handling</span>
           <div 
             onClick={() => !disabled && handleChange('noAudio', !options.noAudio)}
             className={clsx(
               "w-12 h-6 rounded-full p-1 transition-all duration-300",
               !options.noAudio ? "bg-primary" : "bg-white/10"
             )}
           >
             <div className={clsx(
               "w-4 h-4 bg-white rounded-full transition-transform duration-300",
               !options.noAudio ? "translate-x-6" : "translate-x-0"
             )} />
           </div>
           <span className={clsx("text-xs font-bold transition-colors", !options.noAudio ? "text-white" : "text-gray-600")}>
             {!options.noAudio ? "Preserve Streams" : "Discard Audio"}
           </span>
         </label>
      </div>
    </div>
  );
};
