import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon, FilmIcon, PhotoIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export const UploadZone = ({ onDropFiles }) => {
  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles?.length) {
      // Map to simpler objects
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 h-64",
        isDragActive 
          ? "border-primary bg-primary/10" 
          : "border-gray-700 hover:border-primary/50 hover:bg-surface/50"
      )}
    >
      <input {...getInputProps()} />
      <div className="bg-surface p-4 rounded-full mb-4">
        <CloudArrowUpIcon className={clsx("w-10 h-10", isDragActive ? "text-primary" : "text-gray-400")} />
      </div>
      <p className="text-lg font-medium text-gray-200">
        {isDragActive ? "Drop files here..." : "Drag & Drop files"}
      </p>
      <p className="text-sm text-gray-500 mt-2 text-center">
        Support Images (PNG, JPG, WEBP) & Anime Videos (MP4, MKV)<br/>
        <span className="flex items-center justify-center gap-2 mt-2">
          <PhotoIcon className="w-4 h-4" /> Batch Images
          <span className="text-gray-700">|</span>
          <FilmIcon className="w-4 h-4" /> Anime Episodes
        </span>
      </p>
    </motion.div>
  );
};
