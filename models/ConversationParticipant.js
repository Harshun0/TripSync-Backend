import mongoose from 'mongoose';

const conversationParticipantSchema = new mongoose.Schema({
  conversation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  user_id: { type: String, required: true },
  last_read_at: { type: Date, default: null },
}, { timestamps: true });

conversationParticipantSchema.index({ conversation_id: 1, user_id: 1 }, { unique: true });

export default mongoose.model('ConversationParticipant', conversationParticipantSchema);
