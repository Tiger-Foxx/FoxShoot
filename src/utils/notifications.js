import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import i18n from '../i18n/config.js';

/**
 * Send a Windows notification when file processing completes
 * @param {string} fileName - Name of the processed file
 * @param {string} type - 'image' or 'video'
 */
export async function notifyFileComplete(fileName, type) {
  // Check permission
  let permissionGranted = await isPermissionGranted();

  // Request if not granted
  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === 'granted';
  }

  // Send notification if permitted
  if (permissionGranted) {
    const titleKey = type === 'image' ? 'notifications.image_ready_title' : 'notifications.video_ready_title';
    const title = i18n.t(titleKey);
    const body = i18n.t('notifications.file_ready_body', { fileName });
    
    sendNotification({ title, body });
  }
}

/**
 * Send notification when batch processing completes
 * @param {number} count - Number of files processed
 * @param {string} type - 'image' or 'video'  
 */
export async function notifyBatchComplete(count, type) {
  let permissionGranted = await isPermissionGranted();

  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === 'granted';
  }

  if (permissionGranted) {
    const title = i18n.t('notifications.batch_complete_title');
    const body = i18n.t('notifications.batch_complete_body', { count, type });
    
    sendNotification({ title, body });
  }
}
