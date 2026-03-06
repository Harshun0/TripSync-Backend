import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  destination: { type: String, required: true },
  description: String,
  start_date: Date,
  end_date: Date,
  budget: { type: Number, default: 0 },
  max_people: { type: Number, default: 10 },
  current_people: { type: Number, default: 1 },
  interests: { type: [String], default: [] },
  status: { type: String, default: 'planning' },
  is_public: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Trip', tripSchema);
