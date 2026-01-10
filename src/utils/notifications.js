/**
 * Request notification permission if not already granted
 */
export async function ensureNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

/**
 * Send a Windows notification using Web Notification API
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {string} [icon] - Optional icon path
 */
export async function sendNotification(title, body, icon = '/icon.png') {
  const hasPermission = await ensureNotificationPermission();
  
  if (hasPermission) {
    try {
      const notification = new Notification(title, {
        body,
        icon,
        badge: icon,
        tag: 'foxshoot-processing', // Prevents duplicate notifications
        requireInteraction: false, // Auto-dismiss after a few seconds
      });

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      // Optional: Handle click to focus app
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return null;
    }
  }
  
  return null;
}

/**
 * Notify when a single file processing is complete
 * @param {string} fileName - Name of the processed file
 * @param {string} type - 'image' or 'video'
 */
export async function notifyFileComplete(fileName, type) {
  const emoji = type === 'image' ? '🖼️' : '🎬';
  const title = `${emoji} Ready!`;
  const body = `${fileName} has been enhanced successfully.`;
  await sendNotification(title, body);
}

/**
 * Notify when batch processing is complete
 * @param {number} count - Number of files processed
 * @param {string} type - 'image' or 'video'
 */
export async function notifyBatchComplete(count, type) {
  const emoji = type === 'image' ? '🖼️' : '🎬';
  const title = `${emoji} Batch Complete!`;
  const body = `All ${count} ${type}${count > 1 ? 's' : ''} enhanced successfully.`;
  await sendNotification(title, body);
}
