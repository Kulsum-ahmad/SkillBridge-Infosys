import express from "express";
import {
  createOpportunity,
  getAllOpportunities,
  getOpportunityById,
  updateOpportunity,
  deleteOpportunity,
} from "../controllers/opportunity.controller.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";

// 1. Correctly import the AI controller using ES Module syntax. 
// Don't forget the .js extension!
import { getAIRecommendations } from "../controllers/aiController.js"; 

const router = express.Router();

router.get("/", optionalAuth, getAllOpportunities);
router.get("/:id", optionalAuth, getOpportunityById);

router.post("/", protect, createOpportunity);
router.put("/:id", protect, updateOpportunity);
router.delete("/:id", protect, deleteOpportunity);

// 2. Use your existing 'protect' middleware instead of trying to require a new one
router.get("/recommendations", protect, getAIRecommendations);

// 3. Keep ONLY the ES Module export (removed module.exports)
export default router;