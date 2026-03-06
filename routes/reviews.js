import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Review from '../models/Review.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const revieweeId = req.query.reviewee_id;
    const reviews = await Review.find({ reviewee_id: revieweeId })
      .sort({ created_at: -1 })
      .lean();
    res.json(reviews.map(r => ({ ...r, id: r._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const review = await Review.create({
      reviewer_id: req.userId,
      reviewee_id: req.body.reviewee_id,
      trip_id: req.body.trip_id || null,
      rating: req.body.rating,
      content: req.body.content || null,
    });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
