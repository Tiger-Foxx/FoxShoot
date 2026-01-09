import { TrashIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export const BatchList = ({ files, onRemove, currentFileIndex, processing }) => {
  if (files.length === 0) return null;

  return (
    <div className="bg-surface rounded-lg border border-gray-800 flex flex-col h-full max-h-[400px]">
      <div className="p-3 border-b border-gray-800 bg-surface/50 sticky top-0 backdrop-blur-sm z-10 flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-300">Queue ({files.length})</h3>
        {files.length > 0 && !processing && (
          <button onClick={() => onRemove('all')} className="text-xs text-red-400 hover:text-red-300">
            Clear All
          </button>
        )}
      </div>
      
      <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar flex-1">
        <AnimatePresence initial={false}>
          {files.map((file, index) => {
            const isCurrent = processing && index === currentFileIndex;
            const isDone = index < currentFileIndex;
            const isPending = index > currentFileIndex;
            
            return (
              <motion.div
                key={file.name + index} // Use unique ID in real app
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={clsx(
                  "flex items-center gap-3 p-2 rounded-md text-sm transition-colors border",
                  isCurrent 
                    ? "bg-primary/10 border-primary/30 text-white" 
                    : "bg-background border-transparent text-gray-400 hover:bg-gray-800"
                )}
              >
                {/* Status Icon */}
                <div className="shrink-0">
                  {isCurrent && <ArrowPathIcon className="w-4 h-4 animate-spin text-primary" />}
                  {isDone && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                  {isPending && !processing && <ClockIcon className="w-4 h-4 text-gray-600" />}
                  {isPending && processing && <ClockIcon className="w-4 h-4 text-gray-600" />}
                </div>

                <div className="flex-1 truncate">
                  <span className="truncate block">{file.name}</span>
                  {isCurrent && <span className="text-[10px] text-primary/80 uppercase font-bold">Processing</span>}
                </div>

                {!processing && (
                  <button 
                    onClick={() => onRemove(index)}
                    className="p-1 hover:bg-red-500/20 rounded text-gray-600 hover:text-red-400"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
