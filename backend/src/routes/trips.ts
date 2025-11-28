import { Router } from "express";
import mongoose from "mongoose";
import { requireAuthStrict, getAuth, clerkClient } from "../utils/auth";
import { Trip } from "../models/Trip";
import { User } from "../models/User";
import { TripLove } from "../models/TripLove";
import { Follow } from "../models/Follow";
import { TripSave } from "../models/TripSave";
import { formatTripMedia, formatComment, toAbsoluteUrl } from "../utils/tripFormatter";
import { createNotification } from "../utils/notificationDispatcher";
import fs from "fs/promises";
import path from "path";

const router = Router();

async function getActorSnapshot(userId: string) {
  const user = await clerkClient.users.getUser(userId);
  const actorName = user.fullName || user.firstName || user.username || "مستخدم";
  const actorImage = user.imageUrl;
  return { actorName, actorImage };
}

// Public list
router.get('/', async (req, res) => {
  try {
    const { q, city, sort = 'recent', page = '1', limit = '20' } = req.query as any;
    const filter: any = { isPublic: true }; // Only show public trips in timeline
    const authInfo = getAuth(req);
    const viewerId = authInfo.userId || undefined;
    
    // Enhanced search - search in title, destination, city, description, and author
    if (q) {
      const searchQuery = String(q);
      filter.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { destination: { $regex: searchQuery, $options: 'i' } },
        { city: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { author: { $regex: searchQuery, $options: 'i' } },
      ];
    }
    
    if (city) filter.city = String(city);
    const skip = (Number(page) - 1) * Number(limit);
    const sortObj: Record<string, mongoose.SortOrder> =
      sort === 'likes' ? { likes: -1 } : { postedAt: -1 };
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected', 
        message: 'MongoDB connection is required. Please check your MONGODB_URI and IP whitelist.' 
      });
    }
    
    const [items, total] = await Promise.all([
      Trip.find(filter).sort(sortObj).skip(skip).limit(Number(limit)),
      Trip.countDocuments(filter)
    ]);
    const tripIds = items
      .map((t) => t?._id)
      .filter((id): id is mongoose.Types.ObjectId => Boolean(id));
    const ownerIds = items
      .map((t) => t?.ownerId)
      .filter((id): id is string => typeof id === 'string' && !!id);
    let lovedSet = new Set<string>();
    let savedSet = new Set<string>();
    let followingSet = new Set<string>();

    if (viewerId) {
      const [loveDocs, followDocs, saveDocs] = await Promise.all([
        tripIds.length
          ? TripLove.find({ userId: viewerId, tripId: { $in: tripIds } })
              .select('tripId')
          : [],
        ownerIds.length
          ? Follow.find({ followerId: viewerId, followingId: { $in: ownerIds } })
              .select('followingId')
          : [],
        tripIds.length
          ? TripSave.find({ userId: viewerId, tripId: { $in: tripIds } })
              .select('tripId')
          : [],
      ]);
      lovedSet = new Set(loveDocs.map((doc: any) => String(doc.tripId)));
      followingSet = new Set(followDocs.map((doc: any) => doc.followingId));
      savedSet = new Set(saveDocs.map((doc: any) => String(doc.tripId)));
    }

    const formatted = items.map((t) => {
      const shaped = formatTripMedia(t, req, viewerId);
      const tripId = t?._id ? String(t._id) : undefined;
      const ownerId = typeof t?.ownerId === 'string' ? t.ownerId : undefined;
      const viewerFollowsAuthor = Boolean(
        viewerId && ownerId && followingSet.has(ownerId)
      );
      return {
        ...shaped,
        viewerLoved: tripId ? lovedSet.has(tripId) : false,
        viewerFollowsAuthor,
        viewerSaved: tripId ? savedSet.has(tripId) : false,
      };
    });
    res.json({ items: formatted, total, page: Number(page), limit: Number(limit) });
  } catch (error: any) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Failed to fetch trips', message: error.message });
  }
});

