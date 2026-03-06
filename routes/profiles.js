import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Profile from '../models/Profile.js';

const router = express.Router();

router.get('/search', requireAuth, async (req, res) => {
  try {
    const q = req.query.q || '';
    const userId = req.userId;
    if (!q.trim()) return res.json([]);

    const profiles = await Profile.find({
      id: { $ne: userId },
      $or: [
        { display_name: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } },
      ],
    }).limit(40).lean();

    res.json(profiles.map(p => ({ ...p, id: p.id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const profiles = await Profile.find({ id: { $ne: userId } }).limit(30).lean();
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const existing = await Profile.findOne({ id: userId });
    if (existing) return res.json(existing);

    const displayName = req.body.display_name || req.body.displayName || 'Traveler';
    const profile = await Profile.create({
      id: userId,
      display_name: displayName,
      interests: req.body.interests || [],
    });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const updates = { ...req.body };
    if (updates.displayName) { updates.display_name = updates.displayName; delete updates.displayName; }
    if (updates.upiId !== undefined) { updates.upi_id = updates.upiId || null; delete updates.upiId; }
    const profile = await Profile.findOneAndUpdate(
      { id: userId },
      { $set: updates, updated_at: new Date() },
      { new: true }
    );
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me/counts', requireAuth, async (req, res) => {
  try {
    const Trip = (await import('../models/Trip.js')).default;
    const Follow = (await import('../models/Follow.js')).default;
    const userId = req.userId;
    const [trips, followers, following] = await Promise.all([
      Trip.countDocuments({ user_id: userId }),
      Follow.countDocuments({ following_id: userId, status: 'accepted' }),
      Follow.countDocuments({ follower_id: userId, status: 'accepted' }),
    ]);
    res.json({ trips, followers, following });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ id: req.params.id });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
