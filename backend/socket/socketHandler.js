import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Store active socket connections: userId -> socketId
const activeUsers = new Map();

// Store the io instance for use in controllers
let ioInstance = null;

export const initializeSocket = (io) => {
  ioInstance = io;
  // Socket.IO middleware for JWT authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];
      
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      
      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error.message);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    console.log(`✅ User connected: ${userId} (Socket ID: ${socket.id})`);

    // Store user's socket connection
    activeUsers.set(userId, socket.id);
    
    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle sending messages
    socket.on("send_message", async (data) => {
      try {
        const { conversationId, receiverId, content } = data;

        if (!conversationId || !receiverId || !content) {
          socket.emit("error", { message: "Missing required fields" });
          return;
        }

        // Import here to avoid circular dependencies
        const Message = (await import("../models/Message.js")).default;
        const Conversation = (await import("../models/Conversation.js")).default;

        // Verify conversation exists and user is a participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit("error", { message: "Conversation not found" });
          return;
        }

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === userId.toString()
        );
        if (!isParticipant) {
          socket.emit("error", { message: "Not authorized" });
          return;
        }

        // Create message
        const message = new Message({
          conversation: conversationId,
          sender: userId,
          receiver: receiverId,
          content: content.trim(),
        });

        await message.save();

        // Update conversation's last message and unread count
        const currentUnread = conversation.unreadCount?.get(receiverId) || 0;
        if (!conversation.unreadCount) {
          conversation.unreadCount = new Map();
        }
        conversation.unreadCount.set(receiverId, currentUnread + 1);

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: content.trim(),
          lastMessageAt: new Date(),
          unreadCount: conversation.unreadCount,
        });

        // Populate sender and receiver info
        await message.populate("sender", "fullName email userType organizationName");
        await message.populate("receiver", "fullName email userType organizationName");

        // Emit to receiver if online
        const receiverSocketId = activeUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(`user:${receiverId}`).emit("new_message", {
            message: message.toObject(),
            conversationId,
          });
        }

        // Confirm to sender with populated message
        socket.emit("message_sent", {
          success: true,
          message: message.toObject(),
        });

        console.log(`📨 Message sent from ${userId} to ${receiverId}`);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle typing indicator
    socket.on("typing", (data) => {
      const { conversationId, receiverId } = data;
      if (receiverId) {
        io.to(`user:${receiverId}`).emit("user_typing", {
          conversationId,
          userId,
          isTyping: true,
        });
      }
    });

    socket.on("stop_typing", (data) => {
      const { conversationId, receiverId } = data;
      if (receiverId) {
        io.to(`user:${receiverId}`).emit("user_typing", {
          conversationId,
          userId,
          isTyping: false,
        });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${userId}`);
      activeUsers.delete(userId);
    });
  });

  return io;
};

// Export function to get io instance
export const getIO = () => ioInstance;

// Helper function to emit conversation:new event to both participants
export const emitNewConversation = async (conversation) => {
  if (!ioInstance) {
    console.warn("⚠️ Socket.IO instance not initialized, cannot emit conversation:new");
    return;
  }

  try {
    // Populate conversation if not already populated
    // Check if participants are populated (they should be objects with _id, not just ObjectIds)
    const firstParticipant = conversation.participants[0];
    if (!firstParticipant || typeof firstParticipant === 'string' || !firstParticipant.fullName) {
      await conversation.populate("participants", "fullName email userType organizationName");
    }
    // Populate application if it exists and is not already populated
    if (conversation.application) {
      const application = conversation.application;
      // If it's an ObjectId (string) or doesn't have populated fields, populate it
      if (typeof application === 'string' || (typeof application === 'object' && application._id && !application.status)) {
        await conversation.populate("application");
      }
    }

    // Emit to both participants with properly formatted conversation
    const participants = conversation.participants;
    if (participants.length !== 2) {
      console.warn("⚠️ Conversation must have exactly 2 participants");
      return;
    }

    // Format and emit for each participant
    participants.forEach((participant) => {
      const userId = participant._id.toString();
      const otherParticipant = participants.find(p => p._id.toString() !== userId);

      if (!otherParticipant) return;

      const formattedConversation = {
        _id: conversation._id,
        otherParticipant: {
          _id: otherParticipant._id,
          name: otherParticipant?.fullName || otherParticipant?.organizationName || "Unknown",
          email: otherParticipant?.email,
          userType: otherParticipant?.userType,
        },
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCount: (() => {
          if (!conversation.unreadCount) return 0;
          if (conversation.unreadCount instanceof Map) {
            return conversation.unreadCount.get(userId) || 0;
          }
          if (typeof conversation.unreadCount === 'object') {
            return conversation.unreadCount[userId] || 0;
          }
          return 0;
        })(),
        application: conversation.application,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };

      ioInstance.to(`user:${userId}`).emit("conversation:new", {
        conversation: formattedConversation,
      });
      console.log(`📬 Emitted conversation:new to user ${userId}`);
    });
  } catch (error) {
    console.error("❌ Error emitting conversation:new:", error);
  }
};

export { activeUsers };

