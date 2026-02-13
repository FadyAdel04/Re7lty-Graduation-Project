import { Router } from "express";
import mongoose from "mongoose";
import { requireAuthStrict, getAuth, clerkClient } from "../utils/auth";
import { User } from "../models/User";
import { Trip } from "../models/Trip";
import { TripLove } from "../models/TripLove";
import { TripSave } from "../models/TripSave";
import { formatTripMedia } from "../utils/tripFormatter";
import { createNotification } from "../utils/notificationDispatcher";
import { Follow } from "../models/Follow";

const router = Router();


/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         clerkId:
 *           type: string
 *           description: The user's Clerk ID
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         fullName:
 *           type: string
 *         imageUrl:
 *           type: string
 *         bio:
 *           type: string
 *         location:
 *           type: string
 *         followers:
 *           type: integer
 *         following:
 *           type: integer
 *         totalLikes:
 *           type: integer
 *         tripsCount:
 *           type: integer
 */

async function formatTripsForResponse(tripDocs: any[], req: any, viewerId?: string | null) {
  const docs = tripDocs.filter(Boolean);
  if (!docs.length) return [];

  const tripIds = docs.map((trip: any) => trip?._id).filter(Boolean);
  const ownerIds = docs.map((trip: any) => trip?.ownerId).filter(Boolean);

  let lovedSet = new Set<string>();
  let savedSet = new Set<string>();
  let followingSet = new Set<string>();

  if (viewerId) {
    const [loveDocs, saveDocs, followDocs] = await Promise.all([
      tripIds.length
        ? TripLove.find({ userId: viewerId, tripId: { $in: tripIds } }).select('tripId')
        : [],
      tripIds.length
        ? TripSave.find({ userId: viewerId, tripId: { $in: tripIds } }).select('tripId')
        : [],
      ownerIds.length
        ? Follow.find({ followerId: viewerId, followingId: { $in: ownerIds } }).select('followingId')
        : [],
    ]);
    lovedSet = new Set(loveDocs.map((doc: any) => String(doc.tripId)));
    savedSet = new Set(saveDocs.map((doc: any) => String(doc.tripId)));
    followingSet = new Set(followDocs.map((doc: any) => doc.followingId));
  }

  // Use formatTripsWithUserData to populate user data
  const { formatTripsWithUserData } = await import('../utils/tripFormatter');
  const formattedTrips = await formatTripsWithUserData(docs, req, viewerId || undefined);

  return formattedTrips.map((formatted: any, index: number) => {
    const trip = docs[index];
    const tripId = trip?._id ? String(trip._id) : undefined;
    return {
      ...formatted,
      viewerLoved: tripId ? lovedSet.has(tripId) : false,
      viewerSaved: tripId ? savedSet.has(tripId) : false,
      viewerFollowsAuthor: viewerId && trip?.ownerId ? followingSet.has(trip.ownerId) : false,
    };
  });
}

async function buildTripsFromRefs(refDocs: any[], req: any, viewerId?: string | null) {
  if (!Array.isArray(refDocs) || !refDocs.length) return [];
  const tripIds = refDocs
    .map((doc: any) => (doc?.tripId ? String(doc.tripId) : null))
    .filter((id): id is string => typeof id === 'string' && !!id);
  if (!tripIds.length) return [];

  const trips = await Trip.find({ _id: { $in: tripIds } });
  const tripMap = new Map(trips.map((trip: any) => [String(trip._id), trip]));
  const orderedTrips = tripIds
    .map((id) => tripMap.get(id))
    .filter((trip): trip is any => Boolean(trip));

  return await formatTripsForResponse(orderedTrips, req, viewerId);
}

// Get current user (DB record, upsert from Clerk)

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The authenticated user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
// Search users
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query as { q: string };
    if (!q) return res.json([]);

    const users = await User.find({
      $or: [
        { fullName: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
      ],
    })
      .select('clerkId fullName username imageUrl')
      .limit(10);

    res.json(users);
  } catch (error: any) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Complete Onboarding (Traveler Role)
