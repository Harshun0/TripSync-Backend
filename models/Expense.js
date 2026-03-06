import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  created_by: { type: String, required: true },
  paid_by: { type: String, required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  trip_id: mongoose.Schema.Types.ObjectId,
  split_with: { type: [String], default: [] },
  status: { type: String, default: 'pending' },
  payment_method: String,
  payment_link: String,
  upi_id: String,
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema);
