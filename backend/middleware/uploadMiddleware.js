import multer from "multer";
import path from "path";
import fs from "fs";

// ======================================================
// 🗂️ Define upload directories
// ======================================================
const baseUploadDir = path.join(process.cwd(), "uploads");
const imageDir = path.join(baseUploadDir, "images");
const resumeDir = path.join(baseUploadDir, "resumes");

// ✅ Ensure all directories exist
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
};

ensureDir(baseUploadDir);
ensureDir(imageDir);
ensureDir(resumeDir);

// ======================================================
// ⚙️ Configure Multer Storage
// ======================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "image") cb(null, imageDir);
    else if (file.fieldname === "resume") cb(null, resumeDir);
    else cb(null, baseUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// ======================================================
// 🧩 File Filter (Images + Docs only)
// ======================================================
const fileFilter = (req, file, cb) => {
  const allowedImages = /\.(jpeg|jpg|png|webp|gif)$/i;
  const allowedDocs = /\.(pdf|doc|docx)$/i;

  if (allowedImages.test(file.originalname) || allowedDocs.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error("❌ Only image or document files (PDF/DOC/DOCX) are allowed!"));
  }
};

// ======================================================
// 📦 Initialize Multer
// ======================================================
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
});

// ======================================================
// 🚀 Export Upload Handlers
// ======================================================
export const uploadImage = upload.single("image");
export const uploadResume = upload.single("resume");

export default upload;
