import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    userType: { type: String, enum: ["ngo", "volunteer"], required: true },
    location: { type: String },

    
    organizationName: { type: String },
    organizationDescription: { type: String },
    websiteUrl: { type: String },

 
    skills: { type: String },
    
    // Password reset fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
