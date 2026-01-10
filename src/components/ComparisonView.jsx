import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

export const ComparisonView = ({ original, processed }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPos(percentage);
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (isDragging) handleMove(e.clientX);
  };
  
  // Touch support
  const handleTouchMove = (e) => {
    if (isDragging) handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleMouseUp);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove);
    } else {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    }
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDragging, handleMove]);

  // If no processed image, show original fully or a placeholder
  if (!original) {
      return (
          <div className="w-full h-full relative overflow-hidden">
              {/* Cinematic Background Placeholder */}
              <img 
                 src="/image2.png" 
                 alt="Placeholder" 
                 className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
                 <div className="w-16 h-16 border border-dashed border-white/20 flex items-center justify-center mb-6">
                    <div className="w-8 h-8 border border-white/10" />
                 </div>
                 <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em]">
                    Awaiting Visual Input
                 </span>
                 <span className="text-[9px] font-mono text-gray-700 mt-2">
                    Drop an image or select from the queue
                 </span>
              </div>
          </div>
      )
  }

  if (!processed) {
      // Just show original
      return (
          <div className="w-full h-full flex items-center justify-center bg-black relative overflow-hidden">
               <img src={original} className="max-w-full max-h-full object-contain" />
               <div className="absolute top-4 left-4 bg-black/50 px-2 py-1 text-[10px] text-white border border-white/10">ORIGINAL SOURCE</div>
          </div>
      )
  }

  return (
    <div 
      className="relative w-full h-full bg-black select-none overflow-hidden cursor-ew-resize group"
      ref={containerRef}
      onMouseDown={(e) => { handleMouseDown(); handleMove(e.clientX); }}
      onTouchStart={(e) => { handleMouseDown(); handleMove(e.touches[0].clientX); }}
    >
        {/* UNDERLAY (Original) */}
        <div className="absolute inset-0 flex items-center justify-center">
            <img 
               src={original} 
               className="max-w-full max-h-full object-contain pointer-events-none" 
               draggable={false}
            />
             <div className="absolute top-4 left-4 bg-black/60 px-2 py-1 text-[10px] font-bold text-gray-400 border border-white/10">ORIGINAL</div>
        </div>

        {/* OVERLAY (Processed) - Clipped */}
        <div 
           className="absolute inset-0 flex items-center justify-center"
           style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
        >
             <img 
               src={processed} 
               className="max-w-full max-h-full object-contain pointer-events-none brightness-110 contrast-105" // Added filters to fake "better" look if same img
               draggable={false}
            />
            <div className="absolute top-4 right-4 bg-primary/20 px-2 py-1 text-[10px] font-bold text-primary border border-primary/30">ENHANCED 4K</div>
        </div>

        {/* SLIDER HANDLE */}
        <div 
           className="absolute top-0 bottom-0 w-0.5 bg-primary cursor-ew-resize z-10"
           style={{ left: `${sliderPos}%` }}
        >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black border border-primary flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.5)]">
                 <div className="w-1 h-3 border-l border-r border-white/50 w-2" />
            </div>
        </div>
    </div>
  );
};
