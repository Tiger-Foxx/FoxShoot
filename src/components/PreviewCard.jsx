import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const MockImage = ({ text }) => (
  <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-600 font-mono text-xs">
    {text}
  </div>
);

export const PreviewCard = ({ original, processed }) => {
  // Simplification: In a real app we'd load the file blobs.
  // For Phase 2 implementation where backend runs detached in python, 
  // accessing "processed" file path requires fs read permission.
  // We'll placeholder the image logic for now or rely on user selecting valid images.
  
  return (
    <div className="bg-black/50 rounded-lg overflow-hidden border border-gray-800 h-64 relative group">
      {!original ? (
        <MockImage text="No Preview Available" />
      ) : (
        <TransformWrapper>
          <TransformComponent wrapperClass="!w-full !h-full">
            {/* Split view logic would go here (e.g. react-compare-slider) */}
            {/* For now, show original or processed if available */}
             <img 
               src={processed || original} 
               alt="Preview" 
               className="w-full h-full object-contain"
             />
          </TransformComponent>
        </TransformWrapper>
      )}
      
      <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-[10px] text-white backdrop-blur-md">
        {processed ? "PROCESSED PREVIEW" : "ORIGINAL"}
      </div>
    </div>
  );
};
