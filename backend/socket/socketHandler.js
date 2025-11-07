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
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

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

    // Emit online users list to the newly connected socket and broadcast online status
    try {
      socket.emit("online_users", Array.from(activeUsers.keys()));
      io.emit("user_online", userId);
    } catch (err) {
      console.error("Error emitting presence events:", err);
    }

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
        const Conversation = (await import("../models/Conversation.js"))
          .default;

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
        await message.populate(
          "sender",
          "fullName email userType organizationName"
        );
        await message.populate(
          "receiver",
          "fullName email userType organizationName"
        );

        // Emit to receiver if online
        const receiverSocketId = activeUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(`user:${receiverId}`).emit("new_message", {
            message: message.toObject(),
            conversationId,
          });
        }

        // Create notification for receiver about new message
        try {
          const { createNotification } = await import(
            "../controllers/notificationController.js"
          );

          const senderName =
            message.sender?.fullName ||
            message.sender?.organizationName ||
            "Someone";
          const notification = await createNotification({
            userId: receiverId.toString(),
            type: "new_message",
            title: "New Message",
            message: `${senderName} sent you a message: "${content
              .trim()
              .substring(0, 50)}${content.length > 50 ? "..." : ""}"`,
            relatedEntity: {
              type: "message",
              id: message._id,
            },
            metadata: {
              conversationId: conversationId.toString(),
              senderId: userId.toString(),
              senderName: senderName,
            },
          });

          if (notification) {
            await emitNotification(notification);
          }
        } catch (notifError) {
          console.error("Error creating message notification:", notifError);
          // Don't fail message sending if notification fails
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
      try {
        io.emit("user_offline", userId);
      } catch (err) {
        console.error("Error emitting user_offline:", err);
      }
    });
  });

  return io;
};

// Export function to get io instance
export const getIO = () => ioInstance;

// Helper function to emit conversation:new event to both participants
export const emitNewConversation = async (conversation) => {
  if (!ioInstance) {
    console.warn(
      "⚠️ Socket.IO instance not initialized, cannot emit conversation:new"
    );
    return;
  }

  try {
    // Populate conversation if not already populated
    // Check if participants are populated (they should be objects with _id, not just ObjectIds)
    const firstParticipant = conversation.participants[0];
    if (
      !firstParticipant ||
      typeof firstParticipant === "string" ||
      !firstParticipant.fullName
    ) {
      await conversation.populate(
        "participants",
        "fullName email userType organizationName"
      );
    }
    // Populate application if it exists and is not already populated
    if (conversation.application) {
      const application = conversation.application;
      // If it's an ObjectId (string) or doesn't have populated fields, populate it
      if (
        typeof application === "string" ||
        (typeof application === "object" &&
          application._id &&
          !application.status)
      ) {
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
      const otherParticipant = participants.find(
        (p) => p._id.toString() !== userId
      );

      if (!otherParticipant) return;

      const formattedConversation = {
        _id: conversation._id,
        otherParticipant: {
          _id: otherParticipant._id,
          name:
            otherParticipant?.fullName ||
            otherParticipant?.organizationName ||
            "Unknown",
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
          if (typeof conversation.unreadCount === "object") {
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

// Helper function to emit notification to user via Socket.IO
export const emitNotification = async (notification) => {
  if (!ioInstance) {
    console.warn(
      "⚠️ Socket.IO instance not initialized, cannot emit notification"
    );
    return;
  }

  try {
    // Ensure user ID is a string
    const userId = notification.user?.toString
      ? notification.user.toString()
      : String(notification.user);

    if (!userId) {
      console.error("❌ Cannot emit notification: user ID is missing");
      return;
    }

    // Format notification for frontend
    const formattedNotification = {
      _id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read || false,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      relatedEntity: notification.relatedEntity || null,
      metadata: notification.metadata
        ? notification.metadata instanceof Map
          ? Object.fromEntries(notification.metadata)
          : notification.metadata
        : {},
    };

    // Emit notification to the user's room
    ioInstance.to(`user:${userId}`).emit("notification:new", {
      notification: formattedNotification,
    });

    console.log(
      `📬 Emitted notification:new to user ${userId} (${notification.title})`
    );
  } catch (error) {
    console.error("❌ Error emitting notification:", error);
  }
};

export { activeUsers };
