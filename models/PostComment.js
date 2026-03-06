import mongoose from 'mongoose';

const postCommentSchema = new mongoose.Schema({
  post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  user_id: { type: String, required: true },
  content: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('PostComment', postCommentSchema);
