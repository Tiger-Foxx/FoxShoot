import { TrashIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export const BatchList = ({ files, onRemove, currentFileIndex, processing }) => {
  const { t } = useTranslation();
  if (files.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-20">
       <div className="w-12 h-12 border border-dashed border-white rounded-full mb-4 flex items-center justify-center">
          <ClockIcon className="w-6 h-6" />
       </div>
       <p className="text-[10px] uppercase font-black tracking-widest">{t('batch.no_signals')}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
      <AnimatePresence initial={false}>
        {files.map((file, index) => {
          const isCurrent = processing && index === currentFileIndex;
          const isDone = index < currentFileIndex;
          
          return (
            <motion.div
              key={file.name + index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={clsx(
                "group flex flex-col p-4 rounded-2xl border transition-all duration-300",
                isCurrent 
                  ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/5" 
                  : "bg-white/3 border-white/5 hover:border-white/10"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {isCurrent && <ArrowPathIcon className="w-3 h-3 animate-spin text-primary" />}
                  {isDone && <CheckCircleIcon className="w-3 h-3 text-green-500" />}
                  {!isCurrent && !isDone && <div className="w-3 h-3 rounded-full border border-white/20" />}
                </div>

                <div className="flex-1 min-w-0">
                  <span className={clsx(
                    "text-[11px] font-bold block truncate",
                    isCurrent ? "text-white" : "text-gray-400"
                  )}>
                    {file.name}
                  </span>
                </div>

                {!processing && (
                  <button 
                    onClick={() => onRemove(index)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded-md text-gray-500 hover:text-red-400 transition-all"
                  >
                    <TrashIcon className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
