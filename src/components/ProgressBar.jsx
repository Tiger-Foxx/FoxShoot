import { motion } from 'framer-motion';
import { formatETA } from '../utils/formatETA';
import { useTranslation } from 'react-i18next';

export const ProgressBar = ({ percent, eta, status, isProcessing }) => {
  const { t } = useTranslation();
  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary block">
            {t('progress.core')}
          </span>
          <span className="text-sm font-bold text-white/90 truncate block max-w-[400px]">
            {status || t('progress.waiting_signal')}
          </span>
        </div>
        <div className="text-right">
           <span className="text-2xl font-black text-white tabular-nums">
             {Math.round(percent)}<span className="text-primary text-sm ml-0.5">%</span>
           </span>
        </div>
      </div>
      
      {/* High Tech Bar */}
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
        <motion.div
           className="h-full bg-primary glow-primary relative z-10"
           initial={{ width: 0 }}
           animate={{ width: `${percent}%` }}
           transition={{ duration: 0.5, ease: "easeOut" }}
        />
        {/* Animated pulse background */}
        {isProcessing && (
          <motion.div 
            className="absolute inset-0 bg-primary/20"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          />
        )}
      </div>

      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-600">
        <div className="flex items-center gap-2">
          {isProcessing ? (
             <span className="flex items-center gap-1.5 text-primary">
               <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
               {t('progress.active')}
             </span>
          ) : (
             <span>{t('progress.standby')}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
           <span>ETA: <span className="text-gray-400">{formatETA(eta)}</span></span>
        </div>
      </div>
    </div>
  );
};
