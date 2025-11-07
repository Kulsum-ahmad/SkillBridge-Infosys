import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2, MessageCircle } from "lucide-react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import styles from "./NotificationButton.module.css";
import api from "../api";

const NotificationButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

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

  // Format time to relative time (e.g., "5 minutes ago")
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

  // Map notification type to icon type
  const getNotificationIconType = (type) => {
    const typeMap = {
      application_approved: "success",
      application_rejected: "info",
      application_pending: "info",
      new_message: "info",
      new_conversation: "info",
      opportunity_match: "info",
      profile_view: "view",
      system: "info",
    };
    return typeMap[type] || "info";
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      console.log("📡 Fetching notifications from /api/notifications...");
      const response = await api.get("/notifications");
      console.log("✅ Notifications response:", response.data);
      
      if (response.data?.success && response.data?.data) {
        setNotifications(response.data.data);
        console.log(`✅ Loaded ${response.data.data.length} notifications`);
      } else {
        console.warn("⚠️ Unexpected response format:", response.data);
        setNotifications([]);
      }
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
        if (error.response.status === 404) {
          toast.error("Notifications endpoint not found. Please check server configuration.");
        } else if (error.response.status === 401) {
          toast.error("Please log in to view notifications.");
        } else {
          toast.error(`Failed to load notifications: ${error.response.data?.message || error.message}`);
        }
      } else {
        toast.error("Failed to connect to server. Please check your connection.");
      }
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Socket.IO connection for real-time notifications
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

    newSocket.on("connect", () => {
      console.log("✅ Notification Socket.IO connected");
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Notification Socket.IO disconnected");
    });

    // Listen for new notifications
    const handleNewNotification = (data) => {
      if (data.notification) {
        const newNotification = data.notification;
        console.log("🔔 New notification received:", newNotification);
        
        setNotifications((prev) => {
          // Check if notification already exists
          const exists = prev.some((n) => n._id === newNotification._id);
          if (exists) {
            console.log("⚠️ Notification already exists, skipping");
            return prev;
          }
          // Add new notification at the beginning
          console.log("✅ Adding new notification to list");
          return [newNotification, ...prev];
        });
        
        // Show toast for new notifications (only if not in focus or not viewing chat)
        if (document.visibilityState === 'visible') {
          toast.info(newNotification.title, {
            description: newNotification.message,
            duration: 5000,
          });
        }
      }
    };

    newSocket.on("notification:new", handleNewNotification);
    setSocket(newSocket);

    // Fetch initial notifications
    fetchNotifications();

    // Cleanup
    return () => {
      newSocket.off("notification:new", handleNewNotification);
      newSocket.close();
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    // Fetch latest notifications when opening
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, readAt: new Date() })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const clearAll = async () => {
    try {
      await api.delete("/notifications");
      setNotifications([]);
      toast.success("All notifications cleared");
    } catch (error) {
      console.error("Error clearing notifications:", error);
      toast.error("Failed to clear notifications");
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const markAsRead = async (id) => {
    try {
      // Try PUT first, fallback to PATCH
      try {
        await api.put(`/notifications/${id}/read`);
      } catch (putError) {
        // Fallback to PATCH if PUT fails
        await api.patch(`/notifications/${id}/read`);
      }
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true, readAt: new Date() } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  // Handle notification click - navigate to relevant page
  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Navigate based on notification type
    if (notification.relatedEntity) {
      const { type, id } = notification.relatedEntity;
      
      if (type === "message" || type === "conversation") {
        // Open chat/message popup - could trigger MessagePopup to open
        // For now, just close the dropdown
        setIsOpen(false);
        // You could emit a custom event or use context to open MessagePopup
        window.dispatchEvent(new CustomEvent('openMessagePopup', { 
          detail: { conversationId: notification.metadata?.conversationId || id } 
        }));
      } else if (type === "application") {
        // Navigate to applications page
        navigate("/dashboard/applications");
        setIsOpen(false);
      }
    } else {
      // Default: just close dropdown
      setIsOpen(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button onClick={toggleDropdown} className={styles.bellButton}>
        <Bell size={22} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h4>Notifications</h4>
            <button onClick={markAllRead} className={styles.markRead}>
              Mark all as read
            </button>
          </div>

          <div className={styles.list}>
            {loading ? (
              <p className={styles.empty}>Loading...</p>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => {
                const iconType = getNotificationIconType(notif.type);
                return (
                  <div
                    key={notif._id}
                    className={`${styles.item} ${!notif.read ? styles.new : ""}`}
                    onClick={() => handleNotificationClick(notif)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className={styles.iconWrapper}>
                      {iconType === "success" && <Check size={18} color="#4caf50" />}
                      {(iconType === "info" || notif.type === "new_message") && (
                        notif.type === "new_message" ? (
                          <MessageCircle size={18} color="#007bff" />
                        ) : (
                          <Bell size={18} color="#007bff" />
                        )
                      )}
                      {iconType === "view" && <Bell size={18} color="#03a9f4" />}
                    </div>
                    <div className={styles.text}>
                      <h5>{notif.title}</h5>
                      <p>{notif.message}</p>
                      <span className={styles.time}>{formatTime(notif.createdAt)}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif._id);
                      }}
                      className={styles.deleteBtn}
                      aria-label="Delete notification"
                      title="Delete notification"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })
            ) : (
              <p className={styles.empty}>No notifications</p>
            )}
          </div>

          {notifications.length > 0 && (
            <div className={styles.footer}>
              <button onClick={clearAll}>Clear all</button>
              <button>View all notifications</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationButton;