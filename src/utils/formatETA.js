/**
 * Format seconds into readable ETA (e.g. "1m 30s", "45s")
 */
export const formatETA = (seconds) => {
  if (!seconds || seconds < 0) return "--";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  
  if (mins > 60) {
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    return `${hours}h ${m}m`;
  }
  
  return `${mins}m ${secs}s`;
};
