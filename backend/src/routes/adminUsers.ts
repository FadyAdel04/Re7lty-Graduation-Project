import { Router } from "express";
import { User } from "../models/User";
import { Trip } from "../models/Trip";
import { requireAuthStrict, getAuth } from "../utils/auth";

const router = Router();

// Get all users (admin only)
router.get('/', requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check if user is admin (you can add admin check here)
        const adminEmail = 'supermincraft52@gmail.com';
        // For now, we'll allow any authenticated user to fetch all users
        // In production, you should verify admin status

        // Fetch all users from database
        const users = await User.find({})
            .select('clerkId fullName username email imageUrl createdAt followers following trips')
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

export default router;
