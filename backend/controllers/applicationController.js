import Application from "../models/Application.js";
import Opportunity from "../models/opportunity.model.js";
import User from "../models/User.js";
import path from "path";
import mongoose from "mongoose";

/* ========================================================
   ✅ 1. Create new application (Volunteer applies)
======================================================== */
export const createApplication = async (req, res) => {
  try {
    const { opportunityId, motivation } = req.body;
    const userId = req.user._id;

    // 🧠 Validate user existence
    const user = await User.findById(userId).select("fullName email");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ Validate opportunity
    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: "Opportunity not found" });
    }

    // 🚫 Prevent duplicate application
    const alreadyApplied = await Application.findOne({
      opportunity: opportunityId,
      user: userId,
    });
    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this opportunity!",
      });
    }

    // 📂 Handle resume file (from multer) - FIXED
    let resumePath = null;
    if (req.file) {
      // ✅ Use req.file.filename instead of path.basename(req.file.path)
      const fileName = req.file.filename;
      resumePath = `/uploads/resumes/${fileName}`;
      
      console.log("✅ Resume uploaded successfully:", {
        filename: fileName,
        savedPath: resumePath,
        originalName: req.file.originalname
      });
    }

    // ✅ Create and save application
    const newApplication = new Application({
      opportunity: opportunityId,
      user: userId,
      name: user.fullName,
      email: user.email,
      motivation,
      resume: resumePath,
      status: "pending",
    });

    await newApplication.save();

    res.status(201).json({
      success: true,
      message: "Application submitted successfully ✅",
      data: newApplication,
    });
  } catch (error) {
    console.error("❌ Error creating application:", error);
    res.status(500).json({
      success: false,
      message: "Server error while submitting application",
      error: error.message,
    });
  }
};

/* ========================================================
   ✅ 2. Get logged-in volunteer's own applications
======================================================== */
export const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user._id })
      .populate("opportunity", "title location duration category")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    console.error("❌ Get My Applications Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ========================================================
   ✅ 3. Get all applications for a specific opportunity (NGO/Admin)
======================================================== */
// ...existing code until getApplicationsByOpportunity...

export const getApplicationsByOpportunity = async (req, res) => {
  try {
    const { opportunityId } = req.params;

    // Add validation for opportunityId
    if (!opportunityId) {
      return res.status(400).json({ 
        success: false, 
        message: "Opportunity ID is required" 
      });
    }

    // Validate if opportunityId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(opportunityId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid opportunity ID format" 
      });
    }

    const applications = await Application.find({ opportunity: opportunityId })
      .populate("user", "fullName email skills")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    console.error("❌ Get Applications By Opportunity Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: error.message 
    });
  }
};

/* ========================================================
   ✅ 4. Get all applications submitted by a specific user (Admin)
======================================================== */
export const getApplicationsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const applications = await Application.find({ user: userId })
      .populate("opportunity", "title location duration category")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    console.error("❌ Get Applications By User ID Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ========================================================
   ✅ 5. Get all applications for opportunities created by logged-in NGO
======================================================== */
export const getApplicationsForMyNGO = async (req, res) => {
  try {
    // Find opportunities created by this NGO
    const ngoOpportunities = await Opportunity.find({ ngo_id: req.user._id }).select("_id");

    if (!ngoOpportunities.length) {
      return res.status(200).json({ success: true, data: [] });
    }

    const opportunityIds = ngoOpportunities.map((opp) => opp._id);

    const applications = await Application.find({
      opportunity: { $in: opportunityIds },
    })
      .populate("user", "fullName email skills")
      .populate("opportunity", "title location duration")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    console.error("❌ Get NGO Applications Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ========================================================
   ✅ 6. Update Application Status (NGO only)
======================================================== */
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "accepted", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const updatedApp = await Application.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedApp) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    res.status(200).json({
      success: true,
      message: "Application status updated successfully ✅",
      data: updatedApp,
    });
  } catch (error) {
    console.error("❌ Update Status Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ========================================================
   ✅ 7. Delete Application (Admin/NGO)
======================================================== */
export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedApp = await Application.findByIdAndDelete(id);
    if (!deletedApp) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    res.status(200).json({
      success: true,
      message: "Application deleted successfully ✅",
    });
  } catch (error) {
    console.error("❌ Delete Application Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};