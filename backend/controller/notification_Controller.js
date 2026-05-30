import user_models from "../models/user_models.js";
import notification_model from "../models/notification_model.js";

// Register/update FCM token
export const registerFcmToken = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ success: false, message: "FCM token is required" });
    }

    await user_models.findByIdAndUpdate(userId, { fcmToken });

    res.status(200).json({ success: true, message: "FCM token registered successfully" });
  } catch (error) {
    console.error("Error registering FCM token:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get all notifications (for admin polling)
export const getNotifications = async (req, res) => {
  try {
    const notifications = await notification_model.find()
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await notification_model.countDocuments({ isRead: false });

    res.status(200).json({ 
      success: true, 
      notifications, 
      unreadCount 
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Mark a single notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await notification_model.findByIdAndUpdate(
      id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    await notification_model.updateMany(
      { isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Delete notifications that were read more than 7 days ago
export const cleanupOldNotifications = async () => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await notification_model.deleteMany({
      isRead: true,
      readAt: { $lt: sevenDaysAgo }
    });
    if (result.deletedCount > 0) {
      console.log(`Cleaned up ${result.deletedCount} old read notifications`);
    }
  } catch (error) {
    console.error("Error cleaning up notifications:", error);
  }
};
