/**
 * Supported file extensions for Quality Shoot V2
 */
export const SUPPORTED_EXTENSIONS = {
  images: ['.png', '.jpg', '.jpeg', '.webp', '.bmp'],
  videos: ['.mp4', '.mkv', '.avi', '.webm', '.mov', '.flv', '.wmv']
};

/**
 * Check if file is supported
 */
export const isSupportedFile = (filename) => {
  const lower = filename.toLowerCase();
  return [...SUPPORTED_EXTENSIONS.images, ...SUPPORTED_EXTENSIONS.videos]
    .some(ext => lower.endsWith(ext));
};

/**
 * Get file type (image or video)
 */
export const getFileType = (filename) => {
  const lower = filename.toLowerCase();
  if (SUPPORTED_EXTENSIONS.videos.some(ext => lower.endsWith(ext))) return 'video';
  if (SUPPORTED_EXTENSIONS.images.some(ext => lower.endsWith(ext))) return 'image';
  return 'unknown';
};
