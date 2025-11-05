import Profile from '../models/Profile.js';
import User from '../models/User.js';

// Get current user's profile
export const getProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id }).populate('user', 'email userType location fullName');

    if (!profile) {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Create a profile with data from registration
      profile = await Profile.create({
        user: req.user.id,
        name: user.fullName || '',
        email: user.email || '',
        phone: '',
        bio: '',
        image: '',
        location: user.location || '',
        skills: user.skills ? user.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        experience: '',
        availability: '',
        organization: user.organizationName || '',
        website: user.websiteUrl || ''
      });
      
      // Populate after creation
      profile = await Profile.findById(profile._id).populate('user', 'email userType location fullName');
    }

    // Sync location from User model if missing in profile
    if (!profile.location && profile.user?.location) {
      profile.location = profile.user.location;
      await profile.save();
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update profile
export const updateProfile = async (req, res) => {
  try {
    const {
      image,
      name,
      email,
      phone,
      location,
      bio,
      skills,
      experience,
      availability,
      organization,
      website
    } = req.body;

    // Validation
    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'Name, email, and phone are required' });
    }

    if (bio && bio.length < 50) {
      return res.status(400).json({ message: 'Bio must be at least 50 characters long' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const phoneRegex = /^\+?[\d\s\-()]+$/;
    if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    const updateData = {
      name,
      email,
      phone,
      bio: bio || '',
      location: location || '',
      skills: Array.isArray(skills) ? skills : [],
      experience: experience || '',
      availability: availability || '',
      organization: organization || '',
      website: website || ''
    };

    if (image !== undefined) updateData.image = image;

    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $set: updateData },
      { new: true, runValidators: false } // Disable validation to allow empty bio during editing
    ).populate('user', 'email userType location fullName');

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Sync location to User model if updated
    if (location && location !== profile.user.location) {
      await User.findByIdAndUpdate(req.user.id, { location });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get profile by user ID
export const getProfileByUserId = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId }).populate('user', 'email userType location fullName');
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.status(200).json(profile);
  } catch (error) {
    console.error('Get profile by user ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete profile
export const deleteProfile = async (req, res) => {
  try {
    const profile = await Profile.findOneAndDelete({ user: req.user.id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.status(200).json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};