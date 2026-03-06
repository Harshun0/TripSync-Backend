import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Follow from '../models/Follow.js';
import Profile from '../models/Profile.js';
import Notification from '../models/Notification.js';

const router = express.Router();

router.get('/status', requireAuth, async (req, res) => {
  try {
    const ids = (req.query.ids || '').split(',').filter(Boolean);
    if (ids.length === 0) return res.json({});
    const follows = await Follow.find({
      follower_id: req.userId,
      following_id: { $in: ids },
    }).lean();
    const map = {};
    follows.forEach(f => { map[f.following_id] = f.status; });
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { following_id } = req.body;
    if (!following_id || following_id === req.userId) {
      return res.status(400).json({ error: 'Invalid following_id' });
    }
    const existing = await Follow.findOne({ follower_id: req.userId, following_id });
    if (existing) return res.json(existing);

    const follow = await Follow.create({
      follower_id: req.userId,
      following_id,
      status: 'pending',
    });
    await Notification.create({
      user_id: following_id,
      actor_id: req.userId,
      entity_id: follow._id.toString(),
      entity_type: 'follow_request',
      type: 'follow_request',
      title: 'New trip-mate request',
      body: 'Someone wants to connect with you as a travel buddy.',
    });
    res.json(follow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/', requireAuth, async (req, res) => {
  try {
    const { following_id } = req.query;
    await Follow.deleteOne({ follower_id: req.userId, following_id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/accept', requireAuth, async (req, res) => {
  try {
    const updated = await Follow.findOneAndUpdate(
      { _id: req.params.id, following_id: req.userId },
      { status: 'accepted' },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/reject', requireAuth, async (req, res) => {
  try {
    await Follow.updateOne({ _id: req.params.id }, { status: 'rejected' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/incoming', requireAuth, async (req, res) => {
  try {
    const follows = await Follow.find({
      following_id: req.userId,
      status: { $in: ['pending', 'accepted'] },
    }).lean();
    const followerIds = follows.map(f => f.follower_id);
    const profiles = await Profile.find({ id: { $in: followerIds } }).lean();
    const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
    const result = follows.map(f => ({
      ...f,
      id: f._id.toString(),
      created_at: f.createdAt ? new Date(f.createdAt).toISOString() : null,
      profiles: profileMap[f.follower_id] ? { display_name: profileMap[f.follower_id].display_name, avatar_url: profileMap[f.follower_id].avatar_url } : null,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/accepted', requireAuth, async (req, res) => {
  try {
    const follows = await Follow.find({ status: 'accepted' }).or([
      { follower_id: req.userId },
      { following_id: req.userId },
    ]).lean();
    res.json(follows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
