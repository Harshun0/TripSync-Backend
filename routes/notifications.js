import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Notification from '../models/Notification.js';
import Profile from '../models/Profile.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json(notifications.map(n => ({
      ...n,
      id: n._id.toString(),
      created_at: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/read-all', requireAuth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user_id: req.userId, is_read: false },
      { is_read: true }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
