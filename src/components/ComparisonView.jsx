import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const ComparisonView = ({ original, processed }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useTranslation();

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

  // No image at all - placeholder
  if (!original) {
      return (
          <div className="w-full h-full relative overflow-hidden">
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
                    {t('comparison.awaiting_input')}
                 </span>
              </div>
          </div>
      )
  }

  // Only original, not yet processed
  if (!processed) {
      return (
          <div className="w-full h-full bg-black relative overflow-hidden">
               <img src={original} className="absolute inset-0 w-full h-full object-contain" />
               <div className="absolute top-4 left-4 bg-black/70 px-2 py-1 text-[10px] font-bold text-white border border-white/20 z-10">
                 {t('comparison.source')}
               </div>
          </div>
      )
  }

  // COMPARISON MODE - Both images MUST have identical visual size
  // Key: Both images are absolutely positioned with w-full h-full object-contain
  // This ensures they occupy the exact same rendered space regardless of source resolution

  return (
    <div 
      className="relative w-full h-full bg-black select-none overflow-hidden cursor-ew-resize"
      ref={containerRef}
      onMouseDown={(e) => { handleMouseDown(); handleMove(e.clientX); }}
      onTouchStart={(e) => { handleMouseDown(); handleMove(e.touches[0].clientX); }}
    >
        {/* ORIGINAL IMAGE - Full container, visible left of slider */}
        <div 
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          <img 
            src={original} 
            className="w-full h-full object-contain pointer-events-none" 
            draggable={false}
          />
        </div>

        {/* ENHANCED IMAGE - Full container, visible right of slider */}
        <div 
          className="absolute inset-0"
          style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
        >
          <img 
            src={processed} 
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        </div>

        {/* LABELS */}
        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold text-gray-300 border border-white/10 z-20 uppercase tracking-wider">
          {t('common.original')}
        </div>
        <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold text-black border border-primary z-20 uppercase tracking-wider">
          {t('common.enhanced')}
        </div>

        {/* SLIDER HANDLE */}
        <div 
           className="absolute top-0 bottom-0 w-0.5 bg-primary z-30 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
           style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
        >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black border-2 border-primary flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.6)]">
                 <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18m-4 4l4-4m0 0l-4-4" />
                 </svg>
            </div>
        </div>
    </div>
  );
};
