// src/components/profile/ImageUpload.jsx
import { useState, useRef, useEffect } from "react";
import { Upload, X, User } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import styles from "./ImageUpload.module.css";
import api from "../api";

export function ImageUpload({ currentImage, onImageChange, label }) {
  const [preview, setPreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Helper function to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("data:")) return imagePath;
    return `http://localhost:5000${imagePath}`;
  };

  // Update preview when currentImage changes
  useEffect(() => {
    setPreview(getImageUrl(currentImage));
  }, [currentImage]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPEG, PNG, or GIF)");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to backend
    const formData = new FormData();
    formData.append("image", file);

    try {
      setIsUploading(true);
      const res = await api.post("/profile/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      // Update with server URL
      const serverImageUrl = getImageUrl(res.data.imageUrl);
      setPreview(serverImageUrl);
      onImageChange(res.data.imageUrl); // Pass backend path to parent
      
      toast.success("Image uploaded successfully!");
    } catch (err) {
      console.error("Image upload failed:", err);
      toast.error(err.response?.data?.message || "Failed to upload image");
      setPreview(getImageUrl(currentImage)); // Revert to original
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview("");
    onImageChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success("Image removed");
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>
      <div className={styles.contentWrapper}>
        <div className={styles.imageWrapper}>
          <div className={styles.imagePlaceholder}>
            {preview ? (
              <img 
                src={preview} 
                alt="Preview" 
                className={styles.imagePreview}
                onError={(e) => {
                  console.error("Image load error:", e);
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <User className={styles.defaultIcon} />
            )}
          </div>
          {preview && (
            <button type="button" onClick={handleRemove} className={styles.removeButton}>
              <X className={styles.removeIcon} />
            </button>
          )}
        </div>

        <div className={styles.uploadArea}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            onChange={handleFileChange}
            className={styles.hiddenInput}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className={styles.uploadButton}
            disabled={isUploading}
          >
            <Upload className={styles.uploadIcon} />
            {isUploading ? "Uploading..." : "Upload Image"}
          </Button>
          <p className={styles.hintText}>JPG, PNG or GIF. Max 5MB.</p>
        </div>
      </div>
    </div>
  );
}