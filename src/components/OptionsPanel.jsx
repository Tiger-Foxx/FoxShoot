import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export const OptionsPanel = ({ options, setOptions, disabled }) => {
  const handleChange = (key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-surface rounded-lg p-4 border border-gray-800">
      <div className="flex items-center gap-2 mb-4 text-gray-300 border-b border-gray-800 pb-2">
        <AdjustmentsHorizontalIcon className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-sm uppercase tracking-wider">Engine Config</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scale */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium ml-1">Scale Factor</label>
          <div className="flex bg-background rounded-md p-1 border border-gray-700">
            {[2, 3, 4].map(s => (
              <button
                key={s}
                onClick={() => handleChange('scale', s)}
                disabled={disabled}
                className={clsx(
                  "flex-1 text-sm py-1 rounded transition-colors",
                  options.scale === s 
                    ? "bg-primary text-white font-medium shadow-sm" 
                    : "text-gray-400 hover:text-white"
                )}
              >
                x{s}
              </button>
            ))}
          </div>
        </div>

        {/* Quality */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium ml-1">Video Quality</label>
          <select 
            value={options.quality}
            onChange={(e) => handleChange('quality', e.target.value)}
            disabled={disabled}
            className="bg-background border border-gray-700 text-gray-300 text-sm rounded-md p-1.5 focus:border-primary focus:outline-none"
          >
            <option value="low">Low (Fast)</option>
            <option value="medium">Medium (Balanced)</option>
            <option value="high">High (Best)</option>
          </select>
        </div>

        {/* Format */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium ml-1">Output Format</label>
          <select 
            value={options.format}
            onChange={(e) => handleChange('format', e.target.value)}
            disabled={disabled}
            className="bg-background border border-gray-700 text-gray-300 text-sm rounded-md p-1.5 focus:border-primary focus:outline-none"
          >
            <option value="mp4">MP4 (H.264)</option>
            <option value="mkv">MKV</option>
            <option value="webm">WebM</option>
          </select>
        </div>

        {/* Speed Preset (Backend Option) */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium ml-1">Encoding Speed</label>
          <select 
            value={options.preset}
            onChange={(e) => handleChange('preset', e.target.value)}
            disabled={disabled}
            className="bg-background border border-gray-700 text-gray-300 text-sm rounded-md p-1.5 focus:border-primary focus:outline-none"
          >
            <option value="medium">Medium (Def)</option>
            <option value="fast">Fast</option>
            <option value="ultrafast">Ultrafast (Low Comp)</option>
            <option value="slow">Slow (Best Comp)</option>
          </select>
        </div>

        {/* Tile Size (Backend Option for Low VRAM) */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium ml-1">VRAM Tiling</label>
          <select 
            value={options.tileSize}
            onChange={(e) => handleChange('tileSize', parseInt(e.target.value))}
            disabled={disabled}
            className="bg-background border border-gray-700 text-gray-300 text-sm rounded-md p-1.5 focus:border-primary focus:outline-none"
          >
            <option value={0}>Auto (Default)</option>
            <option value={400}>400 (6GB+ VRAM)</option>
            <option value={256}>256 (4GB VRAM)</option>
            <option value={128}>128 (2GB VRAM)</option>
          </select>
        </div>
        
         {/* Audio */}
         <div className="flex items-center gap-2 mt-5">
           <input 
             type="checkbox"
             id="audio"
             checked={!options.noAudio} 
             onChange={(e) => handleChange('noAudio', !e.target.checked)}
             disabled={disabled}
             className="w-4 h-4 rounded border-gray-700 bg-background text-primary focus:ring-primary focus:ring-1"
           />
           <label htmlFor="audio" className="text-sm text-gray-300 cursor-pointer select-none">Keep Audio</label>
         </div>
      </div>
    </div>
  );
};
