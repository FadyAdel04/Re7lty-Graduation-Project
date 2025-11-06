import { Router } from "express";
import { requireAuthStrict } from "../utils/auth";
import { Trip } from "../models/Trip";

const router = Router();

// Public list
router.get('/', async (req, res) => {
  const { q, city, sort = 'recent', page = '1', limit = '20' } = req.query as any;
  const filter: any = {};
  if (q) filter.title = { $regex: String(q), $options: 'i' };
  if (city) filter.city = String(city);
  const skip = (Number(page) - 1) * Number(limit);
  const sortObj = sort === 'likes' ? { likes: -1 } : { postedAt: -1 };
  const [items, total] = await Promise.all([
    Trip.find(filter).sort(sortObj).skip(skip).limit(Number(limit)),
    Trip.countDocuments(filter)
  ]);
  res.json({ items, total, page: Number(page), limit: Number(limit) });
});

// Public detail
router.get('/:id', async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json(trip);
});

// Create (requires auth)
router.post('/', requireAuthStrict, async (req, res) => {
  const userId = req.auth!.userId;
  const created = await Trip.create({ ...req.body, ownerId: userId });
  res.status(201).json(created);
});

// Like (requires auth)
router.post('/:id/like', requireAuthStrict, async (req, res) => {
  const updated = await Trip.findByIdAndUpdate(
    req.params.id,
    { $inc: { likes: 1, weeklyLikes: 1 } },
    { new: true }
  );
  if (!updated) return res.status(404).json({ error: 'Trip not found' });
  res.json(updated);
});

export default router;


