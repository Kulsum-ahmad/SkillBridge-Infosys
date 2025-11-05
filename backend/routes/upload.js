import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// ✅ Absolute upload directories (from project root)
const __dirname = process.cwd();
const uploadBase = path.join(__dirname, "uploads");
const imageDir = path.join(uploadBase, "images");
const resumeDir = path.join(uploadBase, "resumes");

// ✅ Ensure upload folders exist
if (!fs.existsSync(uploadBase)) fs.mkdirSync(uploadBase);
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir);
if (!fs.existsSync(resumeDir)) fs.mkdirSync(resumeDir);

// ✅ Multer storage config (dynamic folder selection)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "image") cb(null, imageDir);
    else if (file.fieldname === "resume") cb(null, resumeDir);
    else cb(null, uploadBase);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// ✅ File filters
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) cb(null, true);
  else cb(new Error("Only image files (jpeg, jpg, png, webp) are allowed!"), false);
};

const resumeFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) cb(null, true);
  else cb(new Error("Only PDF, DOC, or DOCX files are allowed!"), false);
};

// ✅ Separate upload handlers
const uploadImage = multer({ storage, fileFilter: imageFilter });
const uploadResume = multer({ storage, fileFilter: resumeFilter });

// ✅ POST /upload-image
router.post("/upload-image", uploadImage.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No image uploaded" });
  const imageUrl = `/uploads/images/${req.file.filename}`;
  res.json({ imageUrl });
});

// ✅ POST /upload-resume
router.post("/upload-resume", uploadResume.single("resume"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No resume uploaded" });
  const resumeUrl = `/uploads/resumes/${req.file.filename}`;
  res.json({ resumeUrl });
});

// ✅ Error handler for Multer validation
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
