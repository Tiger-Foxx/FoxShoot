import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { motion } from "framer-motion";

const MockImage = ({ text }) => (
  <div className="w-full h-full flex flex-col items-center justify-center text-white/10">
    <div className="w-24 h-24 border border-dashed border-white/10 rounded-full mb-6 flex items-center justify-center animate-pulse-slow">
       <div className="w-12 h-12 bg-white/5 rounded-full" />
    </div>
    <span className="text-[10px] font-black uppercase tracking-[0.4em]">{text}</span>
  </div>
);

export const PreviewCard = ({ original, processed }) => {
  return (
    <div className="w-full h-full bg-black rounded-[2rem] border border-white/5 overflow-hidden relative shadow-2xl group">
      
      {/* Target Crosshair Decoration */}
      <div className="absolute top-8 left-8 w-4 h-4 border-t border-l border-white/20" />
      <div className="absolute top-8 right-8 w-4 h-4 border-t border-r border-white/20" />
      <div className="absolute bottom-8 left-8 w-4 h-4 border-b border-l border-white/20" />
      <div className="absolute bottom-8 right-8 w-4 h-4 border-b border-r border-white/20" />

      {!original ? (
        <MockImage text="Optical Standby" />
      ) : (
        <TransformWrapper centerOnInit={true}>
          <TransformComponent wrapperClass="!w-full !h-full cursor-crosshair">
             <motion.img 
               initial={{ opacity: 0, scale: 1.1 }}
               animate={{ opacity: 1, scale: 1 }}
               src={processed || original} 
               alt="Preview" 
               className="w-full h-full object-contain p-4"
             />
          </TransformComponent>
        </TransformWrapper>
      )}
      
      {/* LABELS */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 glass rounded-full flex items-center gap-3 border border-white/10 shadow-2xl">
         <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
         <span className="text-[9px] font-black uppercase tracking-widest text-white/80">
            {processed ? "Vision Enhanced" : "Input Signal"}
         </span>
      </div>

      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
         <div className="text-[9px] font-bold text-gray-500 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
            Drag to pan • Scroll to zoom
         </div>
         {processed && (
           <div className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full backdrop-blur-sm">
             Output: {processed.split('/').pop()}
           </div>
         )}
      </div>
    </div>
  );
};
