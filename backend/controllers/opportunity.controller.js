// E:\SkillBridge-Group2\backend\controllers\opportunity.controller.js
import mongoose from "mongoose";
import Opportunity from "../models/opportunity.model.js";

// ✅ Allowed categories
const allowedCategories = [
  "education",
  "healthcare",
  "environment",
  "community",
  "technology",
];

// ✅ Helper function to parse skills
const parseSkills = (skills) => {
  if (!skills) return [];
  
  // If already an array, filter and return
  if (Array.isArray(skills)) {
    return skills
      .map((skill) => (typeof skill === 'string' ? skill.trim() : ''))
      .filter((skill) => skill.length > 0);
  }
  
  // If string, split by comma
  if (typeof skills === "string") {
    return skills
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);
  }
  
  return [];
};

// ✅ Create Opportunity
export const createOpportunity = async (req, res) => {
  try {
    const {
      category,
      title,
      description,
      location,
      duration,
      deadline,
      required_skills,
    } = req.body;

    console.log("📥 Received data:", req.body);
    console.log("📥 Required skills received:", required_skills);

    // 🧩 Validate category
    if (!category || !allowedCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid or missing category" });
    }

    // 🧩 Check user type
    if (!req.user || req.user.userType !== "ngo") {
      return res
        .status(403)
        .json({ message: "Only NGOs can create opportunities" });
    }

    // 🧩 Handle uploaded file (optional)
    let documentPath = null;
    if (req.file) {
      documentPath = `uploads/${req.file.filename}`;
    }

    // 🧩 Parse skills using helper function
    const skillsArray = parseSkills(required_skills);
    console.log("✅ Parsed skills array:", skillsArray);

    // 🧩 Validate that we have at least some skills
    if (skillsArray.length === 0) {
      return res.status(400).json({ 
        message: "At least one skill is required",
        receivedSkills: required_skills 
      });
    }

    const opportunity = new Opportunity({
      ngo_id: req.user._id,
      category,
      title,
      description,
      location,
      duration,
      deadline,
      required_skills: skillsArray,
      document: documentPath,
    });

    const saved = await opportunity.save();
    console.log("✅ Opportunity saved with skills:", saved.required_skills);
    
    res.status(201).json(saved);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Opportunity with this title already exists for this NGO",
      });
    }
    console.error("❌ Create Opportunity Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get All Opportunities
export const getAllOpportunities = async (req, res) => {
  try {
    let query = {};

    // 🧩 NGO users see their own opportunities
    if (req.user && req.user.userType === "ngo") {
      query.ngo_id = req.user._id;
    }

    const opportunities = await Opportunity.find(query)
      .populate({
        path: "ngo_id",
        select: "fullName email organizationName location userType",
      })
      .sort({ createdAt: -1 });

    res.status(200).json(opportunities);
  } catch (err) {
    console.error("❌ Get All Opportunities Error:", err);
    res.status(500).json({
      message: "Error fetching opportunities",
      error: err.message,
    });
  }
};

// ✅ Get Opportunity by ID
export const getOpportunityById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid opportunity ID" });
    }

    const opportunity = await Opportunity.findById(id).populate({
      path: "ngo_id",
      select: "fullName email organizationName location userType",
    });

    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    // 🧩 Authorization: NGOs can only see their own (but volunteers can see all)
    if (
      req.user &&
      req.user.userType === "ngo" &&
      opportunity.ngo_id._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this opportunity" });
    }

    res.status(200).json(opportunity);
  } catch (err) {
    console.error("❌ Get Opportunity by ID Error:", err);
    res
      .status(500)
      .json({ message: "Error fetching opportunity", error: err.message });
  }
};

// ✅ Update Opportunity
export const updateOpportunity = async (req, res) => {
  try {
    if (!req.user || req.user.userType !== "ngo") {
      return res
        .status(403)
        .json({ message: "Only NGOs can update opportunities" });
    }

    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    // 🧩 Authorization check
    if (opportunity.ngo_id.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this opportunity" });
    }

    // 🧩 Validate category if provided
    if (req.body.category && !allowedCategories.includes(req.body.category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    // 🧩 Handle new uploaded file (optional)
    if (req.file) {
      req.body.document = `uploads/${req.file.filename}`;
    }

    // 🧩 Handle updated skills properly using helper function
    if (req.body.required_skills !== undefined) {
      const skillsArray = parseSkills(req.body.required_skills);
      console.log("✅ Updating skills to:", skillsArray);
      
      if (skillsArray.length === 0) {
        return res.status(400).json({ 
          message: "At least one skill is required" 
        });
      }
      
      req.body.required_skills = skillsArray;
    }

    // 🧩 Update fields
    Object.assign(opportunity, req.body);
    const updated = await opportunity.save();

    console.log("✅ Opportunity updated with skills:", updated.required_skills);
    res.status(200).json(updated);
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "Duplicate opportunity title for this NGO" });
    }
    console.error("❌ Update Opportunity Error:", err);
    res
      .status(500)
      .json({ message: "Error updating opportunity", error: err.message });
  }
};

// ✅ Delete Opportunity
export const deleteOpportunity = async (req, res) => {
  try {
    if (!req.user || req.user.userType !== "ngo") {
      return res
        .status(403)
        .json({ message: "Only NGOs can delete opportunities" });
    }

    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    if (opportunity.ngo_id.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this opportunity" });
    }

    await opportunity.deleteOne();
    res.status(200).json({ message: "Opportunity deleted successfully" });
  } catch (err) {
    console.error("❌ Delete Opportunity Error:", err);
    res
      .status(500)
      .json({ message: "Error deleting opportunity", error: err.message });
  }
};