import React, { useState } from "react";
import { MessageCircle, X, ArrowLeft, Send } from "lucide-react";

export default function MessagePopup() {
  const [open, setOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState("");

  // Example chats
  const messages = [
    {
      id: 1,
      name: "Green Future NGO",
      type: "Organization",
      preview: "Thank you for your interest in our Beach Cleanup project!",
      time: "2m ago",
      unread: 2,
      chat: [
        { sender: "ngo", text: "Hello! Thank you for applying to our Beach Cleanup Drive.", time: "10:30 AM" },
        { sender: "user", text: "Thank you! I'm very excited about this opportunity.", time: "10:32 AM" },
        { sender: "ngo", text: "We'd love to have you on board. The event is scheduled for next Saturday. Can you confirm your availability?", time: "10:35 AM" },
        { sender: "user", text: "Yes, I can definitely make it! What should I bring?", time: "10:36 AM" },
      ],
    },
    {
      id: 2,
      name: "Sarah Chen",
      type: "Volunteer Coordinator",
      preview: "Your application has been reviewed",
      time: "1h ago",
      unread: 0,
      chat: [
        { sender: "ngo", text: "Hi! Your application looks great.", time: "9:10 AM" },
        { sender: "user", text: "Thank you so much!", time: "9:12 AM" },
      ],
    },
  ];

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
      height: "450px",
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
    },
    messageLeft: { flex: 1, marginRight: "8px" },
    messageName: { fontWeight: "600", fontSize: "14px", color: "#111827" },
    messageType: { fontSize: "12px", color: "#6b7280", marginBottom: "4px" },
    messagePreview: { fontSize: "13px", color: "#374151" },
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
  };

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedChat) {
      const newChat = [...selectedChat.chat, { sender: "user", text: messageInput, time: "Now" }];
      setSelectedChat({ ...selectedChat, chat: newChat });
      setMessageInput("");
    }
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
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <ArrowLeft
                    size={20}
                    onClick={() => setSelectedChat(null)}
                    style={{ cursor: "pointer" }}
                  />
                  <div>
                    {selectedChat.name}
                    <div style={{ fontSize: "12px", fontWeight: "normal" }}>
                      {selectedChat.type}
                    </div>
                  </div>
                </div>
                <X size={18} onClick={() => setOpen(false)} style={{ cursor: "pointer" }} />
              </>
            ) : (
              <>
                <span>Messages</span>
                <X size={18} onClick={() => setOpen(false)} style={{ cursor: "pointer" }} />
              </>
            )}
          </div>

          {/* Message list */}
          {!selectedChat && (
            <div style={styles.messageList}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={styles.messageItem}
                  onClick={() => setSelectedChat(msg)}
                >
                  <div style={styles.messageLeft}>
                    <div style={styles.messageName}>{msg.name}</div>
                    <div style={styles.messageType}>{msg.type}</div>
                    <div style={styles.messagePreview}>{msg.preview}</div>
                  </div>
                  <div>
                    <div style={styles.time}>{msg.time}</div>
                    {msg.unread > 0 && <div style={styles.unreadBadge}>{msg.unread}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chat window */}
          {selectedChat && (
            <>
              <div style={styles.chatBody}>
                {selectedChat.chat.map((c, index) => (
                  <div
                    key={index}
                    style={{
                      ...styles.chatMessage,
                      ...(c.sender === "ngo" ? styles.ngoMessage : styles.userMessage),
                    }}
                  >
                    {c.text}
                    <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "4px" }}>
                      {c.time}
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.inputBox}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
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
