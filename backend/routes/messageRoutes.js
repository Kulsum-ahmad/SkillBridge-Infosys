import express from "express";
import {
  getMessagesByConversation,
  sendMessage,
  getUnreadCount,
} from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// ✅ Get unread message count
router.get("/unread", getUnreadCount);

// ✅ Get all messages for a conversation
router.get("/:conversationId", getMessagesByConversation);

// ✅ Send a message
router.post("/send", sendMessage);

export default router;

