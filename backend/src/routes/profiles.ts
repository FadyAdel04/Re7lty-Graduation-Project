import { Router } from "express";
import { requireAuthOptional, requireAuthStrict, clerkClient } from "../utils/auth";
import { profilesStore } from "../store/profilesStore";

const router = Router();

// Get current user's profile (requires auth)
router.get('/me', requireAuthStrict, async (req, res) => {
  const userId = req.auth!.userId;
  const profile = await profilesStore.getOrHydrateFromClerk(userId);
  res.json(profile);
});

// Update current user's profile (requires auth)
router.patch('/me', requireAuthStrict, async (req, res) => {
  const userId = req.auth!.userId;
  const updated = await profilesStore.update(userId, req.body || {});
  res.json(updated);
});

// Public profile by username (fallback to Clerk if exists)
router.get('/:username', async (req, res) => {
  const username = decodeURIComponent(req.params.username);
  const profile = await profilesStore.getByUsername(username);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json(profile);
});

export default router;


