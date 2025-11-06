import { Router } from "express";
import { requireAuthOptional, requireAuthStrict } from "../utils/auth";
import { tripsStore } from "../store/tripsStore";

const router = Router();

// Public list
router.get('/', (_req, res) => {
  res.json(tripsStore.list());
});

// Public detail
router.get('/:id', (req, res) => {
  const trip = tripsStore.getById(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json(trip);
});

// Create (requires auth)
router.post('/', requireAuthStrict, (req, res) => {
  const userId = req.auth!.userId;
  const created = tripsStore.create({ ...req.body, ownerId: userId });
  res.status(201).json(created);
});

// Like (requires auth)
router.post('/:id/like', requireAuthStrict, (req, res) => {
  const updated = tripsStore.like(req.params.id);
  if (!updated) return res.status(404).json({ error: 'Trip not found' });
  res.json(updated);
});

export default router;


