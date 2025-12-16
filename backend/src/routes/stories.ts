import { Router } from "express";
import mongoose from "mongoose";
import { requireAuthStrict, getAuth, clerkClient } from "../utils/auth";
import { Story } from "../models/Story";
import { Follow } from "../models/Follow";

const router = Router();

// Helper: build expiry time (24h from now)
function getExpiresAt(): Date {
  const now = new Date();
  return new Date(now.getTime() + 24 * 60 * 60 * 1000);
}

// Create story
router.post("/", requireAuthStrict, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database not connected",
        message: "MongoDB connection is required.",
      });
    }

    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { mediaUrl, mediaType, caption } = req.body || {};

    if (!mediaUrl || typeof mediaUrl !== "string") {
      return res.status(400).json({ error: "mediaUrl is required" });
    }
    if (!mediaType || !["image", "video"].includes(mediaType)) {
      return res.status(400).json({ error: "mediaType must be 'image' or 'video'" });
    }

    const expiresAt = getExpiresAt();

    const story = await Story.create({
      userId,
      mediaUrl,
      mediaType,
      caption: typeof caption === "string" ? caption.slice(0, 500) : undefined,
      expiresAt,
      isActive: true,
    });

    res.status(201).json({ story });
  } catch (error: any) {
    console.error("Error creating story:", error);
    res.status(500).json({ error: "Failed to create story", message: error.message });
  }
});

// Get my active stories
router.get("/me", requireAuthStrict, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database not connected",
        message: "MongoDB connection is required.",
      });
    }

    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const now = new Date();
    const stories = await Story.find({
      userId,
      expiresAt: { $gt: now },
    })
      .sort({ createdAt: 1 })
      .lean();

    const mapped = stories.map((s: any) => ({
      ...s,
      viewedByCount: Array.isArray(s.viewedBy) ? s.viewedBy.length : 0,
    }));

    res.json({ items: mapped });
  } catch (error: any) {
    console.error("Error fetching my stories:", error);
    res.status(500).json({ error: "Failed to fetch stories", message: error.message });
  }
});

// Get stories from people I follow
router.get("/following", requireAuthStrict, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database not connected",
        message: "MongoDB connection is required.",
      });
    }

    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const now = new Date();

    const follows = await Follow.find({ followerId: userId }).select("followingId");
    const followingIds = follows.map((f: any) => f.followingId);

    if (!followingIds.length) {
      return res.json({ users: [] });
    }

    const stories = await Story.find({
      userId: { $in: followingIds },
      expiresAt: { $gt: now },
    })
      .sort({ createdAt: 1 })
      .lean();

    // Group stories by userId
    const byUser = new Map<string, any[]>();
    for (const story of stories) {
      const key = story.userId as string;
      if (!byUser.has(key)) byUser.set(key, []);
      byUser.get(key)!.push(story);
    }

    // Fetch basic user info from Clerk in parallel
    const userIds = Array.from(byUser.keys());
    const clerkUsers = await Promise.all(
      userIds.map(async (id) => {
        try {
          const u = await clerkClient.users.getUser(id);
          return { id, fullName: u.fullName || u.firstName || u.username || "مستخدم", imageUrl: u.imageUrl };
        } catch {
          return { id, fullName: "مستخدم", imageUrl: undefined };
        }
      })
    );
    const clerkById = new Map(clerkUsers.map((u) => [u.id, u]));

    const groups = userIds.map((uid) => {
      const storiesForUser = byUser.get(uid) || [];
      const clerkUser = clerkById.get(uid);
      const latest = storiesForUser[storiesForUser.length - 1];

      const items = storiesForUser.map((s) => ({
        _id: s._id,
        mediaUrl: s.mediaUrl,
        mediaType: s.mediaType,
        caption: s.caption,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        seen: Array.isArray(s.viewedBy) ? s.viewedBy.includes(userId) : false,
      }));

      return {
        userId: uid,
        fullName: clerkUser?.fullName || "مستخدم",
        imageUrl: clerkUser?.imageUrl,
        hasUnseen: items.some((i) => !i.seen),
        latestCreatedAt: latest?.createdAt,
        stories: items,
      };
    });

    // Sort users by most recent story
    groups.sort((a, b) => {
      const ad = a.latestCreatedAt ? new Date(a.latestCreatedAt).getTime() : 0;
      const bd = b.latestCreatedAt ? new Date(b.latestCreatedAt).getTime() : 0;
      return bd - ad;
    });

    res.json({ users: groups });
  } catch (error: any) {
    console.error("Error fetching following stories:", error);
    res.status(500).json({ error: "Failed to fetch stories", message: error.message });
  }
});

// Mark story as viewed
router.post("/:id/view", requireAuthStrict, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database not connected",
        message: "MongoDB connection is required.",
      });
    }

    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const storyId = req.params.id;

    const now = new Date();
    const story = await Story.findOneAndUpdate(
      { _id: storyId, expiresAt: { $gt: now } },
      { $addToSet: { viewedBy: userId } },
      { new: true }
    );

    if (!story) {
      return res.status(404).json({ error: "Story not found or expired" });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error marking story viewed:", error);
    res.status(500).json({ error: "Failed to mark story viewed", message: error.message });
  }
});

// Get viewers for a story (owner only)
router.get("/:id/viewers", requireAuthStrict, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database not connected",
        message: "MongoDB connection is required.",
      });
    }

    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const storyId = req.params.id;
    const story = await Story.findById(storyId).lean();
    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }
    if (story.userId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const viewerIds: string[] = Array.isArray(story.viewedBy) ? story.viewedBy : [];
    if (!viewerIds.length) {
      return res.json({ storyId, total: 0, viewers: [] });
    }

    const uniqueIds = Array.from(new Set(viewerIds));
    const viewerUsers = await Promise.all(
      uniqueIds.map(async (vid) => {
        try {
          const u = await clerkClient.users.getUser(vid);
          return {
            userId: vid,
            fullName: u.fullName || u.firstName || u.username || "مستخدم",
            imageUrl: u.imageUrl,
          };
        } catch {
          return {
            userId: vid,
            fullName: "مستخدم",
            imageUrl: undefined,
          };
        }
      })
    );

    res.json({
      storyId,
      total: viewerIds.length,
      viewers: viewerUsers,
    });
  } catch (error: any) {
    console.error("Error fetching story viewers:", error);
    res.status(500).json({ error: "Failed to fetch story viewers", message: error.message });
  }
});

// Delete my story
router.delete("/:id", requireAuthStrict, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database not connected",
        message: "MongoDB connection is required.",
      });
    }

    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const story = await Story.findOne({ _id: req.params.id, userId });
    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    await story.deleteOne();
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting story:", error);
    res.status(500).json({ error: "Failed to delete story", message: error.message });
  }
});

export default router;


