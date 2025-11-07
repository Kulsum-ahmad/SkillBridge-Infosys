import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Application from "../models/Application.js";
import { emitNewConversation, emitNotification } from "../socket/socketHandler.js";
import { createNotification } from "./notificationController.js";

/* ========================================================
   ✅ 1. Get all conversations for logged-in user
======================================================== */
export const getMyConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "fullName email userType organizationName")
      .populate("application", "status opportunity")
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    // Format conversations with participant info
    const formattedConversations = conversations.map((conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );

      return {
        _id: conv._id,
        otherParticipant: {
          _id: otherParticipant?._id,
          name: otherParticipant?.fullName || otherParticipant?.organizationName || "Unknown",
          email: otherParticipant?.email,
          userType: otherParticipant?.userType,
        },
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: (() => {
          if (!conv.unreadCount) return 0;
          if (conv.unreadCount instanceof Map) {
            return conv.unreadCount.get(userId.toString()) || 0;
          }
          if (typeof conv.unreadCount === 'object') {
            return conv.unreadCount[userId.toString()] || 0;
          }
          return 0;
        })(),
        application: conv.application,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedConversations,
    });
  } catch (error) {
    console.error("❌ Get Conversations Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching conversations",
      error: error.message,
    });
  }
};

/* ========================================================
   ✅ 2. Get or create conversation between two users
======================================================== */
export const getOrCreateConversation = async (req, res) => {
  try {
    const { participantId, applicationId } = req.body;
    const userId = req.user._id;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: "Participant ID is required",
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, participantId] },
      ...(applicationId ? { application: applicationId } : {}),
    })
      .populate("participants", "fullName email userType organizationName")
      .populate("application");

    if (conversation) {
      return res.status(200).json({
        success: true,
        data: conversation,
        isNew: false,
      });
    }

    // Create new conversation
    conversation = new Conversation({
      participants: [userId, participantId],
      ...(applicationId ? { application: applicationId } : {}),
    });

    await conversation.save();
    await conversation.populate("participants", "fullName email userType organizationName");
    if (applicationId) {
      await conversation.populate("application");
    }

    // Emit conversation:new event to both participants
    await emitNewConversation(conversation);

    // Create notifications for both participants about new conversation
    const participants = conversation.participants;
    if (participants.length === 2) {
      const notificationPromises = participants.map(async (participant) => {
        const otherParticipant = participants.find(p => p._id.toString() !== participant._id.toString());
        if (otherParticipant) {
          const otherName = otherParticipant.fullName || otherParticipant.organizationName || "Someone";
          const notification = await createNotification({
            userId: participant._id.toString(),
            type: "new_conversation",
            title: "New Conversation Started",
            message: `You started a conversation with ${otherName}. Start chatting!`,
            relatedEntity: {
              type: "conversation",
              id: conversation._id,
            },
            metadata: {
              otherParticipantId: otherParticipant._id.toString(),
              otherParticipantName: otherName,
            },
          });

          if (notification) {
            await emitNotification(notification);
          }
        }
      });
      await Promise.all(notificationPromises);
    }

    res.status(201).json({
      success: true,
      data: conversation,
      isNew: true,
    });
  } catch (error) {
    console.error("❌ Create Conversation Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating conversation",
      error: error.message,
    });
  }
};

/* ========================================================
   ✅ 3. Get single conversation by ID
======================================================== */
export const getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId,
    })
      .populate("participants", "fullName email userType organizationName")
      .populate("application");

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("❌ Get Conversation Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching conversation",
      error: error.message,
    });
  }
};

/* ========================================================
   ✅ 4. Mark messages as read in a conversation
======================================================== */
export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Update all unread messages in this conversation
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

    // Reset unread count for this user
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      if (!conversation.unreadCount) {
        conversation.unreadCount = new Map();
      }
      if (conversation.unreadCount instanceof Map) {
        conversation.unreadCount.set(userId.toString(), 0);
      } else if (typeof conversation.unreadCount === 'object') {
        conversation.unreadCount[userId.toString()] = 0;
      }
      await conversation.save();
    }

    res.status(200).json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error) {
    console.error("❌ Mark Messages Read Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while marking messages as read",
      error: error.message,
    });
  }
};

