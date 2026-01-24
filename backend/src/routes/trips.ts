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
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary if credentials are available
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const router = Router();


/**
 * @swagger
 * components:
 *   schemas:
 *     Trip:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         destination:
 *           type: string
 *         city:
 *           type: string
 *         description:
 *           type: string
 *         days:
 *           type: array
 *           items:
 *             type: object
 *         activities:
 *           type: array
 *           items:
 *             type: object
 *         foodAndRestaurants:
 *           type: array
 *           items:
 *             type: object
 *         likes:
 *           type: integer
 *         saves:
 *           type: integer
 *         ownerId:
 *           type: string
 *         image:
 *           type: string
 *         postedAt:
 *           type: string
 *           format: date-time
 */

async function getActorSnapshot(userId: string) {
  const user = await clerkClient.users.getUser(userId);
  const actorName = user.fullName || user.firstName || user.username || "مستخدم";
  const actorImage = user.imageUrl;
  return { actorName, actorImage };
}

// Public list

/**
 * @swagger
 * /trips:
 *   get:
 *     summary: Get a list of trips
 *     tags: [Trips]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, likes]
 *           default: recent
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *     responses:
 *       200:
 *         description: List of trips
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Trip'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 */
router.get('/', async (req, res) => {
  try {
    const { q, city, season, sort = 'recent', page = '1', limit = '20' } = req.query as any;
    const filter: any = {};
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
    if (season) filter.season = String(season);
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

    // Use formatTripsWithUserData to populate user data
    const { formatTripsWithUserData } = await import('../utils/tripFormatter');
    const formattedTrips = await formatTripsWithUserData(items, req, viewerId);

    const formatted = formattedTrips.map((shaped: any, index: number) => {
      const t = items[index];
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

/**
 * @swagger
 * /trips/{id}:
 *   get:
 *     summary: Get a trip by ID
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trip'
 *       404:
 *         description: Trip not found
 */
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

    // Use formatTripsWithUserData to populate user data
    const { formatTripsWithUserData } = await import('../utils/tripFormatter');
    const formattedTrips = await formatTripsWithUserData([trip], req, viewerId);
    const formatted = formattedTrips[0];

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

/**
 * @swagger
 * /trips:
 *   post:
 *     summary: Create a new trip
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               destination:
 *                 type: string
 *               city:
 *                 type: string
 *               description:
 *                 type: string
 *               days:
 *                 type: array
 *               activities:
 *                 type: array
 *               foodAndRestaurants:
 *                 type: array
 *               image:
 *                 type: string
 *     responses:
 *       201:
 *         description: Trip created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trip'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
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

    // Validate required fields before processing
    if (!req.body.title || typeof req.body.title !== 'string' || req.body.title.trim() === '') {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Trip title is required and must be a non-empty string'
      });
    }

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

    // Upload base64 media to Cloudinary and return URL
    // Falls back to base64 string if Cloudinary is partially configured or disabled
    const persistBase64 = async (dataUrl: string, subdir: string): Promise<string> => {
      const match = /^data:(image|video)\/([a-zA-Z0-9+.-]+);base64,(.+)$/.exec(dataUrl);
      if (!match) {
        // Not a base64 data URL, return as-is (already a URL)
        return dataUrl;
      }

      // Check Cloudinary configuration
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.warn(`[Trip Creation] Cloudinary not configured. Storing media as base64 in MongoDB.`);
        return dataUrl; // Fallback to base64
      }

      const [, mediaType, ext, b64] = match;

      try {
        // Upload to Cloudinary (accepts data URL string directly)
        const uploadResult = await cloudinary.uploader.upload(
          `data:${mediaType}/${ext};base64,${b64}`,
          {
            folder: `re7lty/${subdir}`,
            resource_type: 'auto', // Let Cloudinary auto-detect the resource type
          }
        );

        console.log(`[Trip Creation] Successfully uploaded to Cloudinary: ${uploadResult.secure_url}`);
        return uploadResult.secure_url; // Return Cloudinary URL
      } catch (error: any) {
        console.error(`[Trip Creation] Cloudinary upload failed: ${error.message}. Falling back to base64.`);
        return dataUrl; // Fallback to base64 on error
      }
    };

    const sanitizeTripMediaOnCreate = async (payload: any) => {
      const out: any = { ...payload };

      // Process cover image
      if (typeof out.image === 'string' && out.image.startsWith('data:')) {
        out.image = await persistBase64(out.image, "trips");
      }

      // Process activities
      if (Array.isArray(out.activities)) {
        out.activities = await Promise.all(out.activities.map(async (act: any) => {
          const a = { ...act };

          // Process activity images
          if (Array.isArray(a.images)) {
            a.images = await Promise.all(a.images.map(async (img: any) => {
              return typeof img === 'string' && img.startsWith('data:')
                ? await persistBase64(img, "activities")
                : img;
            }));
          }

          // Process activity videos
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
      // Process food and restaurant images
      if (Array.isArray(out.foodAndRestaurants)) {
        out.foodAndRestaurants = await Promise.all(out.foodAndRestaurants.map(async (f: any) => {
          const nf = { ...f };
          if (typeof nf.image === 'string' && nf.image.startsWith('data:')) {
            nf.image = await persistBase64(nf.image, "foods");
          }
          return nf;
        }));
      }


      // Process hotel images
      if (Array.isArray(out.hotels)) {
        out.hotels = await Promise.all(out.hotels.map(async (h: any) => {
          const nh = { ...h };
          if (typeof nh.image === 'string' && nh.image.startsWith('data:')) {
            nh.image = await persistBase64(nh.image, "hotels");
          }
          return nh;
        }));
      }

      return out;
    };

    let mediaReadyBody;
    try {
      mediaReadyBody = await sanitizeTripMediaOnCreate(restBody);
    } catch (mediaError: any) {
      console.error('[Trip Creation] Error processing media:', mediaError);
      console.error('[Trip Creation] Media error stack:', mediaError.stack);

      // Return error to user - do not fall back to base64
      return res.status(500).json({
        error: 'Failed to upload media to Cloudinary',
        message: mediaError.message || 'Media upload failed',
        details: 'Please ensure Cloudinary is properly configured and try again.'
      });
    }

    const tripData = {
      ...mediaReadyBody,
      ownerId: userId, // Clerk user ID (from Clerk Express SDK)
      author: authorName, // Author name from Clerk (always use Clerk data)
      authorFollowers: authorFollowers,
    };

    // Validate trip data structure before creating
    // Ensure activities have valid structure
    if (Array.isArray(tripData.activities)) {
      for (let i = 0; i < tripData.activities.length; i++) {
        const activity = tripData.activities[i];
        if (!activity.name || typeof activity.name !== 'string') {
          return res.status(400).json({
            error: 'Validation error',
            message: `Activity at index ${i} is missing a valid name`
          });
        }
        // Ensure coordinates exist and are valid
        if (!activity.coordinates || typeof activity.coordinates !== 'object') {
          return res.status(400).json({
            error: 'Validation error',
            message: `Activity "${activity.name}" is missing valid coordinates`
          });
        }
        if (typeof activity.coordinates.lat !== 'number' || typeof activity.coordinates.lng !== 'number') {
          return res.status(400).json({
            error: 'Validation error',
            message: `Activity "${activity.name}" has invalid coordinates (lat/lng must be numbers)`
          });
        }
      }
    }

    console.log('[Trip Creation] Creating trip with data:', {
      title: tripData.title,
      destination: tripData.destination,
      city: tripData.city,
      activitiesCount: Array.isArray(tripData.activities) ? tripData.activities.length : 0,
      daysCount: Array.isArray(tripData.days) ? tripData.days.length : 0,
      foodCount: Array.isArray(tripData.foodAndRestaurants) ? tripData.foodAndRestaurants.length : 0,
    });

    // Create trip with author details
    let created;
    try {
      created = await Trip.create(tripData);
      console.log(`[Trip Creation] Trip created: ${created._id} by ${authorName}`);
    } catch (createError: any) {
      console.error('[Trip Creation] Error creating trip in database:', createError);
      // Provide more detailed error information
      if (createError.name === 'ValidationError') {
        const validationErrors = Object.values(createError.errors || {}).map((err: any) => err.message);
        return res.status(400).json({
          error: 'Validation error',
          message: 'Trip data validation failed',
          details: validationErrors
        });
      }
      throw createError; // Re-throw to be caught by outer catch
    }

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
    console.error('[Trip Creation] Unhandled error:', error);
    console.error('[Trip Creation] Error stack:', error.stack);
    console.error('[Trip Creation] Request body keys:', Object.keys(req.body || {}));

    // Provide more detailed error information
    let errorMessage = error.message || 'Failed to create trip';
    let errorDetails: any = {};

    if (error.name === 'ValidationError') {
      errorDetails.validationErrors = Object.values(error.errors || {}).map((err: any) => ({
        field: err.path,
        message: err.message
      }));
    } else if (error.code) {
      errorDetails.code = error.code;
    }

    res.status(500).json({
      error: 'Failed to create trip',
      message: errorMessage,
      ...(Object.keys(errorDetails).length > 0 && { details: errorDetails }),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
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

    const existing = await TripLove.findOneAndDelete({ userId, tripId: trip._id });

    let loved = false;

    if (existing) {
      // It existed and we deleted it -> Unliked
      loved = false;
    } else {
      try {
        // It didn't exist (or we missed it), try to create -> Liked
        await TripLove.create({ userId, tripId: trip._id });
        loved = true;
      } catch (err: any) {
        if (err.code === 11000) {
          // Race condition: It was created between our check and our create.
          // This means it is now Liked. 
          // We treat this "failed toggle" as a successful "ensure liked" (debouncing)
          loved = true;
          // We don't need to increment likes count here because the other racer did it
        } else {
          throw err;
        }
      }
    }

    // Only update counts if we successfully changed state
    // Note: If we hit the race condition (E11000), we assume the other request updated the count.
    // However, to be safe and consistent with the displayed UI, we recalculate or just apply delta if we did the action.

    // Simpler approach for count:
    // If we deleted (existing), we decrement.
    // If we created (success), we increment.
    // If we hit race (E11000), we do nothing to count (other request did it).

    if (existing) {
      trip.likes = Math.max(0, (trip.likes || 0) - 1);
      trip.weeklyLikes = Math.max(0, (trip.weeklyLikes || 0) - 1);
      await trip.save();
    } else if (loved) {
      // Only increment if we actually created it (not if we hit race condition loop which implies someone else did)
      // Actually, if we caught E11000, 'loved' is true, but we didn't create it.
      // So we need to distinguish.
      const actuallyCreated = !existing && (await TripLove.findOne({ userId, tripId: trip._id })); // This check is redundant/slow

      // Let's rely on the previous flow:
      // If we are in the catch block (E11000), we did NOT increment. Correct.
      // If we are in the try block (success), we SHOULD increment.
    }

    // Let's refine the counting logic to be robust
    // We can just rely on the fact that if we did the DB op, we change the count.
    if (existing) {
      // We deleted
      // Already decremented above
    } else {
      // We tried to create
      // If successful, we need to increment.
      // Implementation below in the conditional blocks is messy. Let's restructure.
    }

    // RESTRUCTURED LOGIC:
    if (existing) {
      // Unliked
      trip.likes = Math.max(0, (trip.likes || 0) - 1);
      trip.weeklyLikes = Math.max(0, (trip.weeklyLikes || 0) - 1);
      await trip.save();
    } else {
      // Attempt create
      try {
        await TripLove.create({ userId, tripId: trip._id });
        // Created successfully -> Liked
        loved = true;
        trip.likes = (trip.likes || 0) + 1;
        trip.weeklyLikes = (trip.weeklyLikes || 0) + 1;
        await trip.save();

        // Notification
        if (trip.ownerId) {
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
      } catch (err: any) {
        if (err.code === 11000) {
          // Already liked by race condition.
          // Treat as "Liked" state, but don't change count (other req did).
          loved = true;
          // Fetch latest likes count to return accurate data
          const freshTrip = await Trip.findById(req.params.id);
          if (freshTrip) {
            trip.likes = freshTrip.likes;
          }
        } else {
          throw err;
        }
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

    // Upload base64 media to Cloudinary and return URL (same as create route)
    const persistBase64 = async (dataUrl: string, subdir: string): Promise<string> => {
      const match = /^data:(image|video)\/([a-zA-Z0-9+.-]+);base64,(.+)$/.exec(dataUrl);
      if (!match) {
        return dataUrl;
      }

      // If Cloudinary is not configured, return base64 (fallback)
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.warn(`[Trip Update] Cloudinary not configured, storing base64 for ${subdir}`);
        return dataUrl;
      }

      try {
        const [, mediaType, ext, b64] = match;

        // Upload to Cloudinary (accepts data URL string directly)
        const uploadResult = await cloudinary.uploader.upload(
          `data:${mediaType}/${ext};base64,${b64}`,
          {
            folder: `re7lty/${subdir}`,
            resource_type: mediaType === 'video' ? 'video' : 'image',
            format: ext,
          }
        );

        console.log(`[Trip Update] Uploaded to Cloudinary: ${uploadResult.secure_url}`);
        return uploadResult.secure_url;
      } catch (cloudinaryError: any) {
        console.warn(`[Trip Update] Cloudinary upload failed (${subdir}): ${cloudinaryError.message}`);
        return dataUrl; // Return base64 as fallback - NEVER throw
      }
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
      if (Array.isArray(out.hotels)) {
        out.hotels = await Promise.all(out.hotels.map(async (h: any) => {
          const nh = { ...h };
          if (typeof nh.image === 'string' && nh.image.startsWith('data:')) {
            nh.image = await persistBase64(nh.image, "hotels");
          }
          return nh;
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


