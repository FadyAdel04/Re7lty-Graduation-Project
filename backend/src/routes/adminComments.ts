import { Router } from "express";
import { requireAuthStrict } from "../utils/auth";
import { RemovedComment } from "../models/RemovedComment";
import { Trip } from "../models/Trip";

const router = Router();

// Stats
router.get("/stats", requireAuthStrict, async (req, res) => {
    try {
        // Count Removed
        const removedCount = await RemovedComment.countDocuments();

        // Count All (Embedded) - this is heavy but okay for MVP admin
        const tripStats = await Trip.aggregate([
            { $unwind: "$comments" },
            { $count: "totalComments" }
        ]);
        const totalComments = tripStats[0]?.totalComments || 0;

        // Sentiment Analysis
        const allActiveComments = await Trip.aggregate([
            { $unwind: "$comments" },
            { $project: { content: "$comments.content" } }
        ]);

        let positive = 0;
        let neutral = 0;
        let negative = 0; // Starts with removed count

        const positiveWords = ['love', 'great', 'amazing', 'beautiful', 'awesome', 'best', 'nice', 'شكرا', 'جميل', 'رائع', 'ممتاز', 'احب', 'عظمة', 'تحفة', 'حلو', 'good'];
        const negativeWords = ['bad', 'poor', 'slow', 'ugly', 'worst', 'hate', 'terrible', 'سيء', 'زفت', 'قرف', 'مشكلة', 'بطيء', 'غالي', 'ممل'];

        allActiveComments.forEach(c => {
            const text = (c.content || "").toLowerCase();
            const isPositive = positiveWords.some(w => text.includes(w));
            const isNegative = negativeWords.some(w => text.includes(w));

            if (isPositive) positive++;
            else if (isNegative) negative++; // Mild negative in active comments
            else neutral++;
        });

        // Add removed comments to negative count (they are confirmed toxic)
        negative += removedCount;

        res.json({
            totalComments,
            removedCount,
            toxicRatio: totalComments > 0 ? ((removedCount / (totalComments + removedCount)) * 100).toFixed(2) : 0,
            sentiment: {
                positive,
                neutral,
                negative
            }
        });
    } catch (error: any) {
        console.error("Error fetching comment stats:", error);
        res.status(500).json({ error: "Failed to fetch stats", message: error.message });
    }
});

// Get Removed Comments
router.get("/removed", requireAuthStrict, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const comments = await RemovedComment.find().sort({ removedAt: -1 }).skip(skip).limit(Number(limit));
        const total = await RemovedComment.countDocuments();

        res.json({ comments, total, page, limit });
    } catch (error: any) {
        console.error("Error fetching removed comments:", error);
        res.status(500).json({ error: "Failed to fetch moved comments", message: error.message });
    }
});

// Get All Comments
router.get("/all", requireAuthStrict, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        // Aggregate to paginate embedded comments
        const comments = await Trip.aggregate([
            { $unwind: "$comments" },
            { $sort: { "comments.date": -1 } },
            { $skip: skip },
            { $limit: Number(limit) },
            {
                $lookup: {
                    from: "users",
                    let: { authId: "$comments.authorId" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$clerkId", "$$authId"] } } },
                        { $project: { imageUrl: 1, fullName: 1 } }
                    ],
                    as: "userDetails"
                }
            },
            {
                $addFields: {
                    "comments.authorAvatar": { $arrayElemAt: ["$userDetails.imageUrl", 0] }
                }
            },
            {
                $project: {
                    _id: "$comments._id",
                    content: "$comments.content",
                    authorId: "$comments.authorId",
                    author: "$comments.author",
                    authorAvatar: { $ifNull: [{ $arrayElemAt: ["$userDetails.imageUrl", 0] }, "$comments.authorAvatar"] },
                    date: "$comments.date",
                    tripId: "$_id",
                    tripTitle: "$title"
                }
            }
        ]);

        // Total count for pagination
        const tripStats = await Trip.aggregate([
            { $unwind: "$comments" },
            { $count: "total" }
        ]);
        const total = tripStats[0]?.total || 0;

        res.json({ comments, total, page, limit });
    } catch (error: any) {
        console.error("Error fetching all comments:", error);
        res.status(500).json({ error: "Failed to fetch all comments", message: error.message });
    }
});

export default router;
