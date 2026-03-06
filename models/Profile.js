import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  display_name: { type: String, default: 'Traveler' },
  bio: String,
  location: String,
  avatar_url: String,
  cover_url: String,
  budget: String,
  personality: String,
  interests: { type: [String], default: [] },
  phone: String,
  upi_id: String,
  username: String,
  profile_visibility: { type: String, default: 'public' },
  notifications_enabled: { type: Boolean, default: true },
  dark_mode: { type: Boolean, default: false },
}, { timestamps: true });

profileSchema.index({ display_name: 'text', location: 'text', bio: 'text' });

export default mongoose.model('Profile', profileSchema);
