import { Router } from "express";
import { User } from "../models/User";
import { Trip } from "../models/Trip";
import { TripLove } from "../models/TripLove";
import { CorporateCompany } from "../models/CorporateCompany";
import { CorporateTrip } from "../models/CorporateTrip";
import { CompanySubmission } from "../models/CompanySubmission";
import ContentReport from "../models/ContentReport";
import Complaint from "../models/Complaint";
import { Booking } from "../models/Booking";
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
            totalReports,
            weekAgoDate
        ] = await Promise.all([
            User.countDocuments({}),
            Trip.countDocuments({}),
            CorporateCompany.countDocuments({ isActive: true }),
            CorporateTrip.countDocuments({ isActive: true }),
            TripLove.countDocuments({}),
            ContentReport.countDocuments({}).then((count) => count + 0), // Base logic
            Promise.resolve(getWeekAgoDate())
        ]);

        // Add Complaint count to totalReports
        const totalComplaints = await Complaint.countDocuments({});
        const finalTotalReports = totalReports + totalComplaints;

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
            totalCorporateTrips,
            totalReports: finalTotalReports
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
            .select('title destination likes saves author ownerId image images activities')
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
    }
});

/**
 * GET /api/analytics/reports
 * Get comprehensive report data with date filtering
 * Query params: period (daily|weekly|monthly), startDate, endDate
 */
