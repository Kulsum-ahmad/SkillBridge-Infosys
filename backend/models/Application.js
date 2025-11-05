import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  opportunity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Opportunity",
    required: [true, "Opportunity is required"]
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User is required"]
  },
  name: {
    type: String,
    required: [true, "Name is required"]
  },
  email: {
    type: String,
    required: [true, "Email is required"]
  },
  motivation: {
    type: String,
    required: [true, "Motivation is required"]
  },
  resume: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  }
}, {
  timestamps: true
});

// Pre-save middleware to ensure required fields
applicationSchema.pre('save', function(next) {
  if (!this.opportunity || !this.user) {
    next(new Error('Opportunity and User are required fields'));
  }
  next();
});

// Create compound index
applicationSchema.index({ opportunity: 1, user: 1 }, { 
  unique: true,
  name: 'application_unique_constraint'
});

const Application = mongoose.model("Application", applicationSchema);

export default Application;