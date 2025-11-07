import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    // Reference to the application that created this conversation
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      default: null,
    },
    // Last message for quick preview
    lastMessage: {
      type: String,
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    // Track unread messages per participant
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
  },
  {
    timestamps: true,
  }
);

// Ensure unique conversation between two users for the same application
conversationSchema.index({ participants: 1, application: 1 }, { unique: true });

// Index for faster queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;

