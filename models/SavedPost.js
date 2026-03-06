import mongoose from 'mongoose';

const savedPostSchema = new mongoose.Schema({
  post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  user_id: { type: String, required: true },
}, { timestamps: true });

savedPostSchema.index({ post_id: 1, user_id: 1 }, { unique: true });

export default mongoose.model('SavedPost', savedPostSchema);
