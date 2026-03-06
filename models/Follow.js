import mongoose from 'mongoose';

const followSchema = new mongoose.Schema({
  follower_id: { type: String, required: true },
  following_id: { type: String, required: true },
  status: { type: String, default: 'pending' },
}, { timestamps: true });

followSchema.index({ follower_id: 1, following_id: 1 }, { unique: true });

export default mongoose.model('Follow', followSchema);
