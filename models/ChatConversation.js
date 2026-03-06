import mongoose from 'mongoose';

const chatConversationSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  title: { type: String, default: 'New chat' },
}, { timestamps: true });

export default mongoose.model('ChatConversation', chatConversationSchema);
