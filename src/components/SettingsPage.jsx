import { useSettings } from '../contexts/SettingsContext';
import { open } from '@tauri-apps/plugin-dialog';
import { FolderOpenIcon, ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const SettingsPage = ({ onBack }) => {
  const { settings, updateSetting, resetSettings } = useSettings();

  const handleSelectOutputFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Output Folder'
      });
      if (selected) {
        updateSetting('outputFolder', selected);
        toast.success('Output folder updated!');
      }
    } catch (err) {
      console.error('Folder selection error:', err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full bg-black p-8 overflow-y-auto"
    >
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <button 
            onClick={onBack}
            className="p-2 border border-white/10 hover:border-white/30 hover:bg-white/5 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Settings</h1>
            <p className="text-xs text-gray-500 font-mono">Application Configuration</p>
          </div>
        </div>

        <div className="space-y-8">
          
          {/* OUTPUT FOLDER */}
          <SettingSection title="Output Folder" description="Where processed files will be saved.">
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1 bg-panel border border-white/10 p-3 font-mono text-sm text-gray-400 truncate">
                  {settings.outputFolder || '📁 Same as source file (default)'}
                </div>
                <button 
                  onClick={handleSelectOutputFolder}
                  className="px-4 py-3 bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-primary/10 transition-colors"
                  title="Choose folder"
                >
                  <FolderOpenIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    updateSetting('outputFolder', '');
                    toast.success('Output will be saved next to source file');
                  }}
                  className={`flex-1 py-2 text-xs font-bold border transition-colors ${
                    !settings.outputFolder 
                      ? 'bg-primary/20 text-primary border-primary/30' 
                      : 'border-white/10 text-gray-500 hover:border-white/30'
                  }`}
                >
                  Same as Source
                </button>
                <button 
                  onClick={handleSelectOutputFolder}
                  className={`flex-1 py-2 text-xs font-bold border transition-colors ${
                    settings.outputFolder 
                      ? 'bg-primary/20 text-primary border-primary/30' 
                      : 'border-white/10 text-gray-500 hover:border-white/30'
                  }`}
                >
                  Custom Folder
                </button>
              </div>
            </div>
          </SettingSection>

          {/* DEFAULT SCALE */}
          <SettingSection title="Default Scale Factor" description="Default upscale multiplier for new jobs.">
            <div className="flex gap-2">
              {[2, 3, 4].map(s => (
                <button
                  key={s}
                  onClick={() => updateSetting('defaultScale', s)}
                  className={`flex-1 py-3 text-sm font-bold border transition-colors ${
                    settings.defaultScale === s 
                      ? 'bg-primary text-black border-primary' 
                      : 'border-white/10 text-gray-400 hover:border-white/30'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </SettingSection>

          {/* AUTO OPEN OUTPUT */}
          <SettingSection title="Auto-Open Output" description="Automatically open the output folder after processing completes.">
            <button 
              onClick={() => updateSetting('autoOpenOutput', !settings.autoOpenOutput)}
              className={`w-14 h-7 rounded-full p-1 transition-colors ${
                settings.autoOpenOutput ? 'bg-primary' : 'bg-white/10'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                settings.autoOpenOutput ? 'translate-x-7' : 'translate-x-0'
              }`} />
            </button>
          </SettingSection>

          {/* DANGER ZONE */}
          <div className="pt-8 border-t border-white/10">
            <button 
              onClick={() => {
                resetSettings();
                toast.success('Settings reset to defaults');
              }}
              className="flex items-center gap-2 text-xs text-red-500/70 hover:text-red-500 transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              Reset All Settings
            </button>
          </div>

          {/* ABOUT */}
          <div className="pt-8 border-t border-white/10 text-center">
            <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">FoxShoot v3.0</p>
            <p className="text-[9px] text-gray-700 mt-1">Neural Image & Video Restoration</p>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

const SettingSection = ({ title, description, children }) => (
  <div className="space-y-3">
    <div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
    {children}
  </div>
);
