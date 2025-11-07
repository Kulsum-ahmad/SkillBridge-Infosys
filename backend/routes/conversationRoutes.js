import express from "express";
import {
  getMyConversations,
  getOrCreateConversation,
  getConversationById,
  markMessagesAsRead,
} from "../controllers/conversationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// ✅ Get all conversations for logged-in user
router.get("/", getMyConversations);

// ✅ Get or create conversation
router.post("/", getOrCreateConversation);

// ✅ Get single conversation by ID
router.get("/:id", getConversationById);

// ✅ Mark messages as read
router.put("/:conversationId/read", markMessagesAsRead);

export default router;