router.post('/onboarding', requireAuthStrict, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { role } = req.body; // Expect 'user'

    if (role !== 'user') {
      return res.status(400).json({ error: 'Invalid role for direct onboarding' });
    }

    // Update DB
    await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $set: {
          role: 'user',
          isOnboarded: true
        }
      },
      { upsert: true }
    );

    // Update Clerk
    try {
      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          role: 'user',
          isOnboarded: true
        }
      });
    } catch (err) {
      console.error("Clerk metadata update failed:", err);
    }

    res.json({ success: true, role: 'user' });
  } catch (error: any) {
    console.error('Onboarding error:', error);
    res.status(500).json({ error: 'Onboarding failed' });
  }
});

// Get current user (DB record, upsert from Clerk)
router.get('/me', requireAuthStrict, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const clerkUser = await clerkClient.users.getUser(userId);
    const existingUser = await User.findOne({ clerkId: userId });
    const dbUser = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $set: {
          email: clerkUser.primaryEmailAddress?.emailAddress,
          username: clerkUser.username,
          fullName: clerkUser.fullName || clerkUser.firstName || clerkUser.username,
          imageUrl: existingUser?.imageUrl || clerkUser.imageUrl,
          bio: (clerkUser.publicMetadata as any)?.bio || existingUser?.bio || null,
          location: (clerkUser.publicMetadata as any)?.location || existingUser?.location || null,
          coverImage: existingUser?.coverImage || (clerkUser.publicMetadata as any)?.coverImage || null,
        }
      },
      { upsert: true, new: true }
    );
    res.json(dbUser);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user', message: error.message });
  }
});

// Get current user's trips

/**
 * @swagger
 * /users/me/trips:
 *   get:
 *     summary: Get current user's trips
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of trips owned by the current user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Trip'
 */
router.get('/me/trips', requireAuthStrict, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const trips = await Trip.find({ ownerId: userId }).sort({ postedAt: -1 });
    res.json(trips);
  } catch (error: any) {
    console.error('Error fetching user trips:', error);
    res.status(500).json({ error: 'Failed to fetch trips', message: error.message });
  }
});

// Get current user's AI-generated trips
router.get('/me/ai-trips', requireAuthStrict, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const trips = await Trip.find({ ownerId: userId, isAIGenerated: true }).sort({ postedAt: -1 });
    const formatted = await formatTripsForResponse(trips, req, userId);
    res.json(formatted);
  } catch (error: any) {
    console.error('Error fetching AI trips:', error);
    res.status(500).json({ error: 'Failed to fetch AI trips', message: error.message });
  }
});

router.get('/me/loves', requireAuthStrict, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected',
        message: 'MongoDB connection is required.',
      });
    }
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const loveDocs = await TripLove.find({ userId }).sort({ createdAt: -1 }).limit(100);
    const trips = await buildTripsFromRefs(loveDocs, req, userId);
    res.json(trips);
  } catch (error: any) {
    console.error('Error fetching loved trips:', error);
    res.status(500).json({ error: 'Failed to fetch loved trips', message: error.message });
  }
});

router.get('/me/saves', requireAuthStrict, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected',
        message: 'MongoDB connection is required.',
      });
    }
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const saveDocs = await TripSave.find({ userId }).sort({ createdAt: -1 }).limit(100);
    const trips = await buildTripsFromRefs(saveDocs, req, userId);
    res.json(trips);
  } catch (error: any) {
    console.error('Error fetching saved trips:', error);
    res.status(500).json({ error: 'Failed to fetch saved trips', message: error.message });
  }
});

// Update current user's profile (requires auth)

