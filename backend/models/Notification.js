import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "application_approved",
        "application_rejected",
        "application_pending",
        "new_message",
        "new_conversation",
        "opportunity_match",
        "profile_view",
        "system",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    // Optional: Link to related entity (application, message, opportunity, etc.)
    relatedEntity: {
      type: {
        type: String,
        enum: ["application", "message", "conversation", "opportunity", "user"],
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    // Optional: Metadata for additional info
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map(),
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;

