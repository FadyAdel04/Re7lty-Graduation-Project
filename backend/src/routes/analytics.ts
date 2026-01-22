import { Router } from "express";
import { User } from "../models/User";
import { Trip } from "../models/Trip";
import { TripLove } from "../models/TripLove";
import { CorporateCompany } from "../models/CorporateCompany";
import { CorporateTrip } from "../models/CorporateTrip";
import { CompanySubmission } from "../models/CompanySubmission";
import { requireAuthStrict, getAuth } from "../utils/auth";

const router = Router();

// Helper function to get date range for weekly stats
const getWeekAgoDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
};

/**
 * GET /api/analytics/overview
 * Get overall platform statistics
 */
router.get('/overview', requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get all counts in parallel
        const [
            totalUsers,
            totalTrips,
            totalCompanies,
            totalCorporateTrips,
            totalReactions,
            weekAgoDate
        ] = await Promise.all([
            User.countDocuments({}),
            Trip.countDocuments({}),
            CorporateCompany.countDocuments({ isActive: true }),
            CorporateTrip.countDocuments({ isActive: true }),
            TripLove.countDocuments({}),
            Promise.resolve(getWeekAgoDate())
        ]);

        // Get weekly active users (users who created trips or reacted in last 7 days)
        const [weeklyActiveUsers, weeklyTrips, weeklyReactions] = await Promise.all([
            User.countDocuments({
                $or: [
                    { createdAt: { $gte: weekAgoDate } },
                    { updatedAt: { $gte: weekAgoDate } }
                ]
            }),
            Trip.countDocuments({ createdAt: { $gte: weekAgoDate } }),
            TripLove.countDocuments({ createdAt: { $gte: weekAgoDate } })
        ]);

        // Get total comments (from trips)
        const tripsWithComments = await Trip.aggregate([
            {
                $project: {
                    commentCount: { $size: { $ifNull: ['$comments', []] } }
                }
            },
            {
                $group: {
                    _id: null,
                    totalComments: { $sum: '$commentCount' }
                }
            }
        ]);

        const totalComments = tripsWithComments[0]?.totalComments || 0;

        // Get weekly comments
        const tripsWithWeeklyComments = await Trip.aggregate([
            {
                $project: {
                    comments: {
                        $filter: {
                            input: { $ifNull: ['$comments', []] },
                            as: 'comment',
                            cond: { $gte: ['$$comment.createdAt', weekAgoDate] }
                        }
                    }
                }
            },
            {
                $project: {
                    commentCount: { $size: '$comments' }
                }
            },
            {
                $group: {
                    _id: null,
                    totalComments: { $sum: '$commentCount' }
                }
            }
        ]);

        const weeklyComments = tripsWithWeeklyComments[0]?.totalComments || 0;

        res.json({
            totalUsers,
            weeklyActiveUsers,
            totalTrips,
            weeklyTrips,
            totalReactions,
            weeklyReactions,
            totalComments,
            weeklyComments,
            totalCompanies,
            totalCorporateTrips
        });
    } catch (error: any) {
        console.error('Error fetching overview analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics', message: error.message });
    }
});

/**
 * GET /api/analytics/weekly-activity
 * Get weekly activity trends (last 7 days)
 */
router.get('/weekly-activity', requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const weekAgo = getWeekAgoDate();
        const days = [];

        // Generate last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const [newUsers, newTrips, newReactions] = await Promise.all([
                User.countDocuments({ createdAt: { $gte: date, $lt: nextDate } }),
                Trip.countDocuments({ createdAt: { $gte: date, $lt: nextDate } }),
                TripLove.countDocuments({ createdAt: { $gte: date, $lt: nextDate } })
            ]);

            days.push({
                date: date.toISOString().split('T')[0],
                dayName: date.toLocaleDateString('ar-EG', { weekday: 'short' }),
                users: newUsers,
                trips: newTrips,
                reactions: newReactions
            });
        }

        res.json(days);
    } catch (error: any) {
        console.error('Error fetching weekly activity:', error);
        res.status(500).json({ error: 'Failed to fetch weekly activity', message: error.message });
    }
});

/**
 * GET /api/analytics/users/all
 * Get all users (admin only)
 */
router.get('/users/all', requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Fetch all users from database
        const users = await User.find({})
            .select('clerkId fullName username email imageUrl createdAt followers following')
            .lean();

        // Get trip counts for each user
        const usersWithTrips = await Promise.all(
            users.map(async (user) => {
                const tripCount = await Trip.countDocuments({ ownerId: user.clerkId });
                return {
                    ...user,
                    trips: tripCount
                };
            })
        );

        res.json(usersWithTrips);
    } catch (error: any) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ error: 'Failed to fetch users', message: error.message });
    }
});

/**
 * GET /api/analytics/top-trips
 * Get top performing trips by likes
 */
router.get('/top-trips', requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const limit = parseInt(req.query.limit as string) || 5;

        const topTrips = await Trip.find({})
            .sort({ likes: -1 })
            .limit(limit)
            .select('title destination likes saves author ownerId')
            .lean();

        res.json(topTrips);
    } catch (error: any) {
        console.error('Error fetching top trips:', error);
        res.status(500).json({ error: 'Failed to fetch top trips', message: error.message });
    }
});

/**
 * GET /api/analytics/submissions
 * Get company submission statistics
 */
router.get('/submissions', requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const submissionStats = await CompanySubmission.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedStats = submissionStats.map(stat => ({
            status: stat._id,
            count: stat.count
        }));

        res.json(formattedStats);
    } catch (error: any) {
        console.error('Error fetching submission stats:', error);
        res.status(500).json({ error: 'Failed to fetch submission stats', message: error.message });
    }
});

/**
 * GET /api/analytics/companies/activity
 * Get company activity statistics
 */
router.get('/companies/activity', requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const [activeCompanies, inactiveCompanies] = await Promise.all([
            CorporateCompany.countDocuments({ isActive: true }),
            CorporateCompany.countDocuments({ isActive: false })
        ]);

        res.json({
            active: activeCompanies,
            inactive: inactiveCompanies
        });
    } catch (error: any) {
        console.error('Error fetching company activity:', error);
        res.status(500).json({ error: 'Failed to fetch company activity', message: error.message });
    }
});

export default router;
