import Notification from "../models/Notification.js";
import User from "../models/User.js";

/* ========================================================
   ✅ 1. Get all notifications for logged-in user
======================================================== */
export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`📬 [GET /api/notifications] Fetching notifications for user: ${userId}`);

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to 50 most recent

    console.log(`✅ Found ${notifications.length} notifications for user ${userId}`);

    // Format notifications with relative time
    const formattedNotifications = notifications.map((notif) => {
      // Handle metadata conversion (Map to Object)
      let metadata = {};
      if (notif.metadata) {
        if (notif.metadata instanceof Map) {
          metadata = Object.fromEntries(notif.metadata);
        } else if (typeof notif.metadata === 'object') {
          metadata = notif.metadata;
        }
      }

      return {
        _id: notif._id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        read: notif.read || false,
        readAt: notif.readAt,
        createdAt: notif.createdAt,
        updatedAt: notif.updatedAt,
        relatedEntity: notif.relatedEntity || null,
        metadata: metadata,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedNotifications,
    });
  } catch (error) {
    console.error("❌ Get Notifications Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching notifications",
      error: error.message,
    });
  }
};

/* ========================================================
   ✅ 2. Get unread notification count
======================================================== */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await Notification.countDocuments({
      user: userId,
      read: false,
    });

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("❌ Get Unread Count Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching unread count",
      error: error.message,
    });
  }
};

/* ========================================================
   ✅ 3. Mark notification as read
======================================================== */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: id,
      user: userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Only update if not already read
    if (!notification.read) {
      notification.read = true;
      notification.readAt = new Date();
      await notification.save();
    }

    // Format notification for response
    let metadata = {};
    if (notification.metadata) {
      if (notification.metadata instanceof Map) {
        metadata = Object.fromEntries(notification.metadata);
      } else if (typeof notification.metadata === 'object') {
        metadata = notification.metadata;
      }
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
        relatedEntity: notification.relatedEntity,
        metadata: metadata,
      },
    });
  } catch (error) {
    console.error("❌ Mark As Read Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while marking notification as read",
      error: error.message,
    });
  }
};

/* ========================================================
   ✅ 4. Mark all notifications as read
======================================================== */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { user: userId, read: false },
      { read: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("❌ Mark All As Read Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while marking all notifications as read",
      error: error.message,
    });
  }
};

/* ========================================================
   ✅ 5. Delete notification
======================================================== */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("❌ Delete Notification Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting notification",
      error: error.message,
    });
  }
};

/* ========================================================
   ✅ 6. Delete all notifications
======================================================== */
export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.deleteMany({ user: userId });

    res.status(200).json({
      success: true,
      message: "All notifications deleted",
    });
  } catch (error) {
    console.error("❌ Delete All Notifications Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting all notifications",
      error: error.message,
    });
  }
};

/* ========================================================
   ✅ 7. Create notification (helper function for use in other controllers)
======================================================== */
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  relatedEntity = null,
  metadata = {},
}) => {
  try {
    // Ensure userId is a string/ObjectId
    if (!userId) {
      console.error("❌ Cannot create notification: userId is required");
      return null;
    }

    const notification = new Notification({
      user: userId,
      type,
      title,
      message,
      relatedEntity,
      metadata: metadata && Object.keys(metadata).length > 0 
        ? new Map(Object.entries(metadata))
        : new Map(),
    });

    await notification.save();
    console.log(`✅ Notification created: ${type} for user ${userId}`);
    return notification;
  } catch (error) {
    console.error("❌ Create Notification Error:", error);
    return null;
  }
};

