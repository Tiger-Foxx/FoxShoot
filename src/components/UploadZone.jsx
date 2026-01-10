import React, { useCallback } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { PlusIcon, CloudArrowUpIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export const UploadZone = ({ onDropFiles, minimal = false }) => {
  
  const handleOpenDialog = useCallback(async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          { name: 'Media', extensions: ['png', 'jpg', 'jpeg', 'webp', 'mp4', 'mkv', 'avi', 'mov', 'webm'] }
        ]
      });
      
      if (selected) {
        // selected is an array of file paths (strings) or a single path
        const paths = Array.isArray(selected) ? selected : [selected];
        
        const mapped = paths.map(p => ({
          file: null,
          path: p,
          name: p.split(/[/\\]/).pop(), // Get filename from path
          preview: null // We can't create object URLs for local paths easily, will handle in preview component
        }));
        
        onDropFiles(mapped);
      }
    } catch (err) {
      console.error('Dialog error:', err);
    }
  }, [onDropFiles]);

  if (minimal) {
    return (
      <button 
        onClick={handleOpenDialog}
        className={clsx(
          "h-12 w-full border border-dashed border-white/20 hover:border-primary/50 flex items-center justify-center cursor-pointer transition-colors bg-white/5 hover:bg-white/10 text-gray-500 hover:text-primary"
        )}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
           <PlusIcon className="w-3 h-3" /> Add Files
        </span>
      </button>
    )
  }

  return (
    <motion.button
      onClick={handleOpenDialog}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={clsx(
        "group h-40 w-full rounded-sm border border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden bg-black",
        "border-white/10 hover:border-white/30 hover:bg-white/5"
      )}
    >
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="p-3 bg-panel rounded-full border border-white/10 group-hover:border-primary/50 transition-colors shadow-2xl">
           <FolderOpenIcon className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
        </div>
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-white group-hover:text-primary transition-colors">
            Select Source Files
          </p>
          <p className="text-[10px] text-gray-600 font-mono mt-1">
            PNG, JPG, MP4, MKV, AVI, WEBM
          </p>
        </div>
      </div>
    </motion.button>
  );
};
