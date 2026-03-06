import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  reviewer_id: { type: String, required: true },
  reviewee_id: { type: String, required: true },
  trip_id: mongoose.Schema.Types.ObjectId,
  rating: { type: Number, required: true, min: 1, max: 5 },
  content: String,
}, { timestamps: true });

export default mongoose.model('Review', reviewSchema);
