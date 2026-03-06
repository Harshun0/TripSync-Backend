import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Post from '../models/Post.js';
import PostLike from '../models/PostLike.js';
import PostComment from '../models/PostComment.js';
import SavedPost from '../models/SavedPost.js';
import Profile from '../models/Profile.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const posts = await Post.find().sort({ created_at: -1 }).limit(50).lean();
    const postIds = posts.map(p => p._id);
    const authorIds = [...new Set(posts.map(p => p.user_id))];

    const [likes, comments, saved, profiles] = await Promise.all([
      PostLike.find({ post_id: { $in: postIds } }).lean(),
      PostComment.find({ post_id: { $in: postIds } }).lean(),
      SavedPost.find({ post_id: { $in: postIds }, user_id: userId }).lean(),
      Profile.find({ id: { $in: authorIds } }).lean(),
    ]);

    const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
    const likeCountMap = {};
    const likedByMe = new Set();
    likes.forEach(l => {
      const pid = l.post_id?.toString();
      likeCountMap[pid] = (likeCountMap[pid] || 0) + 1;
      if (l.user_id === userId) likedByMe.add(pid);
    });
    const commentCountMap = {};
    comments.forEach(c => {
      const pid = c.post_id?.toString();
      commentCountMap[pid] = (commentCountMap[pid] || 0) + 1;
    });
    const savedSet = new Set(saved.map(s => s.post_id?.toString()));

    const result = posts.map(p => {
      const pid = p._id.toString();
      const author = profileMap[p.user_id];
      return {
        id: pid,
        user_id: p.user_id,
        caption: p.caption,
        media_url: p.media_url,
        location: p.location,
        created_at: p.created_at,
        profiles: author ? { display_name: author.display_name, avatar_url: author.avatar_url, location: author.location } : null,
        _likeCount: likeCountMap[pid] || 0,
        _commentCount: commentCountMap[pid] || 0,
        _liked: likedByMe.has(pid),
        _saved: savedSet.has(pid),
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const post = await Post.create({
      user_id: userId,
      caption: req.body.caption,
      location: req.body.location || null,
      media_url: req.body.media_url || null,
      is_public: req.body.is_public !== false,
    });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/like', async (req, res) => {
  try {
    const userId = req.userId || 'demo-user';
    await PostLike.findOneAndUpdate(
      { post_id: req.params.id, user_id: userId },
      { $setOnInsert: { post_id: req.params.id, user_id: userId } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/like', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    await PostLike.deleteOne({ post_id: req.params.id, user_id: userId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/save', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    await SavedPost.findOneAndUpdate(
      { post_id: req.params.id, user_id: userId },
      { $setOnInsert: { post_id: req.params.id, user_id: userId } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/save', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    await SavedPost.deleteOne({ post_id: req.params.id, user_id: userId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const comment = await PostComment.create({
      post_id: req.params.id,
      user_id: userId,
      content: req.body.content,
    });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