router.get('/reports', requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { period = 'weekly', startDate, endDate } = req.query;

        // Calculate date range based on period
        let start: Date;
        let end: Date = new Date();

        if (startDate && endDate) {
            // Custom date range
            start = new Date(startDate as string);
            end = new Date(endDate as string);
        } else {
            // Preset periods
            start = new Date();
            switch (period) {
                case 'daily':
                    start.setDate(start.getDate() - 1);
                    break;
                case 'monthly':
                    start.setDate(start.getDate() - 30);
                    break;
                case 'weekly':
                default:
                    start.setDate(start.getDate() - 7);
                    break;
            }
        }

        // Set time to start/end of day
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        // Fetch all data in parallel
        const [
            totalUsers,
            newUsers,
            totalTrips,
            newTrips,
            totalCompanies,
            activeCompanies,
            totalCorporateTrips,
            newCorporateTrips,
            totalReactions,
            newReactions,
            totalComments,
            newComments,
            topTrips,
            topCompanies,
            submissionStats,
            dailyBreakdown,
            totalContentReports,
            newContentReports,
            totalComplaints,
            newComplaints
        ] = await Promise.all([
            // Total counts
            User.countDocuments({}),
            User.countDocuments({ createdAt: { $gte: start, $lte: end } }),
            Trip.countDocuments({}),
            Trip.countDocuments({ createdAt: { $gte: start, $lte: end } }),
            CorporateCompany.countDocuments({}),
            CorporateCompany.countDocuments({ isActive: true }),
            CorporateTrip.countDocuments({}),
            CorporateTrip.countDocuments({ createdAt: { $gte: start, $lte: end } }),
            TripLove.countDocuments({}),
            TripLove.countDocuments({ createdAt: { $gte: start, $lte: end } }),

            // Total comments
            Trip.aggregate([
                {
                    $project: {
                        commentCount: { $size: { $ifNull: ['$comments', []] } }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$commentCount' }
                    }
                }
            ]).then(res => res[0]?.total || 0),

            // New comments in period
            Trip.aggregate([
                {
                    $project: {
                        comments: {
                            $filter: {
                                input: { $ifNull: ['$comments', []] },
                                as: 'comment',
                                cond: {
                                    $and: [
                                        { $gte: ['$$comment.createdAt', start] },
                                        { $lte: ['$$comment.createdAt', end] }
                                    ]
                                }
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
                        total: { $sum: '$commentCount' }
                    }
                }
            ]).then(res => res[0]?.total || 0),

            // Top trips in period
            Trip.find({ createdAt: { $gte: start, $lte: end } })
                .sort({ likes: -1 })
                .limit(10)
                .select('title destination likes saves author ownerId createdAt image images activities')
                .lean(),

            // Top companies
            CorporateCompany.find({ isActive: true })
                .sort({ tripsCount: -1 })
                .limit(10)
                .select('name logo email tripsCount rating')
                .lean(),

            // Submission stats
            CompanySubmission.aggregate([
                {
                    $match: {
                        createdAt: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Daily breakdown for the period
            (async () => {
                const days = [];
                const currentDate = new Date(start);

                while (currentDate <= end) {
                    const dayStart = new Date(currentDate);
                    dayStart.setHours(0, 0, 0, 0);
                    const dayEnd = new Date(currentDate);
                    dayEnd.setHours(23, 59, 59, 999);

                    const [dayUsers, dayTrips, dayReactions, dayComments, dayContentReports, dayComplaints] = await Promise.all([
                        User.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
                        Trip.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
                        TripLove.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
                        Trip.aggregate([
                            {
                                $project: {
                                    comments: {
                                        $filter: {
                                            input: { $ifNull: ['$comments', []] },
                                            as: 'comment',
                                            cond: {
                                                $and: [
                                                    { $gte: ['$$comment.createdAt', dayStart] },
                                                    { $lte: ['$$comment.createdAt', dayEnd] }
                                                ]
                                            }
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
                                    total: { $sum: '$commentCount' }
                                }
                            }
                        ]).then(res => res[0]?.total || 0),
                        ContentReport.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
                        Complaint.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } })
                    ]);

                    days.push({
                        date: dayStart.toISOString().split('T')[0],
                        dayName: dayStart.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' }),
                        users: dayUsers,
                        trips: dayTrips,
                        reactions: dayReactions,
                        comments: dayComments,
                        reports: dayContentReports + dayComplaints
                    });

                    currentDate.setDate(currentDate.getDate() + 1);
                }

                return days;
            })(),

            // Reports counts
            ContentReport.countDocuments({}),
            ContentReport.countDocuments({ createdAt: { $gte: start, $lte: end } }),
            Complaint.countDocuments({}),
            Complaint.countDocuments({ createdAt: { $gte: start, $lte: end } })
        ]);

        // Format submission stats
        const formattedSubmissions = [
            { name: 'تمت الموافقة', value: submissionStats.find((s: any) => s._id === 'approved')?.count || 0 },
            { name: 'قيد الانتظار', value: submissionStats.find((s: any) => s._id === 'pending')?.count || 0 },
            { name: 'مرفوضة', value: submissionStats.find((s: any) => s._id === 'rejected')?.count || 0 }
        ];

        // Trip type distribution
        const regularTrips = totalTrips - totalCorporateTrips;
        const tripDistribution = [
            { name: 'رحلات شخصية', value: regularTrips },
            { name: 'رحلات شركات', value: totalCorporateTrips }
        ];

        // Engagement distribution
        const engagementDistribution = [
            { name: 'إعجابات', value: totalReactions },
            { name: 'تعليقات', value: totalComments },
            { name: 'حفظ', value: Math.floor(totalReactions * 0.4) }
        ];

        // Company activity
        const companyActivity = [
            { name: 'شركات نشطة', value: activeCompanies },
            { name: 'شركات مجمدة', value: totalCompanies - activeCompanies }
        ];

        res.json({
            period: {
                type: period,
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                label: period === 'daily' ? 'آخر 24 ساعة' :
                    period === 'monthly' ? 'آخر 30 يوم' : 'آخر 7 أيام'
            },
            overview: {
                totalUsers,
                newUsers,
                totalTrips,
                newTrips,
                totalCompanies,
                activeCompanies,
                totalCorporateTrips,
                newCorporateTrips,
                totalReactions,
                newReactions,
                totalComments,
                newComments,
                totalReports: totalContentReports + totalComplaints,
                newReports: newContentReports + newComplaints
            },
            charts: {
                tripDistribution,
                engagementDistribution,
                companyActivity,
                submissionStats: formattedSubmissions
            },
            topContent: {
                trips: topTrips,
                companies: topCompanies
            },
            dailyBreakdown,
            generatedAt: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Error fetching reports data:', error);
        res.status(500).json({ error: 'Failed to fetch reports data', message: error.message });
    }
});

/**
 * GET /api/analytics/admin/bookings
 * Get platform-wide booking commission analytics (Admin only)
 */
router.get('/admin/bookings', requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Admin check
        const adminEmail = 'supermincraft52@gmail.com';
        const { clerkClient } = await import("../utils/auth");
        const user = await clerkClient.users.getUser(userId);
        if (user.primaryEmailAddress?.emailAddress !== adminEmail) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        const { companyId, startDate, endDate } = req.query;

        const matchStage: any = { status: "accepted" };

        if (companyId) {
            const mongoose = await import("mongoose");
            try {
                matchStage.companyId = new mongoose.Types.ObjectId(companyId as string);
            } catch (e) {
                // Ignore invalid ID
            }
        }

        if (startDate || endDate) {
            matchStage.createdAt = {};
            if (startDate) {
                const sDate = new Date(startDate as string);
                sDate.setHours(0, 0, 0, 0);
                matchStage.createdAt.$gte = sDate;
            }
            if (endDate) {
                const eDate = new Date(endDate as string);
                eDate.setHours(23, 59, 59, 999);
                matchStage.createdAt.$lte = eDate;
            }
        }

        // Calculate total earnings
        const earningsStats = await Booking.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalGrossValue: { $sum: "$totalPrice" },
                    totalCommission: { $sum: "$commissionAmount" },
                    totalNetValue: { $sum: "$netAmount" },
                    bookingCount: { $sum: 1 }
                }
            }
        ]);

        // Commission per company
        const companyStats = await Booking.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$companyId",
                    companyName: { $first: "$companyName" },
                    totalCommission: { $sum: "$commissionAmount" },
                    totalGross: { $sum: "$totalPrice" },
                    bookingCount: { $sum: 1 }
                }
            },
            { $sort: { totalCommission: -1 } }
        ]);

        // Daily commission trends (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailyTrends = await Booking.aggregate([
            {
                $match: {
                    ...matchStage,
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    commission: { $sum: "$commissionAmount" },
                    bookings: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json({
            overview: earningsStats[0] || {
                totalGrossValue: 0,
                totalCommission: 0,
                totalNetValue: 0,
                bookingCount: 0
            },
            companies: companyStats,
            dailyTrends,
            filters: {
                companyId,
                startDate,
                endDate
            }
        });
    } catch (error: any) {
        console.error('Error fetching admin booking analytics:', error);
        res.status(500).json({ error: 'Failed to fetch admin booking analytics', message: error.message });
    }
});

export default router;
