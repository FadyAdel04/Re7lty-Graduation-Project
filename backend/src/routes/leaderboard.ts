import { Router } from "express";
import { Trip } from "../models/Trip";
import { Leaderboard } from "../models/Leaderboard";
import { requireAuthStrict, getAuth, clerkClient } from "../utils/auth";
import mongoose from "mongoose";

const router = Router();

// Helper to get current ISO week number
const getWeekNumber = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// Helper to get start of current week (Sunday)
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = d.getDate() - day; 
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
};

/**
 * GET /api/leaderboard/current
 * Calculate the live leaderboard for the current week
 */
router.get('/current', async (req, res) => {
  try {
    const startOfWeek = getStartOfWeek(new Date());
    
    // Fetch ALL trips posted this week
    const currentWeekTrips = await Trip.find({ 
      postedAt: { $gte: startOfWeek } 
    })
    .sort({ weeklyLikes: -1, likes: -1 })
    .limit(50) // Increased limit to show more trips
    .lean();

    // Map to a consistent format
    const formatted = currentWeekTrips.map((trip, index) => ({
      _id: trip._id,
      title: trip.title,
      author: trip.author,
      ownerId: trip.ownerId,
      image: trip.image,
      likes: trip.likes,
      weeklyLikes: trip.weeklyLikes,
      rank: index + 1,
      engagementScore: trip.weeklyLikes
    }));

    res.json(formatted);
  } catch (error: any) {
    console.error('Error fetching current leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch current leaderboard', message: error.message });
  }
});

/**
 * GET /api/leaderboard/history
 * List all historical leaders for each week
 */
router.get('/history', async (req, res) => {
  try {
    const history = await Leaderboard.find({})
      .sort({ year: -1, weekNumber: -1 })
      .limit(52) // Last year of history
      .lean();
    
    res.json(history);
  } catch (error: any) {
    console.error('Error fetching leaderboard history:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard history', message: error.message });
  }
});

/**
 * GET /api/leaderboard/history/:id
 * Get details for a specific historical week
 */
router.get('/history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await Leaderboard.findById(id).lean();
    if (!entry) return res.status(404).json({ error: 'Leaderboard entry not found' });
    
    // Fetch ALL trips from the archive period
    const archiveTrips = await Trip.find({
      postedAt: { $gte: entry.startDate, $lte: entry.endDate }
    })
    .sort({ likes: -1 })
    .limit(100)
    .lean();

    res.json({
      ...entry,
      allTrips: archiveTrips.map((trip, index) => ({
        _id: trip._id,
        title: trip.title,
        author: trip.author,
        ownerId: trip.ownerId,
        image: trip.image,
        likes: trip.likes,
        rank: index + 1,
        // For archived trips, we show the overall likes at that time (or current)
      }))
    });
  } catch (error: any) {
    console.error('Error fetching leaderboard entry:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard entry', message: error.message });
  }
});

/**
 * POST /api/leaderboard/end-week (Admin Only)
 * Close the current week, save winners, and reset weeklyLikes
 */
router.post('/end-week', requireAuthStrict, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Admin check
    const adminEmail = 'supermincraft52@gmail.com';
    const user = await clerkClient.users.getUser(userId);
    if (user.primaryEmailAddress?.emailAddress !== adminEmail) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const now = new Date();
    const week = getWeekNumber(now);
    const year = now.getFullYear();

    // 1. Get current top 10
    const topTrips = await Trip.find({})
      .sort({ weeklyLikes: -1, likes: -1 })
      .limit(10)
      .lean();

    if (topTrips.length === 0) {
      return res.status(400).json({ error: 'No trips with weekly activity to archive.' });
    }

    // Identify winners
    const winners = topTrips.map((trip, idx) => ({
      tripId: trip._id,
      rank: idx + 1,
      score: trip.weeklyLikes,
      winnerName: trip.author,
      tripTitle: trip.title,
      tripImage: trip.image,
      ownerId: trip.ownerId
    }));

    // Start/End dates for the week
    const endDate = new Date(now);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7);

    // 2. Save to Leaderboard history
    const historyEntry = await Leaderboard.findOneAndUpdate(
      { weekNumber: week, year: year },
      {
        $set: {
          startDate,
          endDate,
          winners,
          label: `الأسبوع ${week}, ${year}`
        }
      },
      { upsert: true, new: true }
    );

    // 3. Reset weeklyLikes for ALL trips
    const resetResult = await Trip.updateMany({}, { $set: { weeklyLikes: 0 } });

    res.json({
      success: true,
      message: `Week ${week} finalized and archived.`,
      archivedEntry: historyEntry,
      resetCount: resetResult.modifiedCount
    });
  } catch (error: any) {
    console.error('Error ending leaderboard week:', error);
    res.status(500).json({ error: 'Failed to finalize week', message: error.message });
  }
});

export default router;
