import express from "express";
import {
  createOpportunity,
  getAllOpportunities,
  getOpportunityById,
  updateOpportunity,
  deleteOpportunity,
} from "../controllers/opportunity.controller.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * 🟢 Public Routes
 * Volunteers or guests can browse and view opportunities
 */
router.get("/", optionalAuth, getAllOpportunities);
router.get("/:id", optionalAuth, getOpportunityById);

/**
 * 🔒 Protected Routes (Only NGOs can modify opportunities)
 * Requires valid JWT from NGO account
 */
router.post("/", protect, createOpportunity);
router.put("/:id", protect, updateOpportunity);
router.delete("/:id", protect, deleteOpportunity);

export default router;
