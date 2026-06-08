import Application from "../models/Application.js";
import Opportunity from "../models/opportunity.model.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import { emitNewConversation, emitNotification } from "../socket/socketHandler.js";
import { createNotification } from "./notificationController.js";
import Profile from "../models/Profile.js";
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
    // 🧠 Validate user existence and get their freshest profile name
    const user = await User.findById(userId).select("fullName email");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Check if they have an updated profile name
    const profile = await Profile.findOne({ user: userId }).select("name email");
    const applicationName = profile?.name || user.fullName;
    const applicationEmail = profile?.email || user.email;

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
    // ✅ Create and save application
    const newApplication = new Application({
      opportunity: opportunityId,
      user: userId,
      name: applicationName, // Uses freshest profile name
      email: applicationEmail, 
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
    const ngoId = req.user._id;

    const validStatuses = ["pending", "accepted", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    // Get the application with populated data
    const application = await Application.findById(id)
      .populate("user", "fullName email")
      .populate("opportunity", "title ngo_id");

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    // Verify that the NGO owns this opportunity
    const opportunity = await Opportunity.findById(application.opportunity._id);
    if (!opportunity || opportunity.ngo_id.toString() !== ngoId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this application",
      });
    }

    // Update application status
    const updatedApp = await Application.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    // Create notification for the volunteer
    const volunteerId = application.user._id;
    const opportunityTitle = application.opportunity?.title || "the opportunity";
    
    let notificationType, notificationTitle, notificationMessage;
    
    if (status === "accepted") {
      notificationType = "application_approved";
      notificationTitle = "Application Approved!";
      notificationMessage = `Your application for '${opportunityTitle}' has been approved. Check your dashboard for next steps.`;
    } else if (status === "rejected") {
      notificationType = "application_rejected";
      notificationTitle = "Application Update";
      notificationMessage = `Your application for '${opportunityTitle}' has been reviewed. Check your dashboard for details.`;
    } else {
      notificationType = "application_pending";
      notificationTitle = "Application Status Updated";
      notificationMessage = `Your application for '${opportunityTitle}' status has been updated to pending.`;
    }

    // Create and emit notification
    const notification = await createNotification({
      userId: volunteerId.toString(),
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      relatedEntity: {
        type: "application",
        id: id,
      },
      metadata: {
        opportunityId: application.opportunity?._id?.toString(),
        opportunityTitle: opportunityTitle,
      },
    });

    if (notification) {
      await emitNotification(notification);
    }

    // 🎯 If status is "accepted", automatically create a conversation
    if (status === "accepted") {
      try {
        const volunteerId = application.user._id;

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
          participants: { $all: [ngoId, volunteerId] },
          application: id,
        });

        if (!conversation) {
          // Create new conversation
          conversation = new Conversation({
            participants: [ngoId, volunteerId],
            application: id,
            lastMessage: null,
            lastMessageAt: null,
          });

          await conversation.save();
          console.log(`✅ Conversation created for application ${id} between NGO ${ngoId} and Volunteer ${volunteerId}`);
          
          // Populate participants before emitting
          await conversation.populate("participants", "fullName email userType organizationName");
          if (conversation.application) {
            await conversation.populate("application");
          }
          
          // Emit conversation:new event to both participants
          await emitNewConversation(conversation);

          // Create notifications for new conversation
          const participants = conversation.participants;
          if (participants.length === 2) {
            const notificationPromises = participants.map(async (participant) => {
              const otherParticipant = participants.find(p => p._id.toString() !== participant._id.toString());
              if (otherParticipant) {
                const otherName = otherParticipant.fullName || otherParticipant.organizationName || "Someone";
                const convNotification = await createNotification({
                  userId: participant._id.toString(),
                  type: "new_conversation",
                  title: "New Conversation Started",
                  message: `A conversation has been started for your accepted application. Start chatting with ${otherName}!`,
                  relatedEntity: {
                    type: "conversation",
                    id: conversation._id,
                  },
                  metadata: {
                    otherParticipantId: otherParticipant._id.toString(),
                    otherParticipantName: otherName,
                    applicationId: id.toString(),
                  },
                });

                if (convNotification) {
                  await emitNotification(convNotification);
                }
              }
            });
            await Promise.all(notificationPromises);
          }
        } else {
          console.log(`ℹ️ Conversation already exists for application ${id}`);
        }
      } catch (convError) {
        console.error("❌ Error creating conversation:", convError);
        // Don't fail the request if conversation creation fails
        // The conversation can be created manually later
      }
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