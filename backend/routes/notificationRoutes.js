import express from "express";
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// ✅ Get all notifications for logged-in user
router.get("/", getMyNotifications);

// ✅ Get unread notification count
router.get("/unread-count", getUnreadCount);

// ✅ Mark notification as read (support both PUT and PATCH)
router.put("/:id/read", markAsRead);
router.patch("/:id/read", markAsRead);

// ✅ Mark all notifications as read
router.patch("/read-all", markAllAsRead);

// ✅ Delete notification
router.delete("/:id", deleteNotification);

// ✅ Delete all notifications
router.delete("/", deleteAllNotifications);

export default router;

