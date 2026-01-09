import { motion } from 'framer-motion';
import { formatETA } from '../utils/formatETA';

export const ProgressBar = ({ percent, eta, status, isProcessing }) => {
  return (
    <div className="w-full bg-surface rounded-lg p-4 border border-gray-800 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-300 truncate max-w-[70%]">
          {status || "Idle"}
        </span>
        <span className="text-sm font-mono text-primary">
          {Math.round(percent)}%
        </span>
      </div>
      
      {/* Bar container */}
      <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
        <motion.div
           className="h-full bg-primary"
           initial={{ width: 0 }}
           animate={{ width: `${percent}%` }}
           transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
        <span>
          {isProcessing ? "Processing..." : "Ready"}
        </span>
        <span>
           ETA: {formatETA(eta)}
        </span>
      </div>
    </div>
  );
};
