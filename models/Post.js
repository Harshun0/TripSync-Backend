import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  caption: String,
  media_url: String,
  location: String,
  is_public: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Post', postSchema);
