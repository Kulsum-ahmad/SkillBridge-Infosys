import mongoose from "mongoose";

const opportunitySchema = new mongoose.Schema(
  {
    ngo_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: ["education", "healthcare", "environment", "community", "technology"],
      required: true,
    },

    required_skills: [
      {
        type: String,
      },
    ],

    duration: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },

    deadline: {
      type: Date,
      required: true,
    },

    // ✅ New field added for file/document upload
    document: {
      type: String, // Will store file path like 'uploads/123456.pdf'
      default: null,
    },
  },
  { timestamps: true }
);

// ✅ Prevent duplicate titles for the same NGO
opportunitySchema.index({ ngo_id: 1, title: 1 }, { unique: true });

export default mongoose.model("Opportunity", opportunitySchema);
