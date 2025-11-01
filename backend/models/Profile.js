import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  image: { type: String, default: '' },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  bio: { type: String, default: '' }, // Changed: Allow empty initially
  skills: [{ type: String }],
  experience: { type: String, default: '' },
  availability: { type: String, default: '' },
  organization: { type: String, default: '' },
  website: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Profile', profileSchema);