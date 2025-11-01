import express from "express";
import {
  createApplication,
  getMyApplications,
  getApplicationsByOpportunity,
  getApplicationsByUserId,
  updateApplicationStatus,
  deleteApplication,
  getApplicationsForMyNGO, // ✅ Added NGO-specific route (if needed)
} from "../controllers/applicationController.js";

import { protect } from "../middleware/authMiddleware.js";
import { uploadResume } from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* ========================================================
   📝 Volunteer Application Routes
======================================================== */

// ✅ 1. Create a new application (Volunteer applies)
router.post("/", protect, uploadResume, createApplication);

// ✅ 2. Fetch logged-in volunteer’s applications
router.get("/my", protect, getMyApplications);

// ✅ 3. Fetch all applications for a specific opportunity (NGO/Admin)
router.get("/opportunity/:opportunityId", protect, getApplicationsByOpportunity);

// ✅ 4. Fetch all applications by a specific user (Admin/Profile view)
router.get("/user/:userId", protect, getApplicationsByUserId);

// ✅ 5. Fetch all applications for opportunities created by logged-in NGO
router.get("/ngo/all", protect, getApplicationsForMyNGO);

// ✅ 6. Update application status (accept/reject/pending)
router.put("/:id/status", protect, updateApplicationStatus);

// ✅ 7. Delete an application (Admin/NGO/User withdraw)
router.delete("/:id", protect, deleteApplication);

export default router;
