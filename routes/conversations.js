import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Conversation from '../models/Conversation.js';
import ConversationParticipant from '../models/ConversationParticipant.js';
import DirectMessage from '../models/DirectMessage.js';
import Profile from '../models/Profile.js';

const router = express.Router();

router.get('/unread-counts', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const participants = await ConversationParticipant.find({ user_id: userId }).lean();
    const byConversation = {};
    let total = 0;
    for (const p of participants) {
      const convId = p.conversation_id?.toString?.() || p.conversation_id;
      const lastRead = p.last_read_at ? new Date(p.last_read_at) : null;
      const q = { conversation_id: p.conversation_id, sender_id: { $ne: userId } };
      if (lastRead) q.createdAt = { $gt: lastRead };
      const count = await DirectMessage.countDocuments(q);
      byConversation[convId] = count;
      total += count;
    }
    res.json({ total, byConversation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/with/:otherUserId', requireAuth, async (req, res) => {
  try {
    const otherUserId = req.params.otherUserId;
    const myConvs = await ConversationParticipant.find({ user_id: req.userId })
      .select('conversation_id').lean();
    const myConvIds = myConvs.map(c => c.conversation_id);

    const shared = await ConversationParticipant.findOne({
      user_id: otherUserId,
      conversation_id: { $in: myConvIds },
    }).lean();

    if (shared) {
      return res.json({ conversation_id: shared.conversation_id.toString() });
    }

    const conv = await Conversation.create({ created_by: req.userId });
    await ConversationParticipant.insertMany([
      { conversation_id: conv._id, user_id: req.userId },
      { conversation_id: conv._id, user_id: otherUserId },
    ]);
    res.json({ conversation_id: conv._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    const part = await ConversationParticipant.findOne({
      conversation_id: req.params.id,
      user_id: req.userId,
    });
    if (!part) return res.status(403).json({ error: 'Not a participant' });

    const markRead = req.query.mark_read !== 'false';
    if (markRead) {
      await ConversationParticipant.updateOne(
        { _id: part._id },
        { $set: { last_read_at: new Date() } }
      );
    }

    const messages = await DirectMessage.find({ conversation_id: req.params.id })
      .sort({ createdAt: 1 }).lean();
    res.json(messages.map(m => ({
      id: m._id.toString(),
      sender_id: m.sender_id,
      content: m.content,
      created_at: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/messages', requireAuth, async (req, res) => {
  try {
    const part = await ConversationParticipant.findOne({
      conversation_id: req.params.id,
      user_id: req.userId,
    });
    if (!part) return res.status(403).json({ error: 'Not a participant' });

    const msg = await DirectMessage.create({
      conversation_id: req.params.id,
      sender_id: req.userId,
      content: req.body.content,
    });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