// Public detail
router.get('/:id', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected', 
        message: 'MongoDB connection is required.' 
      });
    }
    
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const authInfo = getAuth(req);
    const viewerId = authInfo.userId || undefined;
    const ownerId = typeof trip.ownerId === 'string' ? trip.ownerId : undefined;

    // Check if trip is public or if viewer is the owner
    if (!trip.isPublic && viewerId !== ownerId) {
      return res.status(403).json({ error: 'Forbidden', message: 'This trip is private' });
    }

    const followersPromise = ownerId
      ? Follow.countDocuments({ followingId: ownerId })
      : Promise.resolve(trip.authorFollowers || 0);
    const lovedPromise = viewerId
      ? TripLove.exists({ tripId: trip._id, userId: viewerId })
      : Promise.resolve(null);
    const followPromise = viewerId && ownerId
      ? Follow.exists({ followerId: viewerId, followingId: ownerId })
      : Promise.resolve(null);

    const [followersCount, lovedDoc, followDoc, savedDoc] = await Promise.all([
      followersPromise,
      lovedPromise,
      followPromise,
      viewerId ? TripSave.exists({ tripId: trip._id, userId: viewerId }) : Promise.resolve(null),
    ]);

    const formatted = formatTripMedia(trip, req, viewerId);
    if (typeof followersCount === 'number') {
      formatted.authorFollowers = followersCount;
    }
    formatted.viewerLoved = Boolean(lovedDoc);
    formatted.viewerFollowsAuthor = Boolean(followDoc);
    formatted.viewerSaved = Boolean(savedDoc);

    res.json(formatted);
  } catch (error: any) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ error: 'Failed to fetch trip', message: error.message });
  }
});

// Create (requires auth)
router.post('/', requireAuthStrict, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected', 
        message: 'MongoDB connection is required to create trips. Please check your MONGODB_URI and ensure your IP is whitelisted in MongoDB Atlas.',
        details: 'See: https://www.mongodb.com/docs/atlas/security-whitelist/'
      });
    }

    // Get authenticated user ID from Clerk Express SDK
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID not found' });
    }

    console.log(`[Trip Creation] Authenticated user: ${userId}`);

    // Fetch user details from Clerk to get author information
    let clerkUser;
    try {
      clerkUser = await clerkClient.users.getUser(userId);
      console.log(`[Trip Creation] Fetched Clerk user: ${clerkUser.fullName || clerkUser.username}`);
    } catch (clerkError: any) {
      console.error('Error fetching user from Clerk:', clerkError.message);
      return res.status(500).json({ 
        error: 'Failed to fetch user details from Clerk', 
        message: clerkError.message 
      });
    }

    // Extract author details from Clerk user
    const authorName = clerkUser.fullName || 
                      clerkUser.firstName || 
                      clerkUser.username || 
                      'مستخدم';
    const authorFollowers = 0; // Can be calculated from user relationships if needed
    const authorImageUrl = clerkUser.imageUrl || '';

    // Prepare trip data with author information from Clerk
    // Always use Clerk data as source of truth for author information
    const { author, authorFollowers: _, ...restBody } = req.body;

    // Persist base64 media to disk and replace with URL paths
    const persistBase64 = async (dataUrl: string, subdir: string) => {
      const match = /^data:(image|video)\/([a-zA-Z0-9+.-]+);base64,(.+)$/.exec(dataUrl);
      if (!match) return dataUrl;
      const [, , ext, b64] = match;
      const safeExt = (ext || 'bin').toLowerCase().replace(/[^a-z0-9]+/g, '');
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;
      const dir = path.join(process.cwd(), "uploads", subdir);
      await fs.mkdir(dir, { recursive: true });
      const filePath = path.join(dir, fileName);
      const buffer = Buffer.from(b64, 'base64');
      await fs.writeFile(filePath, buffer);
      return `/uploads/${subdir}/${fileName}`;
    };

    const sanitizeTripMediaOnCreate = async (payload: any) => {
      const out: any = { ...payload };
      if (typeof out.image === 'string' && out.image.startsWith('data:')) {
        out.image = await persistBase64(out.image, "trips");
      }
      if (Array.isArray(out.activities)) {
        out.activities = await Promise.all(out.activities.map(async (act: any) => {
          const a = { ...act };
          if (Array.isArray(a.images)) {
            a.images = await Promise.all(a.images.map(async (img: any) => {
              return typeof img === 'string' && img.startsWith('data:')
                ? await persistBase64(img, "activities")
                : img;
            }));
          }
          if (Array.isArray(a.videos)) {
            a.videos = await Promise.all(a.videos.map(async (vid: any) => {
              return typeof vid === 'string' && vid.startsWith('data:')
                ? await persistBase64(vid, "activities")
                : vid;
            }));
          }
          return a;
        }));
      }
      if (Array.isArray(out.foodAndRestaurants)) {
        out.foodAndRestaurants = await Promise.all(out.foodAndRestaurants.map(async (f: any) => {
          const nf = { ...f };
          if (typeof nf.image === 'string' && nf.image.startsWith('data:')) {
            nf.image = await persistBase64(nf.image, "foods");
          }
          return nf;
        }));
      }
      return out;
    };

    const mediaReadyBody = await sanitizeTripMediaOnCreate(restBody);
    // AI-generated trips are private by default, regular trips are public
    const isAIGenerated = mediaReadyBody.isAIGenerated === true;
    const tripData = {
      ...mediaReadyBody,
      ownerId: userId, // Clerk user ID (from Clerk Express SDK)
      author: authorName, // Author name from Clerk (always use Clerk data)
      authorFollowers: authorFollowers,
      isPublic: isAIGenerated ? false : (mediaReadyBody.isPublic !== undefined ? mediaReadyBody.isPublic : true), // AI trips private by default
    };

    // Create trip with author details
    const created = await Trip.create(tripData);
    console.log(`[Trip Creation] Trip created: ${created._id} by ${authorName}`);
    
    // Upsert user in database and link trip
    try {
      // Create or update user in database with Clerk data
      await User.findOneAndUpdate(
        { clerkId: userId },
        {
          $set: {
            email: clerkUser.primaryEmailAddress?.emailAddress,
            username: clerkUser.username,
            fullName: authorName,
            imageUrl: authorImageUrl,
            bio: (clerkUser.publicMetadata as any)?.bio || null,
            location: (clerkUser.publicMetadata as any)?.location || null,
            coverImage: (clerkUser.publicMetadata as any)?.coverImage || null,
          },
          $setOnInsert: {
            clerkId: userId,
          },
        },
        { upsert: true, new: true }
      );
      
      // Link trip to user
      await User.updateOne(
        { clerkId: userId }, 
        { $addToSet: { trips: created._id } }
      );
      
      console.log(`[Trip Creation] User database updated for ${userId}`);
    } catch (userError: any) {
      console.error('Error updating user in database:', userError.message);
      // Continue even if user update fails - trip is still created
    }
    
    const formatted = formatTripMedia(created, req, userId);
    formatted.viewerLoved = false;
    formatted.viewerFollowsAuthor = false;
    formatted.viewerSaved = false;
    res.status(201).json(formatted);
  } catch (error: any) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Failed to create trip', message: error.message });
  }
});

