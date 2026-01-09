import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PlusIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export const UploadZone = ({ onDropFiles }) => {
  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles?.length) {
      const mapped = acceptedFiles.map(f => ({
        file: f,
        path: f.path || f.name, 
        name: f.name,
        preview: URL.createObjectURL(f)
      }));
      onDropFiles(mapped);
    }
  }, [onDropFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <motion.div
      {...getRootProps()}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        "group h-32 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden",
        isDragActive 
          ? "border-primary bg-primary/5" 
          : "border-white/10 hover:border-primary/40 hover:bg-white/5 shadow-inner"
      )}
    >
      <input {...getInputProps()} />
      
      {/* Background Glow */}
      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-500" />
      
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="p-2 bg-white/5 rounded-full border border-white/10 group-hover:border-primary/50 transition-colors">
           <PlusIcon className={clsx("w-5 h-5", isDragActive ? "text-primary" : "text-gray-500")} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-primary transition-colors">
          Inject Media
        </p>
      </div>
    </motion.div>
  );
};
