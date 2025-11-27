import { Router } from "express";
import { requireAuthStrict, getAuth, clerkClient } from "../utils/auth";
import { Notification } from "../models/Notification";
import { formatNotificationPayload, registerNotificationStream } from "../utils/notificationDispatcher";

const router = Router();

router.get('/', requireAuthStrict, async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { limit = '30' } = req.query as { limit?: string };
  const items = await Notification.find({ recipientId: userId })
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  res.json(items.map(formatNotificationPayload));
});

router.get('/stream', requireAuthStrict, (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  registerNotificationStream(userId, res);
  res.write('event: connected\n');
  res.write('data: {}\n\n');
});

router.post('/:id/read', requireAuthStrict, async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { id } = req.params;
  await Notification.updateOne({ _id: id, recipientId: userId }, { $set: { isRead: true } });
  res.json({ success: true });
});

router.post('/read-all', requireAuthStrict, async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  await Notification.updateMany({ recipientId: userId, isRead: false }, { $set: { isRead: true } });
  res.json({ success: true });
});

router.get('/unread-count', requireAuthStrict, async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const count = await Notification.countDocuments({ recipientId: userId, isRead: false });
  res.json({ count });
});

export default router;


