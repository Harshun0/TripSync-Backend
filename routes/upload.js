import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { uploadImage } from '../utils/cloudinary.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/profile/:type', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const type = req.params.type;
    if (!['avatar', 'cover'].includes(type)) return res.status(400).json({ error: 'Invalid type' });

    const ext = req.file.originalname.split('.').pop() || 'jpg';
    const userId = req.userId;
    const publicId = `${userId}/${type}-${Date.now()}.${ext}`;
    const url = await uploadImage(req.file.buffer, 'profile-media', publicId);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/post', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const ext = req.file.originalname.split('.').pop() || 'jpg';
    const userId = req.userId;
    const publicId = `${userId}/${Date.now()}.${ext}`;
    const url = await uploadImage(req.file.buffer, 'post-media', publicId);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
