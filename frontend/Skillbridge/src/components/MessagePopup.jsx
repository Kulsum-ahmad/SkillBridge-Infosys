import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, ArrowLeft, Send } from "lucide-react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import api from "./api.js";

export default function MessagePopup() {
  const [open, setOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  // Refs to avoid stale closures in socket event listeners
  const selectedChatRef = useRef(null);
  const messagesRef = useRef([]);
  const currentUserIdRef = useRef(null);

  // Get auth token
  const getAuthToken = () => {
    let token = localStorage.getItem("sb_token");
    if (!token) {
      const userStr = localStorage.getItem("sb_user");
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          token = userData.token;
        } catch (e) {
          console.error("Error parsing sb_user:", e);
        }
      }
    }
    return token;
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      console.warn("No auth token found, Socket.IO connection skipped");
      return;
    }

    const newSocket = io("http://localhost:5000", {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
    });

    const handleConnect = () => {
      console.log("✅ Socket.IO connected");
    };

    const handleDisconnect = () => {
      console.log("❌ Socket.IO disconnected");
    };

    const handleError = (error) => {
      console.error("Socket.IO error:", error);
      const errorMessage =
        error?.message || error?.toString() || "Connection error";
      toast.error(
        errorMessage.includes("message")
          ? errorMessage
          : "Connection error. Please refresh the page."
      );
    };

    // Listen for new messages (from other users)
    const handleNewMessage = (data) => {
      const { message, conversationId } = data;

      // Check if message already exists to prevent duplicates
      const messageExists = messagesRef.current.some(
        (msg) =>
          msg._id === message._id ||
          (msg._id?.startsWith("temp-") && msg.content === message.content)
      );

      if (messageExists) {
        return;
      }

      // Update messages if this conversation is open
      const currentSelectedChat = selectedChatRef.current;
      if (currentSelectedChat && currentSelectedChat._id === conversationId) {
        setMessages((prev) => {
          // Double-check for duplicates
          const exists = prev.some((msg) => msg._id === message._id);
          if (exists) return prev;
          return [...prev, message];
        });

        // Scroll and show notification
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);

        // Only show toast if message is from another user
        const senderId = message.sender?._id?.toString
          ? message.sender._id.toString()
          : message.sender?._id;
        const currentUserIdStr = currentUserIdRef.current?.toString
          ? currentUserIdRef.current.toString()
          : currentUserIdRef.current;
        if (senderId && senderId !== currentUserIdStr) {
          toast.success(
            `New message from ${
              message.sender?.fullName ||
              message.sender?.organizationName ||
              "User"
            }`
          );
        }
      }

      // Update conversation list and maintain sort order
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv._id === conversationId) {
            const currentSelectedChat = selectedChatRef.current;
            return {
              ...conv,
              lastMessage: message.content,
              lastMessageAt: message.createdAt,
              unreadCount:
                conv._id === currentSelectedChat?._id
                  ? 0
                  : (conv.unreadCount || 0) + 1,
            };
          }
          return conv;
        });
        // Re-sort by lastMessageAt (most recent first), then by updatedAt
        return updated.sort((a, b) => {
          const aTime = new Date(
            a.lastMessageAt || a.updatedAt || a.createdAt
          ).getTime();
          const bTime = new Date(
            b.lastMessageAt || b.updatedAt || b.createdAt
          ).getTime();
          return bTime - aTime;
        });
      });
    };

    // Listen for message sent confirmation (from current user)
    const handleMessageSent = (data) => {
      if (data.success && data.message) {
        const message = data.message;
        const currentSelectedChat = selectedChatRef.current;

        // Replace temp message with real message
        setMessages((prev) => {
          // Remove any temp messages with matching content
          const filtered = prev.filter((msg) => {
            if (
              msg._id?.startsWith("temp-") &&
              msg.content === message.content
            ) {
              return false;
            }
            // Also check if real message already exists
            if (msg._id === message._id) {
              return false;
            }
            return true;
          });
          // Add the real message
          return [...filtered, message];
        });

        // Update conversation if it's the current one and maintain sort order
        if (
          currentSelectedChat &&
          currentSelectedChat._id === message.conversation
        ) {
          setConversations((prev) => {
            const updated = prev.map((conv) =>
              conv._id === message.conversation
                ? {
                    ...conv,
                    lastMessage: message.content,
                    lastMessageAt: message.createdAt,
                  }
                : conv
            );
            // Re-sort by lastMessageAt (most recent first), then by updatedAt
            return updated.sort((a, b) => {
              const aTime = new Date(
                a.lastMessageAt || a.updatedAt || a.createdAt
              ).getTime();
              const bTime = new Date(
                b.lastMessageAt || b.updatedAt || b.createdAt
              ).getTime();
              return bTime - aTime;
            });
          });
        }

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    };

    // Listen for new conversation creation
    const handleNewConversation = (data) => {
      if (data.conversation) {
        const newConversation = data.conversation;

        // Check if conversation already exists to prevent duplicates
        setConversations((prev) => {
          const exists = prev.some((conv) => conv._id === newConversation._id);
          if (exists) {
            // If it exists, update it with the latest data and maintain sort order
            const updated = prev.map((conv) =>
              conv._id === newConversation._id ? newConversation : conv
            );
            // Re-sort by lastMessageAt (most recent first), then by updatedAt
            return updated.sort((a, b) => {
              const aTime = new Date(
                a.lastMessageAt || a.updatedAt || a.createdAt
              ).getTime();
              const bTime = new Date(
                b.lastMessageAt || b.updatedAt || b.createdAt
              ).getTime();
              return bTime - aTime;
            });
          }
          // Add new conversation at the beginning (most recent first)
          return [newConversation, ...prev];
        });

        console.log("✅ New conversation added to list:", newConversation._id);
      }
    };

    // Register event listeners
    newSocket.on("connect", handleConnect);
    newSocket.on("disconnect", handleDisconnect);
    newSocket.on("error", handleError);
    newSocket.on("new_message", handleNewMessage);
    newSocket.on("message_sent", handleMessageSent);
    newSocket.on("conversation:new", handleNewConversation);

    // Presence listeners
    const handleOnlineUsers = (list) => {
      try {
        // Normalize IDs to strings to avoid type mismatches
        const normalized = Array.isArray(list)
          ? list.map((id) => String(id))
          : [];
        setOnlineUsers(new Set(normalized));
      } catch (e) {
        console.error("Error setting online users:", e);
      }
    };

    const handleUserOnline = (userId) => {
      const idStr = String(userId);
      setOnlineUsers((prev) => {
        const s = new Set(prev);
        s.add(idStr);
        return s;
      });
    };

    const handleUserOffline = (userId) => {
      const idStr = String(userId);
      setOnlineUsers((prev) => {
        const s = new Set(prev);
        s.delete(idStr);
        return s;
      });
    };

    newSocket.on("online_users", handleOnlineUsers);
    newSocket.on("user_online", handleUserOnline);
    newSocket.on("user_offline", handleUserOffline);

    setSocket(newSocket);

    // Cleanup function
    return () => {
      // Remove all event listeners
      newSocket.off("connect", handleConnect);
      newSocket.off("disconnect", handleDisconnect);
      newSocket.off("error", handleError);
      newSocket.off("new_message", handleNewMessage);
      newSocket.off("message_sent", handleMessageSent);
      newSocket.off("conversation:new", handleNewConversation);
      newSocket.off("online_users", handleOnlineUsers);
      newSocket.off("user_online", handleUserOnline);
      newSocket.off("user_offline", handleUserOffline);
      // Close socket connection
      newSocket.close();
    };
  }, []);

  // Fetch initial online users via API as a fallback/initialization
  useEffect(() => {
    const fetchOnline = async () => {
      try {
        const resp = await api.get("/online-users");
        if (resp.data?.success && Array.isArray(resp.data.data)) {
          setOnlineUsers(new Set(resp.data.data));
        }
      } catch (err) {
        // ignore; socket will provide online list when connected
      }
    };

    fetchOnline();
  }, []);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get("/conversations");

      if (response.data?.success && response.data?.data) {
        setConversations(response.data.data);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId) => {
    try {
      setLoading(true);
      const response = await api.get(`/messages/${conversationId}`);

      if (response.data?.success && response.data?.data) {
        setMessages(response.data.data);
        scrollToBottom();
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load conversations when popup opens
  useEffect(() => {
    if (open) {
      fetchConversations();
    }
  }, [open]);

  // Listen for custom event to open message popup from notification click
  useEffect(() => {
    const handleOpenMessagePopup = async (event) => {
      const { conversationId } = event.detail || {};

      // Open the popup first
      setOpen(true);

      if (conversationId) {
        // Fetch conversations to get the latest list
        try {
          const response = await api.get("/conversations");
          if (response.data?.success && response.data?.data) {
            const conversations = response.data.data;
            // Find the conversation and select it
            const conv = conversations.find((c) => c._id === conversationId);
            if (conv) {
              setSelectedChat(conv);
              // Load messages for this conversation
              fetchMessages(conversationId);
            } else {
              // Conversation not found, just show the list
              setConversations(conversations);
            }
          }
        } catch (error) {
          console.error(
            "Error fetching conversations for notification:",
            error
          );
        }
      }
    };

    window.addEventListener("openMessagePopup", handleOpenMessagePopup);
    return () => {
      window.removeEventListener("openMessagePopup", handleOpenMessagePopup);
    };
  }, []);

  // Load messages when a chat is selected
  useEffect(() => {
    if (selectedChat && selectedChat._id) {
      fetchMessages(selectedChat._id);
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat || !socket) {
      return;
    }

    const content = messageInput.trim();
    const conversationId = selectedChat._id;
    const receiverId = selectedChat.otherParticipant._id;

    // Optimistically update UI with temp message
    const tempMessageId = `temp-${Date.now()}`;
    const tempMessage = {
      _id: tempMessageId,
      content,
      sender: { _id: currentUserId, fullName: "You" },
      receiver: selectedChat.otherParticipant,
      createdAt: new Date().toISOString(),
      read: false,
      conversation: conversationId,
    };

    // Clear input immediately for better UX
    setMessageInput("");

    // Add temp message
    setMessages((prev) => [...prev, tempMessage]);

    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    // Update conversation last message optimistically
    setConversations((prev) =>
      prev.map((conv) =>
        conv._id === conversationId
          ? {
              ...conv,
              lastMessage: content,
              lastMessageAt: new Date().toISOString(),
            }
          : conv
      )
    );

    // Send via Socket.IO (this is async but doesn't throw - errors come via socket events)
    try {
      socket.emit("send_message", {
        conversationId,
        receiverId,
        content,
      });

      // Note: The temp message will be replaced by the real message
      // when message_sent event is received (handled in socket listener)
      // If there's an error, it will be handled by the socket error listener
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");

      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessageId));
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!selectedChat || !socket) return;

    socket.emit("typing", {
      conversationId: selectedChat._id,
      receiverId: selectedChat.otherParticipant._id,
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", {
        conversationId: selectedChat._id,
        receiverId: selectedChat.otherParticipant._id,
      });
    }, 2000);
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Format message time
  const formatMessageTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Get current user ID
  const getCurrentUserId = () => {
    const userStr = localStorage.getItem("sb_user");
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        return userData._id || userData.user?._id;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const currentUserId = getCurrentUserId();

  // Update refs when state changes
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  const styles = {
    chatButton: {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      background: "linear-gradient(135deg, #d946ef, #9333ea)",
      color: "#fff",
      border: "none",
      borderRadius: "50%",
      width: "56px",
      height: "56px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
      cursor: "pointer",
      transition: "all 0.3s ease",
      zIndex: 9999,
    },
    popupBox: {
      position: "fixed",
      bottom: "90px",
      right: "20px",
      width: "360px",
      maxWidth: "90vw",
      backgroundColor: "#fff",
      borderRadius: "16px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
      border: "1px solid #e5e7eb",
      overflow: "hidden",
      animation: "slideUp 0.3s ease-out",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      height: "600px",
    },
    header: {
      background: "linear-gradient(135deg, #d946ef, #9333ea)",
      color: "#fff",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 16px",
      fontWeight: "600",
      fontSize: "16px",
    },
    messageList: {
      flex: 1,
      overflowY: "auto",
      background: "#fff",
    },
    messageItem: {
      padding: "12px 16px",
      borderBottom: "1px solid #f0f0f0",
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      transition: "background 0.2s",
    },
    messageLeft: { flex: 1, marginRight: "8px" },
    messageName: { fontWeight: "600", fontSize: "14px", color: "#111827" },
    messageType: { fontSize: "12px", color: "#6b7280", marginBottom: "4px" },
    messagePreview: {
      fontSize: "13px",
      color: "#374151",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    time: { fontSize: "11px", color: "#9ca3af" },
    unreadBadge: {
      backgroundColor: "#9333ea",
      color: "#fff",
      borderRadius: "50%",
      width: "20px",
      height: "20px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "11px",
      fontWeight: "bold",
    },
    chatBody: {
      flex: 1,
      padding: "12px 16px",
      backgroundColor: "#f9fafb",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    },
    chatMessage: {
      padding: "10px 14px",
      borderRadius: "12px",
      maxWidth: "80%",
      fontSize: "14px",
      lineHeight: "1.4",
    },
    ngoMessage: {
      alignSelf: "flex-start",
      backgroundColor: "#fff",
      color: "#111827",
      border: "1px solid #e5e7eb",
    },
    userMessage: {
      alignSelf: "flex-end",
      background: "linear-gradient(135deg, #d946ef, #9333ea)",
      color: "#fff",
    },
    inputBox: {
      display: "flex",
      alignItems: "center",
      borderTop: "1px solid #e5e7eb",
      padding: "8px 10px",
      background: "#fff",
    },
    inputField: {
      flex: 1,
      border: "none",
      outline: "none",
      fontSize: "14px",
      padding: "8px 10px",
      borderRadius: "20px",
      backgroundColor: "#f3f4f6",
      marginRight: "8px",
    },
    sendButton: {
      background: "linear-gradient(135deg, #d946ef, #9333ea)",
      border: "none",
      color: "#fff",
      borderRadius: "50%",
      width: "36px",
      height: "36px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      cursor: "pointer",
    },
    loading: {
      padding: "20px",
      textAlign: "center",
      color: "#6b7280",
    },
    emptyState: {
      padding: "20px",
      textAlign: "center",
      color: "#9ca3af",
      fontStyle: "italic",
    },
  };

  return (
    <>
      {/* Floating button */}
      <button
        style={styles.chatButton}
        onClick={() => setOpen(!open)}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {open ? <X size={24} /> : <MessageCircle size={26} />}
      </button>

      {open && (
        <div style={styles.popupBox}>
          {/* Header */}
          <div style={styles.header}>
            {selectedChat ? (
              <>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <ArrowLeft
                    size={20}
                    onClick={() => {
                      setSelectedChat(null);
                      setMessages([]);
                    }}
                    style={{ cursor: "pointer" }}
                  />
                  <div>
                    {selectedChat.otherParticipant?.name || "Unknown User"}
                    <div style={{ fontSize: "12px", fontWeight: "normal" }}>
                      {selectedChat.otherParticipant?.userType === "ngo"
                        ? "Organization"
                        : "Volunteer"}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 500,
                        marginTop: 4,
                      }}
                    >
                      {onlineUsers.has(
                        String(selectedChat.otherParticipant?._id)
                      ) ? (
                        <span style={{ color: "#10b981" }}>Online</span>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>
                          Last seen {formatTime(selectedChat.lastMessageAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <X
                  size={18}
                  onClick={() => setOpen(false)}
                  style={{ cursor: "pointer" }}
                />
              </>
            ) : (
              <>
                <span>Messages</span>
                <X
                  size={18}
                  onClick={() => setOpen(false)}
                  style={{ cursor: "pointer" }}
                />
              </>
            )}
          </div>

          {/* Message list */}
          {!selectedChat && (
            <div style={styles.messageList}>
              {loading ? (
                <div style={styles.loading}>Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div style={styles.emptyState}>No conversations yet</div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv._id}
                    style={styles.messageItem}
                    onClick={() => setSelectedChat(conv)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f9fafb")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "#fff")
                    }
                  >
                    <div style={styles.messageLeft}>
                      <div style={styles.messageName}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 10,
                              display: "inline-block",
                              background: onlineUsers.has(
                                String(conv.otherParticipant?._id)
                              )
                                ? "#10b981"
                                : "#e5e7eb",
                              boxShadow: onlineUsers.has(
                                String(conv.otherParticipant?._id)
                              )
                                ? "0 0 6px rgba(16,185,129,0.2)"
                                : "none",
                            }}
                          />
                          {conv.otherParticipant?.name || "Unknown User"}
                        </span>
                      </div>
                      <div style={styles.messageType}>
                        {conv.otherParticipant?.userType === "ngo"
                          ? "Organization"
                          : "Volunteer"}
                      </div>
                      <div style={styles.messagePreview}>
                        {conv.lastMessage || "No messages yet"}
                      </div>
                    </div>
                    <div>
                      <div style={styles.time}>
                        {formatTime(conv.lastMessageAt)}
                      </div>
                      {conv.unreadCount > 0 && (
                        <div style={styles.unreadBadge}>{conv.unreadCount}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Chat window */}
          {selectedChat && (
            <>
              <div style={styles.chatBody}>
                {loading && messages.length === 0 ? (
                  <div style={styles.loading}>Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div style={styles.emptyState}>
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isCurrentUser =
                        msg.sender?._id === currentUserId ||
                        msg.sender?._id === "current-user" ||
                        msg.sender?.fullName === "You";
                      return (
                        <div
                          key={msg._id || `msg-${msg.createdAt}`}
                          style={{
                            ...styles.chatMessage,
                            ...(isCurrentUser
                              ? styles.userMessage
                              : styles.ngoMessage),
                          }}
                        >
                          {msg.content}
                          <div
                            style={{
                              fontSize: "11px",
                              opacity: 0.7,
                              marginTop: "4px",
                            }}
                          >
                            {formatMessageTime(msg.createdAt)}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div style={styles.inputBox}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  style={styles.inputField}
                />
                <button onClick={handleSendMessage} style={styles.sendButton}>
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
