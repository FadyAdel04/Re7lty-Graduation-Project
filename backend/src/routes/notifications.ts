import { Router } from "express";
import { requireAuthStrict, getAuth } from "../utils/auth";
import { Notification } from "../models/Notification";
import { formatNotificationPayload } from "../utils/notificationDispatcher";

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


