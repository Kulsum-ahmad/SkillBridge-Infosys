import express from "express";
import { getOnlineUsers } from "../controllers/onlineController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Require auth
router.use(protect);

router.get("/", getOnlineUsers);

export default router;
