import React, { useCallback, useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { listen } from '@tauri-apps/api/event';
import { PlusIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export const UploadZone = ({ onDropFiles, minimal = false }) => {
  const [isDragging, setIsDragging] = useState(false);

  // Listen for native Tauri drag & drop events
  useEffect(() => {
    let unlisten;
    
    const setupListener = async () => {
      // Listen for file drop events from Tauri
      unlisten = await listen('tauri://file-drop', (event) => {
        const paths = event.payload;
        if (paths && paths.length > 0) {
          const mapped = paths.map(p => ({
            file: null,
            path: p,
            name: p.split(/[/\\]/).pop(),
            preview: null
          }));
          onDropFiles(mapped);
        }
        setIsDragging(false);
      });
    };
    
    setupListener();
    
    return () => {
      if (unlisten) unlisten();
    };
  }, [onDropFiles]);

  // Listen for drag hover events
  useEffect(() => {
    let unlistenHover, unlistenCancel;
    
    const setup = async () => {
      unlistenHover = await listen('tauri://file-drop-hover', () => {
        setIsDragging(true);
      });
      unlistenCancel = await listen('tauri://file-drop-cancelled', () => {
        setIsDragging(false);
      });
    };
    
    setup();
    
    return () => {
      if (unlistenHover) unlistenHover();
      if (unlistenCancel) unlistenCancel();
    };
  }, []);
  
  const handleOpenDialog = useCallback(async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          { name: 'Media', extensions: ['png', 'jpg', 'jpeg', 'webp', 'mp4', 'mkv', 'avi', 'mov', 'webm'] }
        ]
      });
      
      if (selected) {
        const paths = Array.isArray(selected) ? selected : [selected];
        
        const mapped = paths.map(p => ({
          file: null,
          path: p,
          name: p.split(/[/\\]/).pop(),
          preview: null
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
          "h-12 w-full border border-dashed flex items-center justify-center cursor-pointer transition-colors",
          isDragging 
            ? "border-primary bg-primary/10 text-primary" 
            : "border-white/20 hover:border-primary/50 bg-white/5 hover:bg-white/10 text-gray-500 hover:text-primary"
        )}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
           <PlusIcon className="w-3 h-3" /> {isDragging ? 'Drop here!' : 'Add Files'}
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
        "group h-40 w-full rounded-sm border border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden",
        isDragging 
          ? "border-primary bg-primary/10" 
          : "border-white/10 hover:border-white/30 hover:bg-white/5 bg-black"
      )}
    >
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className={clsx(
          "p-3 rounded-full border transition-colors shadow-2xl",
          isDragging 
            ? "bg-primary/20 border-primary" 
            : "bg-panel border-white/10 group-hover:border-primary/50"
        )}>
           <FolderOpenIcon className={clsx(
             "w-6 h-6 transition-colors",
             isDragging ? "text-primary" : "text-gray-400 group-hover:text-primary"
           )} />
        </div>
        <div className="text-center">
          <p className={clsx(
            "text-xs font-bold uppercase tracking-widest transition-colors",
            isDragging ? "text-primary" : "text-white group-hover:text-primary"
          )}>
            {isDragging ? 'Drop Files Here!' : 'Select or Drop Files'}
          </p>
          <p className="text-[10px] text-gray-600 font-mono mt-1">
            PNG, JPG, MP4, MKV, AVI, WEBM
          </p>
        </div>
      </div>
    </motion.button>
  );
};
