import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  created_by: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('Conversation', conversationSchema);
