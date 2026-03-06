import express from 'express';
import Razorpay from 'razorpay';
import { requireAuth } from '../middleware/auth.js';
import Expense from '../models/Expense.js';
import Profile from '../models/Profile.js';
import Follow from '../models/Follow.js';
import Notification from '../models/Notification.js';

const router = express.Router();

function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const expenses = await Expense.find({
      $or: [
        { paid_by: userId },
        { split_with: userId },
      ],
    })
      .sort({ created_at: -1 })
      .limit(50)
      .lean();
    res.json(expenses.map(e => ({
      ...e,
      id: e._id.toString(),
      paid_by: e.paid_by,
      split_with: Array.isArray(e.split_with) ? e.split_with : [],
      amount: Number(e.amount) || 0,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/friends', requireAuth, async (req, res) => {
  try {
    const follows = await Follow.find({ status: 'accepted' }).or([
      { follower_id: req.userId },
      { following_id: req.userId },
    ]).lean();
    const friendIds = [...new Set(follows.map(f =>
      f.follower_id === req.userId ? f.following_id : f.follower_id
    ))];
    const profiles = await Profile.find({ id: { $in: friendIds } })
      .select('id display_name')
      .lean();
    res.json(profiles.map(p => ({ id: p.id, name: p.display_name })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const splitWith = Array.isArray(req.body.split_with) ? req.body.split_with : [];
    const expense = await Expense.create({
      created_by: req.userId,
      paid_by: req.body.paid_by || req.userId,
      title: req.body.title,
      amount: Number(req.body.amount) || 0,
      split_with: splitWith,
      status: 'pending',
      payment_method: req.body.payment_method || 'upi',
    });
    const obj = expense.toObject();
    res.json({
      ...obj,
      id: expense._id.toString(),
      split_with: Array.isArray(obj.split_with) ? obj.split_with : [],
      amount: Number(obj.amount) || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/create-order', requireAuth, async (req, res) => {
  try {
    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(503).json({ error: 'Razorpay not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to server .env' });
    }
    const rawAmount = req.body?.amount;
    const amount = Math.round(Number(rawAmount) || 0);
    if (amount < 1) {
      return res.status(400).json({
        error: 'Amount must be at least ₹1. Send a number in the request body, e.g. { "amount": 250 }. Received: ' + JSON.stringify(rawAmount),
      });
    }
    const amountPaise = Math.min(amount * 100, 5000000);
    const receipt = `expense-${String(req.userId).replace(/\|/g, '-')}-${Date.now()}`;
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
    });
    res.json({ orderId: order.id, amount: order.amount });
  } catch (err) {
    const status = err?.statusCode ?? err?.status ?? 500;
    const razorpayError = err?.error;
    const msg =
      (typeof razorpayError === 'string' && razorpayError) ||
      (razorpayError && typeof razorpayError.description === 'string' && razorpayError.description) ||
      err?.message ||
      (razorpayError && String(razorpayError)) ||
      'Razorpay order failed';
    console.error('[create-order]', status, msg, err?.error || err);
    res.status(typeof status === 'number' && status >= 400 ? status : 500).json({ error: msg });
  }
});

router.patch('/:id/mark-paid', requireAuth, async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    expense.status = 'paid';
    await expense.save();
    res.json({ ...expense.toObject(), id: expense._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reminders', requireAuth, async (req, res) => {
  try {
    let rows = Array.isArray(req.body) ? req.body : req.body.notifications || [];
    if (!rows.length && req.body.target_ids) {
      rows = req.body.target_ids.map(id => ({
        user_id: id,
        actor_id: req.userId,
        type: 'expense_reminder',
        title: 'Expense reminder',
        body: req.body.message || 'Please settle pending trip expenses.',
        entity_type: 'expense',
      }));
    }
    rows = rows.map(r => ({ ...r, actor_id: r.actor_id || req.userId }));
    if (rows.length) await Notification.insertMany(rows);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