const toggleTripLoveHandler = async (req: any, res: any) => {
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

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const existing = await TripLove.findOne({ userId, tripId: trip._id });
    let loved = true;
    if (existing) {
      await existing.deleteOne();
      loved = false;
    } else {
      await TripLove.create({ userId, tripId: trip._id });
    }

    const delta = loved ? 1 : -1;
    trip.likes = Math.max(0, (trip.likes || 0) + delta);
    trip.weeklyLikes = Math.max(0, (trip.weeklyLikes || 0) + delta);
    await trip.save();

    if (loved && trip.ownerId) {
      try {
        const { actorName, actorImage } = await getActorSnapshot(userId);
        await createNotification({
          recipientId: trip.ownerId,
          actorId: userId,
          actorName,
          actorImage,
          type: "love",
          message: `${actorName} أعجب برحلتك "${trip.title}"`,
          tripId: trip._id,
          metadata: { tripTitle: trip.title },
        });
      } catch (err) {
        console.error("Error creating love notification:", err);
      }
    }

    res.json({ loved, likes: trip.likes });
  } catch (error: any) {
    console.error('Error toggling trip love:', error);
    res.status(500).json({ error: 'Failed to update love state', message: error.message });
  }
};

// Love/like (requires auth)
router.post('/:id/love', requireAuthStrict, toggleTripLoveHandler);
router.post('/:id/like', requireAuthStrict, toggleTripLoveHandler); // backward compatibility

const toggleTripSaveHandler = async (req: any, res: any) => {
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

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const existing = await TripSave.findOne({ userId, tripId: trip._id });
    let saved = true;
    if (existing) {
      await existing.deleteOne();
      saved = false;
    } else {
      await TripSave.create({ userId, tripId: trip._id });
    }

    const delta = saved ? 1 : -1;
    trip.saves = Math.max(0, (trip.saves || 0) + delta);
    await trip.save();

    if (saved && trip.ownerId) {
      try {
        const { actorName, actorImage } = await getActorSnapshot(userId);
        await createNotification({
          recipientId: trip.ownerId,
          actorId: userId,
          actorName,
          actorImage,
          type: "save",
          message: `${actorName} حفظ رحلتك "${trip.title}"`,
          tripId: trip._id,
          metadata: { tripTitle: trip.title },
        });
      } catch (err) {
        console.error("Error creating save notification:", err);
      }
    }

    res.json({ saved, saves: trip.saves });
  } catch (error: any) {
    console.error('Error toggling trip save:', error);
    res.status(500).json({ error: 'Failed to update save state', message: error.message });
  }
};

