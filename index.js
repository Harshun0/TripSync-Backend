import './env.js';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';

import profilesRouter from './routes/profiles.js';
import postsRouter from './routes/posts.js';
import followsRouter from './routes/follows.js';
import conversationsRouter from './routes/conversations.js';
import chatRouter from './routes/chat.js';
import notificationsRouter from './routes/notifications.js';
import tripsRouter from './routes/trips.js';
import expensesRouter from './routes/expenses.js';
import reviewsRouter from './routes/reviews.js';
import uploadRouter from './routes/upload.js';
import aiRouter from './routes/ai.js';

await connectDB();

const app = express();
// Support multiple origins: set CORS_ORIGIN to comma-separated list, e.g. "http://localhost:8080,https://tripssync.vercel.app"
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:8080';
const allowedOrigins = corsOrigin.split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, origin || allowedOrigins[0]);
    else cb(null, false);
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/profiles', profilesRouter);
app.use('/api/posts', postsRouter);
app.use('/api/follows', followsRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api', aiRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
