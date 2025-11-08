import { Router } from "express";
import mongoose from "mongoose";
import { Trip } from "../models/Trip";
import { User } from "../models/User";

const router = Router();

// Search endpoint - searches both trips and users
router.get('/', async (req, res) => {
  try {
    const { q, limit = '10' } = req.query as any;
    
    if (!q || !q.trim()) {
      return res.json({ trips: [], users: [] });
    }

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected', 
        message: 'MongoDB connection is required.' 
      });
    }

    const searchQuery = String(q).trim();
    const searchLimit = Number(limit);

    // Search trips - in title, destination, city, description, and author
    const tripFilter = {
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { destination: { $regex: searchQuery, $options: 'i' } },
        { city: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { author: { $regex: searchQuery, $options: 'i' } },
      ]
    };

    // Search users - in fullName, username, bio, and location
    const userFilter = {
      $or: [
        { fullName: { $regex: searchQuery, $options: 'i' } },
        { username: { $regex: searchQuery, $options: 'i' } },
        { bio: { $regex: searchQuery, $options: 'i' } },
        { location: { $regex: searchQuery, $options: 'i' } },
      ]
    };

    const [trips, users] = await Promise.all([
      Trip.find(tripFilter)
        .select('_id title destination city image author ownerId')
        .limit(searchLimit)
        .sort({ postedAt: -1 }),
      User.find(userFilter)
        .select('clerkId fullName username imageUrl bio location')
        .limit(searchLimit)
    ]);

    res.json({ trips, users });
  } catch (error: any) {
    console.error('Error searching:', error);
    res.status(500).json({ error: 'Failed to search', message: error.message });
  }
});

export default router;