router.post('/:id/save', requireAuthStrict, toggleTripSaveHandler);

// Toggle trip visibility (public/private)
router.patch('/:id/visibility', requireAuthStrict, async (req, res) => {
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

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Only owner can change visibility
    if (trip.ownerId !== userId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only change visibility of your own trips' });
    }

    const { isPublic } = req.body;
    if (typeof isPublic !== 'boolean') {
      return res.status(400).json({ error: 'Invalid request', message: 'isPublic must be a boolean' });
    }

    trip.isPublic = isPublic;
    await trip.save();

    res.json({ isPublic: trip.isPublic, message: isPublic ? 'Trip is now public' : 'Trip is now private' });
  } catch (error: any) {
    console.error('Error toggling trip visibility:', error);
    res.status(500).json({ error: 'Failed to update trip visibility', message: error.message });
  }
});

// Fetch comments for a trip
router.get('/:id/comments', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected',
        message: 'MongoDB connection is required.',
      });
    }

    const trip = await Trip.findById(req.params.id).select('comments ownerId');
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const authInfo = getAuth(req);
    const viewerId = authInfo.userId || undefined;
    const formatted = formatTripMedia(trip, req, viewerId);
    res.json(formatted.comments || []);
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments', message: error.message });
  }
});

// Create a new comment on a trip
router.post('/:id/comments', requireAuthStrict, async (req, res) => {
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

    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    if (content.length > 2000) {
      return res.status(400).json({ error: 'Comment is too long (max 2000 characters)' });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const clerkUser = await clerkClient.users.getUser(userId);
    const authorName = clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'مستخدم';
    const newCommentId = new mongoose.Types.ObjectId();
    const newComment = {
      _id: newCommentId,
      authorId: userId,
      author: authorName,
      authorAvatar: clerkUser.imageUrl || undefined,
      content,
      date: new Date().toISOString(),
      likes: 0,
      likedBy: [],
    };

    if (!Array.isArray(trip.comments)) {
      trip.set('comments', []);
    }
    trip.comments.unshift(newComment as any);
    await trip.save();

    if (trip.ownerId) {
      try {
        await createNotification({
          recipientId: trip.ownerId,
          actorId: userId,
          actorName: authorName,
          actorImage: clerkUser.imageUrl,
          type: "comment",
          message: `${authorName} علق على رحلتك "${trip.title}"`,
          tripId: trip._id,
          commentId: newCommentId,
          metadata: { snippet: content.slice(0, 120) },
        });
      } catch (err) {
        console.error("Error creating comment notification:", err);
      }
    }

    const responseComment = formatComment(
      {
        ...newComment,
        authorAvatar: toAbsoluteUrl(newComment.authorAvatar, req) || newComment.authorAvatar,
      },
      userId
    );

    res.status(201).json(responseComment);
  } catch (error: any) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment', message: error.message });
  }
});

// Like/unlike a specific comment
router.post('/:tripId/comments/:commentId/love', requireAuthStrict, async (req, res) => {
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

    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const comment: any = trip.comments?.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (!Array.isArray(comment.likedBy)) {
      comment.likedBy = [];
    }

    const alreadyLiked = comment.likedBy.includes(userId);
    if (alreadyLiked) {
      comment.likedBy = comment.likedBy.filter((id: string) => id !== userId);
      comment.likes = Math.max(0, (comment.likes || 0) - 1);
    } else {
      comment.likedBy.push(userId);
      comment.likes = (comment.likes || 0) + 1;
    }

    await trip.save();

    res.json({
      liked: !alreadyLiked,
      likes: comment.likes,
      commentId: String(comment._id),
    });
  } catch (error: any) {
    console.error('Error toggling comment like:', error);
    res.status(500).json({ error: 'Failed to update comment like', message: error.message });
  }
});