/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *               location:
 *                 type: string
 *               fullName:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               coverImage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.patch('/me', requireAuthStrict, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { bio, location, coverImage, fullName, imageUrl } = req.body || {};

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected',
        message: 'MongoDB connection is required.'
      });
    }

    // Update Clerk metadata (only if there's data to update)
    try {
      const clerkUpdateData: any = {
        publicMetadata: {},
      };

      if (bio !== undefined) clerkUpdateData.publicMetadata.bio = bio;
      if (location !== undefined) clerkUpdateData.publicMetadata.location = location;
      // Only update coverImage in Clerk if it's not too large (Clerk has limits)
      // For large images, we'll store them only in MongoDB
      if (coverImage !== undefined) {
        // Check if coverImage is a base64 string and if it's too large
        // Clerk metadata has size limits, so we'll only store a reference or smaller version
        // For now, we'll try to store it, but if it fails, we'll continue with MongoDB only
        if (typeof coverImage === 'string' && coverImage.length > 100000) {
          // Image is too large for Clerk metadata, skip Clerk update for this field
          console.log('Cover image too large for Clerk metadata, storing in MongoDB only');
        } else {
          clerkUpdateData.publicMetadata.coverImage = coverImage;
        }
      }
      if (fullName !== undefined) {
        clerkUpdateData.firstName = fullName;
        clerkUpdateData.lastName = '';
      }

      // Only update Clerk if there's something to update
      if (Object.keys(clerkUpdateData.publicMetadata).length > 0 || fullName !== undefined) {
        await clerkClient.users.updateUser(userId, clerkUpdateData);
      }
    } catch (clerkError: any) {
      console.error('Error updating Clerk metadata:', clerkError);
      // Continue with MongoDB update even if Clerk update fails
      // This allows large images to be stored in MongoDB even if Clerk rejects them
    }

    // Update MongoDB User document (this is our source of truth for large images)
    const updateData: any = {};
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (fullName !== undefined) updateData.fullName = fullName;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    const updatedUser = await User.findOneAndUpdate(
      { clerkId: userId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.json(updatedUser);
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      return res.status(422).json({
        error: 'Validation Error',
        message: error.message || 'Invalid data provided'
      });
    }
    res.status(500).json({ error: 'Failed to update profile', message: error.message });
  }
});

router.get('/:clerkId/loves', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected',
        message: 'MongoDB connection is required.',
      });
    }
    const { clerkId } = req.params;
    const { userId: viewerId } = getAuth(req);
    const loveDocs = await TripLove.find({ userId: clerkId }).sort({ createdAt: -1 }).limit(100);
    const trips = await buildTripsFromRefs(loveDocs, req, viewerId);
    res.json(trips);
  } catch (error: any) {
    console.error('Error fetching loved trips:', error);
    res.status(500).json({ error: 'Failed to fetch loved trips', message: error.message });
  }
});

// Switch User Role (User <-> Company)
router.post('/me/switch-role', requireAuthStrict, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { targetRole } = req.body; // 'user' or 'company_owner'

    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Validate 14-day limit
    if (user.lastRoleSwitchAt) {
      const daysSinceSwitch = (new Date().getTime() - new Date(user.lastRoleSwitchAt).getTime()) / (1000 * 3600 * 24);
      if (daysSinceSwitch < 14) {
        return res.status(429).json({
          error: 'Cannot switch role yet',
          daysRemaining: Math.ceil(14 - daysSinceSwitch)
        });
      }
    }

    if (targetRole === 'company_owner') {
      // Verify they have an approved company
      if (!user.companyId) {
        return res.status(403).json({ error: 'No company profile found. Please register first.' });
      }
    }

    // Update Role
    user.role = targetRole;
    user.profileType = targetRole === 'company_owner' ? 'company' : 'user';
    user.lastRoleSwitchAt = new Date();
    await user.save();

    // Update Clerk
    try {
      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          role: targetRole,
          profileType: user.profileType
        }
      });
    } catch (err) {
      console.error("Clerk metadata update failed:", err);
    }

    res.json({ success: true, role: targetRole });
  } catch (error: any) {
    console.error('Role switch error:', error);
    res.status(500).json({ error: 'Failed to switch role' });
  }
});

router.get('/:clerkId/saves', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected',
        message: 'MongoDB connection is required.',
      });
    }
    const { clerkId } = req.params;
    const { userId: viewerId } = getAuth(req);
    const saveDocs = await TripSave.find({ userId: clerkId }).sort({ createdAt: -1 }).limit(100);
    const trips = await buildTripsFromRefs(saveDocs, req, viewerId);
    res.json(trips);
  } catch (error: any) {
    console.error('Error fetching saved trips:', error);
    res.status(500).json({ error: 'Failed to fetch saved trips', message: error.message });
  }
});

