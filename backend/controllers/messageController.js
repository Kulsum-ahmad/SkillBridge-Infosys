import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

/* ========================================================
   ✅ 1. Get all messages for a conversation
======================================================== */
export const getMessagesByConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Verify user is a participant in this conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this conversation",
      });
    }

    // Get messages
    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "fullName email userType organizationName")
      .populate("receiver", "fullName email userType organizationName")
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: userId,
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    // Reset unread count for this user (reuse previously-loaded `conversation`)
    if (conversation) {
      if (!conversation.unreadCount) {
        // Ensure unreadCount exists; store as plain object to be mongoose-friendly
        conversation.unreadCount =
          conversation.unreadCount instanceof Map
            ? conversation.unreadCount
            : {};
      }

      if (conversation.unreadCount instanceof Map) {
        conversation.unreadCount.set(userId.toString(), 0);
      } else if (typeof conversation.unreadCount === "object") {
        conversation.unreadCount[userId.toString()] = 0;
      }

      await conversation.save();
    }

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("❌ Get Messages Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching messages",
      error: error.message,
    });
  }
};

/* ========================================================
   ✅ 2. Send a message (REST API endpoint - Socket.IO also handles this)
======================================================== */
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, receiverId, content } = req.body;
    const senderId = req.user._id;

    if (!conversationId || !receiverId || !content) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID, receiver ID, and content are required",
      });
    }

    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === senderId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to send messages in this conversation",
      });
    }

    // Create message
    const message = new Message({
      conversation: conversationId,
      sender: senderId,
      receiver: receiverId,
      content: content.trim(),
    });

    await message.save();

    // Update conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: content.trim(),
      lastMessageAt: new Date(),
      $inc: { [`unreadCount.${receiverId}`]: 1 },
    });

    // Populate sender info
    await message.populate(
      "sender",
      "fullName email userType organizationName"
    );
    await message.populate(
      "receiver",
      "fullName email userType organizationName"
    );

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("❌ Send Message Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while sending message",
      error: error.message,
    });
  }
};

/* ========================================================
   ✅ 3. Get unread message count for user
======================================================== */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
    });

    let totalUnread = 0;
    conversations.forEach((conv) => {
      const unread = conv.unreadCount?.get(userId.toString()) || 0;
      totalUnread += unread;
    });

    res.status(200).json({
      success: true,
      data: {
        totalUnread,
      },
    });
  } catch (error) {
    console.error("❌ Get Unread Count Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching unread count",
      error: error.message,
    });
  }
};
