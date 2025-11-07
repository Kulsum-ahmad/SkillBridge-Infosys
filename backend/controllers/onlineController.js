import { activeUsers } from "../socket/socketHandler.js";

export const getOnlineUsers = async (req, res) => {
  try {
    // Return array of online user IDs
    const users = Array.from(activeUsers.keys());
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("❌ Get Online Users Error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error while fetching online users",
        error: error.message,
      });
  }
};
