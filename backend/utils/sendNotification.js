import user_models from '../models/user_models.js';
import notification_model from '../models/notification_model.js';
import { cleanupOldNotifications } from '../controller/notification_Controller.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Notify admins via:
 * 1. Save to notifications DB (for admin panel polling)
 * 2. Expo Push API (for remote push notifications on device)
 */
export const notifyAdmins = async (title, body, data = {}) => {
  // 1. Save notification to database
  try {
    await notification_model.create({
      title,
      body,
      type: data.type || 'general',
      referenceId: data.driverId || data.reportId || '',
    });
    console.log(`Notification saved to DB: "${title}"`);
  } catch (error) {
    console.error('Error saving notification to DB:', error.message);
  }

  // 2. Expo Push API — sends push notification to admin devices
  try {
    const admins = await user_models.find({
      role: 'admin',
      fcmToken: { $exists: true, $ne: '' }
    }).select('fcmToken');

    const tokens = admins.map(a => a.fcmToken).filter(Boolean);

    if (tokens.length > 0) {
      const messages = tokens.map(token => ({
        to: token,
        sound: 'default',
        title,
        body,
        data,
      }));

      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      console.log(`Push sent to ${tokens.length} admin(s)`);

      if (result.data) {
        const failedTokens = [];
        result.data.forEach((ticket, idx) => {
          if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
            failedTokens.push(tokens[idx]);
          }
        });
        if (failedTokens.length > 0) {
          await user_models.updateMany(
            { fcmToken: { $in: failedTokens } },
            { $set: { fcmToken: '' } }
          );
        }
      }
    } else {
      console.log('No admin push tokens registered — push skipped');
    }
  } catch (error) {
    console.log('Push notification error:', error.message);
  }

  // 3. Periodic cleanup of old read notifications
  cleanupOldNotifications();
};