// Get user by Clerk ID (public)

/**
 * @swagger
 * /users/{clerkId}:
 *   get:
 *     summary: Get user by Clerk ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: clerkId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get('/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    const { userId: viewerId } = getAuth(req);

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected',
        message: 'MongoDB connection is required.'
      });
    }

    // Get user from Clerk
    let clerkUser;
    try {
      clerkUser = await clerkClient.users.getUser(clerkId);
    } catch (clerkError: any) {
      return res.status(404).json({ error: 'User not found', message: clerkError.message });
    }

    // Sync user data from Clerk to database (upsert)
    // Get existing user to preserve coverImage if it exists in DB
    const existingUser = await User.findOne({ clerkId });

    const updateData: any = {
      email: clerkUser.primaryEmailAddress?.emailAddress,
      username: clerkUser.username,
      fullName: clerkUser.fullName || clerkUser.firstName || clerkUser.username,
      imageUrl: existingUser?.imageUrl || clerkUser.imageUrl,
      bio: (clerkUser.publicMetadata as any)?.bio || existingUser?.bio || null,
      location: (clerkUser.publicMetadata as any)?.location || existingUser?.location || null,
    };

    // Only update coverImage from Clerk if it exists in Clerk metadata
    // Otherwise, preserve the existing database value (which is the source of truth)
    const clerkCoverImage = (clerkUser.publicMetadata as any)?.coverImage;
    if (clerkCoverImage) {
      updateData.coverImage = clerkCoverImage;
    } else if (!existingUser?.coverImage) {
      // Only set to null if there's no existing value in DB
      updateData.coverImage = null;
    }
    // If existingUser has coverImage and Clerk doesn't, keep the DB value (don't update)

    const [followersCount, followingCount, detailedTripsCount, quickTripsCount, likesAgg, viewerFollowsDoc, storiesCount] = await Promise.all([
      Follow.countDocuments({ followingId: clerkId }),
      Follow.countDocuments({ followerId: clerkId }),
      Trip.countDocuments({ ownerId: clerkId, postType: { $ne: 'quick' } }), // detailed trips (includes legacy trips without postType)
      Trip.countDocuments({ ownerId: clerkId, postType: 'quick' }), // quick trips
      Trip.aggregate([
        { $match: { ownerId: clerkId } },
        { $group: { _id: null, totalLikes: { $sum: { $ifNull: ['$likes', 0] } } } },
      ]),
      viewerId && viewerId !== clerkId
        ? Follow.exists({ followerId: viewerId, followingId: clerkId })
        : Promise.resolve(null),
      import('../models/Story').then(({ Story }) => Story.countDocuments({ userId: clerkId })),
    ]);
    const totalLikes = likesAgg?.[0]?.totalLikes || 0;
    const tripsCount = detailedTripsCount + quickTripsCount;

    // Compute activity score and badge level (must stay in sync with frontend logic)
    // Detailed trips earn more points (20) than quick trips (8) to incentivize full trip details
    const activityScore =
      detailedTripsCount * 20 +  // publishing detailed trips (higher reward)
      quickTripsCount * 8 +      // publishing quick trips (lower reward)
      storiesCount * 5 +         // sharing stories
      totalLikes * 2 +           // engagement from others
      followersCount * 5 +       // social influence
      followingCount * 1;        // community engagement

    let badgeLevel: "none" | "bronze" | "silver" | "gold" | "diamond" | "legend" = "none";
    if (activityScore >= 2000) {
      badgeLevel = "legend";
    } else if (activityScore >= 800) {
      badgeLevel = "diamond";
    } else if (activityScore >= 350) {
      badgeLevel = "gold";
    } else if (activityScore >= 100) {
      badgeLevel = "silver";
    } else if (activityScore >= 30) {
      badgeLevel = "bronze";
    }

    const dbUser = await User.findOneAndUpdate(
      { clerkId },
      {
        $set: {
          ...updateData,
          followers: followersCount,
          following: followingCount,
          totalLikes,
          activityScore,
          badgeLevel,
        },
      },
      { upsert: true, new: true }
    );

    // Return combined data (DB has latest synced data, use it as source of truth)
    const userData = {
      clerkId: dbUser.clerkId,
      email: dbUser.email,
      username: dbUser.username,
      fullName: dbUser.fullName,
      imageUrl: dbUser.imageUrl,
      bio: dbUser.bio,
      location: dbUser.location,
      coverImage: dbUser.coverImage,
      followers: followersCount,
      following: followingCount,
      totalLikes,
      activityScore: dbUser.activityScore,
      badgeLevel: dbUser.badgeLevel,
      tripsCount,
      storiesCount,
      viewerFollows: Boolean(viewerFollowsDoc),
      createdAt: dbUser.createdAt || clerkUser.createdAt,
      _id: dbUser._id,
    };

    res.json(userData);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user', message: error.message });
  }
});

// Follow/unfollow a user
router.post('/:clerkId/follow', requireAuthStrict, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected',
        message: 'MongoDB connection is required.',
      });
    }

    const targetId = req.params.clerkId;
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (userId === targetId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const existing = await Follow.findOne({ followerId: userId, followingId: targetId });
    let following = true;
    if (existing) {
      await existing.deleteOne();
      following = false;
    } else {
      await Follow.create({ followerId: userId, followingId: targetId });
      try {
        const actorUser = await clerkClient.users.getUser(userId);
        const actorName = actorUser.fullName || actorUser.firstName || actorUser.username || "مستخدم";
        await createNotification({
          recipientId: targetId,
          actorId: userId,
          actorName,
          actorImage: actorUser.imageUrl,
          type: "follow",
          message: `${actorName} قام بمتابعتك`,
        });
      } catch (err) {
        console.error("Error creating follow notification:", err);
      }
    }

    const followersCount = await Follow.countDocuments({ followingId: targetId });
    res.json({ following, followers: followersCount });
  } catch (error: any) {
    console.error('Error toggling follow state:', error);
    res.status(500).json({ error: 'Failed to update follow state', message: error.message });
  }
});

// Get trips by clerk user id
router.get('/:clerkId/trips', async (req, res) => {
  try {
    const { clerkId } = req.params;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected',
        message: 'MongoDB connection is required.'
      });
    }

    const trips = await Trip.find({ ownerId: clerkId }).sort({ postedAt: -1 });
    res.json(trips);
  } catch (error: any) {
    console.error('Error fetching user trips:', error);
    res.status(500).json({ error: 'Failed to fetch trips', message: error.message });
  }
});

// Get followers
router.get('/:clerkId/followers', async (req, res) => {
  try {
    const { clerkId } = req.params;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected',
        message: 'MongoDB connection is required.'
      });
    }

    const followers = await Follow.find({ followingId: clerkId });
    const followerIds = followers.map(f => f.followerId);

    if (followerIds.length === 0) {
      return res.json([]);
    }

    const users = await User.find({ clerkId: { $in: followerIds } }).select('clerkId fullName username imageUrl bio location');
    res.json(users);
  } catch (error: any) {
    console.error('Error fetching followers:', error);
    res.status(500).json({ error: 'Failed to fetch followers', message: error.message });
  }
});

// Get following
router.get('/:clerkId/following', async (req, res) => {
  try {
    const { clerkId } = req.params;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected',
        message: 'MongoDB connection is required.'
      });
    }

    const following = await Follow.find({ followerId: clerkId });
    const followingIds = following.map(f => f.followingId);

    if (followingIds.length === 0) {
      return res.json([]);
    }

    const users = await User.find({ clerkId: { $in: followingIds } }).select('clerkId fullName username imageUrl bio location');
    res.json(users);
  } catch (error: any) {
    console.error('Error fetching following:', error);
    res.status(500).json({ error: 'Failed to fetch following', message: error.message });
  }
});

export default router;


