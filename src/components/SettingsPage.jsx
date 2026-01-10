import { useSettings } from '../contexts/SettingsContext';
import { open } from '@tauri-apps/plugin-dialog';
import { FolderOpenIcon, ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import { useTranslation } from 'react-i18next';

export const SettingsPage = ({ onBack }) => {
  const { settings, updateSetting, resetSettings } = useSettings();
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    toast.success(lng === 'fr' ? 'Langue changée : Français' : 'Language changed: English');
  };

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
            <h1 className="text-2xl font-black uppercase tracking-tight">{t('settings.title')}</h1>
            <p className="text-xs text-gray-500 font-mono">{t('settings.subtitle')}</p>
          </div>
        </div>

        <div className="space-y-8">

          {/* LANGUAGE SELECTION */}
          <SettingSection title={t('settings.language')} description={t('settings.language_desc')}>
             <div className="flex gap-2">
                <button 
                  onClick={() => changeLanguage('en')}
                  className={`flex-1 py-3 text-xs font-bold border transition-colors ${
                    i18n.language && i18n.language.startsWith('en') 
                      ? 'bg-primary/20 text-primary border-primary/30' 
                      : 'border-white/10 text-gray-500 hover:border-white/30'
                  }`}
                >
                  ENGLISH
                </button>
                <button 
                  onClick={() => changeLanguage('fr')}
                  className={`flex-1 py-3 text-xs font-bold border transition-colors ${
                    i18n.language && i18n.language.startsWith('fr') 
                      ? 'bg-primary/20 text-primary border-primary/30' 
                      : 'border-white/10 text-gray-500 hover:border-white/30'
                  }`}
                >
                  FRANÇAIS
                </button>
             </div>
          </SettingSection>

          {/* OUTPUT FOLDER */}
          <SettingSection title={t('settings.output_folder')} description={t('settings.output_folder_desc')}>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1 bg-panel border border-white/10 p-3 font-mono text-sm text-gray-400 truncate">
                  {settings.outputFolder || `📁 ${t('settings.same_as_source')} (default)`}
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
                    toast.success(t('common.output_saved'));
                  }}
                  className={`flex-1 py-2 text-xs font-bold border transition-colors ${
                    !settings.outputFolder 
                      ? 'bg-primary/20 text-primary border-primary/30' 
                      : 'border-white/10 text-gray-500 hover:border-white/30'
                  }`}
                >
                  {t('settings.same_as_source')}
                </button>
                <button 
                  onClick={handleSelectOutputFolder}
                  className={`flex-1 py-2 text-xs font-bold border transition-colors ${
                    settings.outputFolder 
                      ? 'bg-primary/20 text-primary border-primary/30' 
                      : 'border-white/10 text-gray-500 hover:border-white/30'
                  }`}
                >
                  {t('settings.custom_folder')}
                </button>
              </div>
            </div>
          </SettingSection>

          {/* DEFAULT SCALE */}
          <SettingSection title={t('settings.default_scale')} description={t('settings.default_scale_desc')}>
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
          <SettingSection title={t('settings.auto_open')} description={t('settings.auto_open_desc')}>
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
                toast.success(t('settings.reset_success'));
              }}
              className="flex items-center gap-2 text-xs text-red-500/70 hover:text-red-500 transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              {t('settings.reset_all')}
            </button>
          </div>

          {/* ABOUT */}
          <div className="pt-8 border-t border-white/10 text-center space-y-3">
            <div>
              <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">{t('landing.title')} v3.0</p>
              <p className="text-[9px] text-gray-700 mt-1">{t('landing.subtitle')}</p>
            </div>
            <a 
              href="https://github.com/Tiger-Foxx" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[10px] text-gray-600 hover:text-primary transition-colors font-mono"
            >
              <span>🦊</span>
              <span>made by <span className="text-primary font-bold">Fox</span></span>
              <span className="text-gray-700">• github.com/Tiger-Foxx</span>
            </a>
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
