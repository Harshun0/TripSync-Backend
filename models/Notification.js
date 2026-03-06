import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  actor_id: String,
  entity_id: String,
  entity_type: String,
  type: { type: String, required: true },
  title: { type: String, required: true },
  body: String,
  is_read: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
