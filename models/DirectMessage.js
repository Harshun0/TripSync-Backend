import mongoose from 'mongoose';

const directMessageSchema = new mongoose.Schema({
  conversation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender_id: { type: String, required: true },
  content: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('DirectMessage', directMessageSchema);
