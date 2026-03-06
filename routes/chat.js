import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import ChatConversation from '../models/ChatConversation.js';
import ChatMessage from '../models/ChatMessage.js';

const router = express.Router();

router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const convos = await ChatConversation.find({ user_id: req.userId })
      .sort({ updated_at: -1 }).lean();
    res.json(convos.map(c => ({
      id: c._id.toString(),
      title: c.title,
      updated_at: c.updated_at,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const convo = await ChatConversation.findOne({ _id: req.params.id, user_id: req.userId });
    if (!convo) return res.status(404).json({ error: 'Not found' });

    const messages = await ChatMessage.find({ conversation_id: req.params.id })
      .sort({ created_at: 1 }).lean();
    res.json(messages.map(m => ({
      id: m._id.toString(),
      role: m.role,
      content: m.content,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/conversations', requireAuth, async (req, res) => {
  try {
    const convo = await ChatConversation.create({
      user_id: req.userId,
      title: req.body.title || 'New Chat',
    });
    res.json({ id: convo._id.toString(), title: convo.title, updated_at: convo.updated_at });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/conversations/:id', requireAuth, async (req, res) => {
  try {
    const convo = await ChatConversation.findOne({ _id: req.params.id, user_id: req.userId });
    if (!convo) return res.status(404).json({ error: 'Not found' });
    await ChatConversation.deleteOne({ _id: req.params.id });
    await ChatMessage.deleteMany({ conversation_id: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const convo = await ChatConversation.findOne({ _id: req.params.id, user_id: req.userId });
    if (!convo) return res.status(404).json({ error: 'Not found' });

    const msg = await ChatMessage.create({
      conversation_id: req.params.id,
      role: req.body.role,
      content: req.body.content,
    });
    await ChatConversation.updateOne(
      { _id: req.params.id },
      { updated_at: new Date(), title: req.body.title || convo.title }
    );
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/conversations/:id', requireAuth, async (req, res) => {
  try {
    const convo = await ChatConversation.findOneAndUpdate(
      { _id: req.params.id, user_id: req.userId },
      { $set: { title: req.body.title, updated_at: new Date() } },
      { new: true }
    );
    if (!convo) return res.status(404).json({ error: 'Not found' });
    res.json(convo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
