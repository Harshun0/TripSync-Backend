import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Trip from '../models/Trip.js';

const router = express.Router();

router.get('/count', requireAuth, async (req, res) => {
  try {
    const count = await Trip.countDocuments({ user_id: req.userId });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const trip = await Trip.create({
      user_id: req.userId,
      destination: req.body.destination,
      start_date: req.body.start_date || null,
      end_date: req.body.end_date || null,
      budget: parseFloat(req.body.budget) || 0,
      max_people: parseInt(req.body.max_people) || 1,
      description: req.body.description || null,
      interests: req.body.interests || [],
      status: 'planning',
    });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
