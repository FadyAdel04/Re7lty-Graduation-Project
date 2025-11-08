import { Router } from "express";
import mongoose from "mongoose";
import { requireAuthStrict, getAuth, clerkClient } from "../utils/auth";
import { User } from "../models/User";
import { Trip } from "../models/Trip";

const router = Router();

// Get current user (DB record, upsert from Clerk)
router.get('/me', requireAuthStrict, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const clerkUser = await clerkClient.users.getUser(userId);
    const dbUser = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $set: {
          email: clerkUser.primaryEmailAddress?.emailAddress,
          username: clerkUser.username,
          fullName: clerkUser.fullName || clerkUser.firstName || clerkUser.username,
          imageUrl: clerkUser.imageUrl,
          bio: (clerkUser.publicMetadata as any)?.bio || null,
          location: (clerkUser.publicMetadata as any)?.location || null,
          coverImage: (clerkUser.publicMetadata as any)?.coverImage || null,
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

// Update current user's profile (requires auth)
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

// Get user by Clerk ID (public)
router.get('/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    
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
      imageUrl: clerkUser.imageUrl,
      bio: (clerkUser.publicMetadata as any)?.bio || null,
      location: (clerkUser.publicMetadata as any)?.location || null,
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
    
    const dbUser = await User.findOneAndUpdate(
      { clerkId },
      { $set: updateData },
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
      followers: dbUser.followers || 0,
      following: dbUser.following || 0,
      totalLikes: dbUser.totalLikes || 0,
      createdAt: dbUser.createdAt || clerkUser.createdAt,
      _id: dbUser._id,
    };
    
    res.json(userData);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user', message: error.message });
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

export default router;


