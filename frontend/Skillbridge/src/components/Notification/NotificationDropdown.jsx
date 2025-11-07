import React, { useState, useEffect, useRef } from "react";
import { FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom"; 
import styles from "./NotificationDropdown.module.css";

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Application Approved!",
      message:
        "Your application for 'Beach Cleanup Drive' has been approved. Check your dashboard for next steps.",
      time: "5 mins ago",
      unread: true,
    },
    {
      id: 2,
      title: "New Match Found",
      message:
        "We found a new opportunity that matches your skills: 'Community Garden Project'.",
      time: "2 hours ago",
      unread: true,
    },
    {
      id: 3,
      title: "Upcoming Event Reminder",
      message:
        "Your volunteering session for 'Teaching Assistant' starts tomorrow at 9:00 AM.",
      time: "5 hours ago",
      unread: true,
    },
  ]);

  const dropdownRef = useRef(null);
  const navigate = useNavigate(); 

  const toggleDropdown = () => setIsOpen(!isOpen);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleNotificationClick = (notification) => {
    // Mark that notification as read
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, unread: false } : n
      )
    );

    // Navigate to messages page (or your chat route)
    navigate("/messages", {
      state: { fromNotification: true, notification },
    });

    // Close dropdown
    setIsOpen(false);
  };

  return (
    <div className={styles.notificationWrapper} ref={dropdownRef}>
      {/* Bell Icon */}
      <div className={styles.iconContainer} onClick={toggleDropdown}>
        <FaBell className={styles.icon} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <span>Notifications</span>
            <button onClick={markAllAsRead}>Mark all as read</button>
          </div>

          <div className={styles.list}>
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`${styles.notification} ${
                  n.unread ? styles.unread : ""
                }`}
                onClick={() => handleNotificationClick(n)} 
              >
                <div className={styles.text}>
                  <h4>{n.title}</h4>
                  <p>{n.message}</p>
                  <small>{n.time}</small>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <button onClick={() => navigate("/notifications")}>
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;