import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import { initializeSocket } from "./socket/socketHandler.js";

// 🛠️ Import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import opportunityRoutes from "./routes/opportunity.routes.js";
import uploadRoutes from "./routes/upload.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

// 📍 Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🌿 Load environment variables & connect DB
dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize socket handlers
initializeSocket(io);

// 📁 Ensure "uploads" folder structure exists
const uploadBase = path.join(__dirname, "uploads");
const imageDir = path.join(uploadBase, "images");
const resumeDir = path.join(uploadBase, "resumes");

[uploadBase, imageDir, resumeDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// 🌐 Enable CORS for frontend connections
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options("*", cors());

// 🧩 JSON Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve uploaded files (PDFs, resumes, images)
app.use("/uploads", express.static(uploadBase));

// 🚏 API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

// 🏠 Root API route
app.get("/", (req, res) => {
  res.send("🌍 SkillBridge API is running successfully...");
});

// ⚠️ Handle invalid routes (after all routes & static)
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📂 Static files served from: ${uploadBase}`);
  console.log(`🔌 Socket.IO server initialized`);
});
