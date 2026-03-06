import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  conversation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatConversation', required: true },
  role: { type: String, required: true },
  content: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('ChatMessage', chatMessageSchema);
