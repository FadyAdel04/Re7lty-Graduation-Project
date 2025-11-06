import { Router } from "express";
import { requireAuthStrict, clerkClient } from "../utils/auth";
import { User } from "../models/User";
import { Trip } from "../models/Trip";

const router = Router();

// Get current user (DB record, upsert from Clerk)
router.get('/me', requireAuthStrict, async (req, res) => {
  const clerkId = req.auth!.userId!;
  const u = await clerkClient.users.getUser(clerkId);
  const dbUser = await User.findOneAndUpdate(
    { clerkId },
    {
      $set: {
        email: u.primaryEmailAddress?.emailAddress,
        username: u.username,
        fullName: u.fullName || u.firstName || u.username,
        imageUrl: u.imageUrl,
      }
    },
    { upsert: true, new: true }
  );
  res.json(dbUser);
});

// Get current user's trips
router.get('/me/trips', requireAuthStrict, async (req, res) => {
  const clerkId = req.auth!.userId!;
  const trips = await Trip.find({ ownerId: clerkId }).sort({ postedAt: -1 });
  res.json(trips);
});

// Get trips by clerk user id
router.get('/:clerkId/trips', async (req, res) => {
  const { clerkId } = req.params;
  const trips = await Trip.find({ ownerId: clerkId }).sort({ postedAt: -1 });
  res.json(trips);
});

export default router;