router.delete('/:tripId/comments/:commentId', requireAuthStrict, async (req, res) => {
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

    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const comment: any = trip.comments?.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const canDelete = comment.authorId === userId || trip.ownerId === userId;
    if (!canDelete) {
      return res.status(403).json({ error: 'Forbidden', message: 'You cannot delete this comment' });
    }

    const updatedComments =
      (trip.comments as any)?.filter?.(
        (c: any) => String(c?._id) !== String(comment._id)
      ) ?? [];
    trip.set('comments', updatedComments);
    await trip.save();

    res.json({ success: true, commentId: req.params.commentId });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment', message: error.message });
  }
});

// Update trip (requires auth and ownership)
router.put('/:id', requireAuthStrict, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected', 
        message: 'MongoDB connection is required.' 
      });
    }

    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Check if user is the owner
    if (trip.ownerId !== userId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only edit your own trips' });
    }

    // Get updated author info from Clerk if needed
    let clerkUser;
    try {
      clerkUser = await clerkClient.users.getUser(userId);
    } catch (clerkError: any) {
      console.error('Error fetching user from Clerk:', clerkError.message);
    }

    const authorName = clerkUser 
      ? (clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'مستخدم')
      : trip.author;

    // Prepare update data
    const { author, authorFollowers: _, ownerId: __, ...restBody } = req.body;

    // Persist base64 media coming in the update
    const persistBase64 = async (dataUrl: string, subdir: string) => {
      const match = /^data:(image|video)\/([a-zA-Z0-9+.-]+);base64,(.+)$/.exec(dataUrl);
      if (!match) return dataUrl;
      const [, , ext, b64] = match;
      const safeExt = (ext || 'bin').toLowerCase().replace(/[^a-z0-9]+/g, '');
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;
      const dir = path.join(process.cwd(), "uploads", subdir);
      await fs.mkdir(dir, { recursive: true });
      const filePath = path.join(dir, fileName);
      const buffer = Buffer.from(b64, 'base64');
      await fs.writeFile(filePath, buffer);
      return `/uploads/${subdir}/${fileName}`;
    };

    const sanitizeTripMediaOnUpdate = async (payload: any) => {
      const out: any = { ...payload };
      if (typeof out.image === 'string' && out.image.startsWith('data:')) {
        out.image = await persistBase64(out.image, "trips");
      }
      if (Array.isArray(out.activities)) {
        out.activities = await Promise.all(out.activities.map(async (act: any) => {
          const a = { ...act };
          if (Array.isArray(a.images)) {
            a.images = await Promise.all(a.images.map(async (img: any) => {
              return typeof img === 'string' && img.startsWith('data:')
                ? await persistBase64(img, "activities")
                : img;
            }));
          }
          if (Array.isArray(a.videos)) {
            a.videos = await Promise.all(a.videos.map(async (vid: any) => {
              return typeof vid === 'string' && vid.startsWith('data:')
                ? await persistBase64(vid, "activities")
                : vid;
            }));
          }
          return a;
        }));
      }
      if (Array.isArray(out.foodAndRestaurants)) {
        out.foodAndRestaurants = await Promise.all(out.foodAndRestaurants.map(async (f: any) => {
          const nf = { ...f };
          if (typeof nf.image === 'string' && nf.image.startsWith('data:')) {
            nf.image = await persistBase64(nf.image, "foods");
          }
          return nf;
        }));
      }
      return out;
    };

    const mediaReadyBody = await sanitizeTripMediaOnUpdate(restBody);
    const updateData = {
      ...mediaReadyBody,
      author: authorName, // Always use current Clerk data for author name
    };

    const updated = await Trip.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json(formatTripMedia(updated, req, userId));
  } catch (error: any) {
    console.error('Error updating trip:', error);
    res.status(500).json({ error: 'Failed to update trip', message: error.message });
  }
});

// Delete trip (requires auth and ownership)
router.delete('/:id', requireAuthStrict, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected', 
        message: 'MongoDB connection is required.' 
      });
    }

    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Check if user is the owner
    if (trip.ownerId !== userId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only delete your own trips' });
    }

    // Remove trip from user's trips array
    await User.updateOne(
      { clerkId: userId },
      { $pull: { trips: trip._id } }
    );

    // Delete the trip
    await Trip.findByIdAndDelete(req.params.id);

    res.json({ message: 'Trip deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting trip:', error);
    res.status(500).json({ error: 'Failed to delete trip', message: error.message });
  }
});

export default router;


