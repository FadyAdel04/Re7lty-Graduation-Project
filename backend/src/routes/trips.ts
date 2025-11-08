import { Router } from "express";
import mongoose from "mongoose";
import { requireAuthStrict, getAuth, clerkClient } from "../utils/auth";
import { Trip } from "../models/Trip";
import { User } from "../models/User";

const router = Router();

// Public list
router.get('/', async (req, res) => {
  try {
    const { q, city, sort = 'recent', page = '1', limit = '20' } = req.query as any;
    const filter: any = {};
    if (q) filter.title = { $regex: String(q), $options: 'i' };
    if (city) filter.city = String(city);
    const skip = (Number(page) - 1) * Number(limit);
    const sortObj = sort === 'likes' ? { likes: -1 } : { postedAt: -1 };
    
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
    res.json({ items, total, page: Number(page), limit: Number(limit) });
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
    res.json(trip);
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
    const tripData = {
      ...restBody,
      ownerId: userId, // Clerk user ID (from Clerk Express SDK)
      author: authorName, // Author name from Clerk (always use Clerk data)
      authorFollowers: authorFollowers,
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
    
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Failed to create trip', message: error.message });
  }
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
    const updateData = {
      ...restBody,
      author: authorName, // Always use current Clerk data for author name
    };

    const updated = await Trip.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json(updated);
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


