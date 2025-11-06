import { Router } from "express";
import { requireAuthStrict, clerkClient } from "../utils/auth";
import { Profile } from "../models/Profile";

const router = Router();

// Get current user's profile (requires auth)
router.get('/me', requireAuthStrict, async (req, res) => {
  const userId = req.auth!.userId!;
  let profile = await Profile.findOne({ userId });
  if (!profile) {
    const user = await clerkClient.users.getUser(userId);
    profile = await Profile.create({
      userId,
      username: user.username,
      fullName: user.fullName || user.firstName || user.username,
      bio: (user.publicMetadata as any)?.bio || null,
      location: (user.publicMetadata as any)?.location || null,
      imageUrl: user.imageUrl,
      coverImage: (user.publicMetadata as any)?.coverImage || null,
    });
  }
  res.json(profile);
});

// Update current user's profile (requires auth)
router.patch('/me', requireAuthStrict, async (req, res) => {
  const userId = req.auth!.userId!;
  const { bio, location, coverImage, fullName } = req.body || {};
  const updated = await Profile.findOneAndUpdate(
    { userId },
    { $set: { bio, location, coverImage, ...(fullName ? { fullName } : {}) } },
    { new: true, upsert: true }
  );
  await clerkClient.users.updateUser(userId, {
    publicMetadata: {
      ...(bio !== undefined ? { bio } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(coverImage !== undefined ? { coverImage } : {}),
    },
    ...(fullName ? { firstName: fullName } : {}),
  } as any);
  res.json(updated);
});

// Public profile by username (fallback to Clerk if exists)
router.get('/:username', async (req, res) => {
  const username = decodeURIComponent(req.params.username);
  const profile = await Profile.findOne({ username });
  if (profile) return res.json(profile);
  const list = await clerkClient.users.getUserList({ username: [username] });
  if (!list?.data?.length) return res.status(404).json({ error: 'Profile not found' });
  const u = list.data[0];
  return res.json({
    userId: u.id,
    username: u.username,
    fullName: u.fullName || u.firstName || u.username,
    bio: (u.publicMetadata as any)?.bio || null,
    location: (u.publicMetadata as any)?.location || null,
    imageUrl: u.imageUrl,
    coverImage: (u.publicMetadata as any)?.coverImage || null,
    stats: { trips: 0, followers: 0, following: 0, likes: 0 },
  });
});

export default router;


