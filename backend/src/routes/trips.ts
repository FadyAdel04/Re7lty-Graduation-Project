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
import { toxicityService } from "../utils/toxicity";
import ContentReport from "../models/ContentReport";
import { TravelCompanyRequest } from "../models/TravelCompanyRequest";
import { CorporateCompany } from "../models/CorporateCompany";
import { CorporateTrip } from "../models/CorporateTrip";
import {
  createTravelRequestWithChat,
  sendCompanyChatMessage,
} from "../utils/travelCompanyRequestChat";

async function resolveCompanyIdForOwner(userId: string) {
  const user = await User.findOne({ clerkId: userId });
  let companyId = user?.companyId;

  if (!companyId) {
    const company = await CorporateCompany.findOne({
      $or: [{ ownerId: userId }, { createdBy: userId }],
    });
    if (company) companyId = company._id as typeof companyId;
  }

  return companyId;
}

async function assertCompanyOwnsRequest(userId: string, request: { companyId: string }) {
  const companyId = await resolveCompanyIdForOwner(userId);
  if (!companyId || companyId.toString() !== request.companyId.toString()) {
    return null;
  }
  return companyId;
}

// Configure Cloudinary if credentials are available
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const router = Router();

// Route to get signature for signed Cloudinary upload from frontend
router.get("/cloudinary-signature", requireAuthStrict, (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp: timestamp,
      folder: 're7lty/frontend_uploads',
    },
    process.env.CLOUDINARY_API_SECRET!
  );

  res.json({
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder: 're7lty/frontend_uploads'
  });
});


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
  // Handle demo user bypass
  if (userId.startsWith('user_2r9nE5R8r7TzK6pM9wL1vQ3xH4j')) {
    return {
      actorName: "Demo User",
      actorImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"
    };
  }

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
    const { q, city, season, type, authorId, postType, sort = 'recent', page = '1', limit = '20' } = req.query as any;
    const filter: any = {};
    const authInfo = getAuth(req);
    const viewerId = authInfo.userId || undefined;

    // Filter by specific author
    if (authorId) {
      filter.ownerId = authorId;
    }

    // Filter by type (company or traveler)
    if (type) {
      const users = await User.find({ profileType: type === 'company' ? 'company' : 'user' }).select('clerkId');
      const ownerIds = users.map(u => u.clerkId);
      filter.ownerId = { $in: ownerIds };
    }

    if (postType) {
      filter.postType = postType;
    }

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

/**
 * GET /api/travel-companies
 * Returns a list of travel companies serving a specific destination
 */
router.get("/travel-companies", async (req, res) => {
  try {
    const { destination } = req.query;
    if (!destination) {
      return res.status(400).json({ error: "Destination parameter is required" });
    }

    const destStr = String(destination).trim();

    // 1. Find active corporate trips matching this destination
    const trips = await CorporateTrip.find({
      destination: { $regex: destStr, $options: "i" },
      isActive: true,
    }).select("companyId");

    const companyIdsFromTrips = trips.map(t => t.companyId.toString());

    // 2. Find all active companies
    const allCompanies = await CorporateCompany.find({ isActive: true });

    // 3. Map companies to the format expected by the frontend
    const mappedCompanies = allCompanies.map((c: any) => {
      const hasMatchingTrip = companyIdsFromTrips.includes(c._id.toString());
      
      const textMatches =
        c.name.toLowerCase().includes(destStr.toLowerCase()) ||
        c.description.toLowerCase().includes(destStr.toLowerCase()) ||
        (c.tags && c.tags.some((tag: string) => tag.toLowerCase().includes(destStr.toLowerCase())));

      const isMatch = hasMatchingTrip || textMatches;
      const establishedYear = c.createdAt ? new Date(c.createdAt).getFullYear() : 2024;

      return {
        id: c._id.toString(),
        name: c.name,
        nameAr: c.name, // Return original name
        rating: c.rating || 4.5,
        reviewCount: Math.round((c.rating || 4.5) * 12 + 10),
        website: c.contactInfo?.website || "",
        phone: c.contactInfo?.phone || "",
        email: c.contactInfo?.email || "",
        whatsapp: c.contactInfo?.whatsapp || "",
        services: c.tags || [],
        logo: c.logo || "",
        color: c.color || "from-blue-500 to-cyan-500",
        destinations: [destStr], // Return matching destination to pass frontend filter
        logoEmoji: "🏢",
        specialties: c.tags?.slice(0, 3) || [],
        city: c.contactInfo?.address || "مصر",
        established: establishedYear,
        isMatch,
      };
    });

    // 4. Filter to only matching companies, or if none match, return all active companies as general recommendations
    let filtered = mappedCompanies.filter(c => c.isMatch);
    if (filtered.length === 0) {
      filtered = mappedCompanies;
    }

    filtered.sort((a, b) => b.rating - a.rating);

    res.json(filtered);
  } catch (error: any) {
    console.error("Error fetching travel companies:", error);
    res.status(500).json({ error: "Failed to fetch travel companies", message: error.message });
  }
});

/**
 * POST /api/travel-company-requests
 * Stores a request, opens a company chat, and sends the trip summary as the first message
 */
router.post("/travel-company-requests", requireAuthStrict, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      companyId,
      companyName,
      destination,
      travelDates,
      numberOfTravelers,
      budget,
      tripDetails,
      message,
    } = req.body;

    if (!companyId || !companyName || !destination) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ error: "Invalid company ID" });
    }

    const company = await CorporateCompany.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const payload = {
      companyId,
      companyName,
      destination,
      travelDates,
      numberOfTravelers: numberOfTravelers || 1,
      budget,
      tripDetails,
      message,
    };

    const { conversation } = await createTravelRequestWithChat(userId, payload);

    const newRequest = new TravelCompanyRequest({
      userId,
      companyId,
      companyName,
      destination,
      travelDates,
      numberOfTravelers: numberOfTravelers || 1,
      budget,
      tripDetails,
      message,
      status: "pending",
      conversationId: conversation._id,
    });

    await newRequest.save();

    res.status(201).json({
      message: "Trip request sent successfully to the travel company!",
      request: newRequest,
      conversationId: conversation._id,
    });
  } catch (error: any) {
    console.error("Error creating travel company request:", error);
    res.status(500).json({ error: "Failed to submit request", message: error.message });
  }
});

/**
 * GET /api/travel-company-requests/company
 * Lists trip requests for the logged-in company owner
 */
router.get("/travel-company-requests/company", requireAuthStrict, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const companyId = await resolveCompanyIdForOwner(userId);
    if (!companyId) {
      return res.status(404).json({ error: "Company not found for this user" });
    }

    const requests = await TravelCompanyRequest.find({ companyId: companyId.toString() })
      .sort({ requestedAt: -1 })
      .lean();

    const userIds = [...new Set(requests.map((r) => r.userId))];
    const users = await User.find({ clerkId: { $in: userIds } }).select("clerkId fullName imageUrl").lean();
    const userMap = Object.fromEntries(users.map((u) => [u.clerkId, u]));

    const enriched = requests.map((r) => ({
      ...r,
      user: userMap[r.userId] || null,
    }));

    res.json(enriched);
  } catch (error: any) {
    console.error("Error fetching company travel requests:", error);
    res.status(500).json({ error: "Failed to retrieve requests", message: error.message });
  }
});

/**
 * GET /api/travel-company-requests
 * Retrieves all requests sent by the logged-in user to travel companies
 */
router.get("/travel-company-requests", requireAuthStrict, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const requests = await TravelCompanyRequest.find({ userId }).sort({ requestedAt: -1 }).lean();

    const companyIds = [...new Set(requests.map((r) => r.companyId).filter(Boolean))].filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );
    const companies = await CorporateCompany.find({ _id: { $in: companyIds } })
      .select("name logo")
      .lean();
    const companyMap = Object.fromEntries(companies.map((c) => [c._id.toString(), c]));

    const enriched = requests.map((r) => ({
      ...r,
      company: companyMap[r.companyId] || { name: r.companyName, logo: "" },
    }));

    res.json(enriched);
  } catch (error: any) {
    console.error("Error retrieving travel company requests:", error);
    res.status(500).json({ error: "Failed to retrieve requests", message: error.message });
  }
});

/**
 * PATCH /api/travel-company-requests/:requestId
 * Company updates request status (viewed / responded / declined)
 */
router.patch("/travel-company-requests/:requestId", requireAuthStrict, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const request = await TravelCompanyRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });

    const companyId = await assertCompanyOwnsRequest(userId, request);
    if (!companyId) return res.status(403).json({ error: "Unauthorized" });

    const { status, companyNotes, quotedPrice } = req.body;
    const allowed = ["viewed", "responded", "declined"];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    if (status) request.status = status;
    if (companyNotes !== undefined) request.companyNotes = companyNotes;
    if (quotedPrice !== undefined) request.quotedPrice = quotedPrice;

    await request.save();
    res.json(request);
  } catch (error: any) {
    console.error("Error updating travel company request:", error);
    res.status(500).json({ error: "Failed to update request", message: error.message });
  }
});

/**
 * POST /api/travel-company-requests/:requestId/confirm
 * Company confirms the custom trip booking and notifies the traveler in chat
 */
router.post("/travel-company-requests/:requestId/confirm", requireAuthStrict, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const request = await TravelCompanyRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });

    const companyId = await assertCompanyOwnsRequest(userId, request);
    if (!companyId) return res.status(403).json({ error: "Unauthorized" });

    if (request.status === "confirmed") {
      return res.status(400).json({ error: "Request already confirmed" });
    }

    const company = await CorporateCompany.findById(companyId);
    if (!company) return res.status(404).json({ error: "Company not found" });

    const { quotedPrice, companyNotes, replyMessage } = req.body;
    const finalPrice = quotedPrice ?? request.quotedPrice;
    const notes = companyNotes ?? request.companyNotes;

    request.status = "confirmed";
    request.confirmedAt = new Date();
    if (finalPrice != null) request.quotedPrice = finalPrice;
    if (notes) request.companyNotes = notes;
    await request.save();

    const confirmationLines = [
      "✅ **تم تأكيد حجز رحلتك!**",
      "",
      `🏢 ${company.name}`,
      `📍 الوجهة: ${request.destination}`,
      `👥 عدد المسافرين: ${request.numberOfTravelers || 1}`,
    ];
    if (finalPrice != null) {
      confirmationLines.push(`💰 السعر المعتمد: ${Number(finalPrice).toLocaleString()} ج.م`);
    }
    if (notes) {
      confirmationLines.push(`📝 ملاحظات: ${notes}`);
    }
    if (replyMessage) {
      confirmationLines.push("", replyMessage);
    }
    confirmationLines.push("", "سيتواصل معك فريق الشركة لإتمام التفاصيل. نتمنى لك رحلة سعيدة! 🌴");

    const conversationId = request.conversationId;
    if (conversationId) {
      await sendCompanyChatMessage(conversationId, userId, "company", confirmationLines.join("\n"));
    }

    await createNotification({
      recipientId: request.userId,
      actorId: userId,
      actorName: company.name,
      type: "system",
      message: `🎉 ${company.name} أكّدت حجز رحلتك إلى ${request.destination}!`,
      metadata: {
        conversationId: request.conversationId,
        action: "travel_request_confirmed",
        requestId: request._id,
      },
    });

    res.json({ success: true, request });
  } catch (error: any) {
    console.error("Error confirming travel company request:", error);
    res.status(500).json({ error: "Failed to confirm request", message: error.message });
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

    // Check if it's a demo user
    if (userId.startsWith('user_2r9nE5R8r7TzK6pM9wL1vQ3xH4j')) {
      clerkUser = {
        fullName: "Demo User",
        imageUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
        username: "demo_user"
      };
    } else {
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
    }

    // AI trip quota: 3 per user per week (rolling 7 days)
    if (req.body.isAIGenerated === true) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const count = await Trip.countDocuments({
        ownerId: userId,
        isAIGenerated: true,
        postedAt: { $gte: weekAgo },
      });
      if (count >= 20) {
        return res.status(429).json({
          error: 'AI trip quota exceeded',
          message: 'لقد استخدمت الحد الأسبوعي لإنشاء الرحلات بالذكاء الاصطناعي (20 رحلة). يرجى المحاولة الأسبوع المقبل.',
        });
      }
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
      const isCloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

      // Calculate approximate size (base64 is ~1.33x original size)
      const approxSizeMB = dataUrl.length / (1024 * 1024);

      if (!isCloudinaryConfigured) {
        if (approxSizeMB > 4) { // 4MB base64 limit for MongoDB
          throw new Error(`Cloudinary not configured and file is too large (${approxSizeMB.toFixed(1)}MB) to store in database. Please configure Cloudinary.`);
        }
        console.warn(`[Trip Creation] Cloudinary not configured. Storing small media (${approxSizeMB.toFixed(1)}MB) as base64 in MongoDB.`);
        return dataUrl;
      }

      const [, mediaType, ext, b64] = match;

      try {
        // Upload to Cloudinary (accepts data URL string directly)
        const uploadResult = await cloudinary.uploader.upload(
          `data:${mediaType}/${ext};base64,${b64}`,
          {
            folder: `re7lty/${subdir}`,
            resource_type: 'auto',
          }
        );

        console.log(`[Trip Creation] Successfully uploaded to Cloudinary: ${uploadResult.secure_url}`);
        return uploadResult.secure_url;
      } catch (error: any) {
        console.error(`[Trip Creation] Cloudinary upload failed: ${error.message}`);
        // If Cloudinary fails, we must not store large files in MongoDB
        if (approxSizeMB > 4) {
          throw new Error(`Cloudinary upload failed and file is too large (${approxSizeMB.toFixed(1)}MB) for fallback. Error: ${error.message}`);
        }
        return dataUrl; // Fallback for small files only
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

      // Process day's hotel image
      if (Array.isArray(out.days)) {
        out.days = await Promise.all(out.days.map(async (d: any) => {
          const nd = { ...d };
          if (nd.hotel && typeof nd.hotel.image === 'string' && nd.hotel.image.startsWith('data:')) {
            nd.hotel = { ...nd.hotel };
            nd.hotel.image = await persistBase64(nd.hotel.image, "day_hotels");
          }
          return nd;
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

    const postType = ['quick', 'ask'].includes(restBody.postType) ? restBody.postType : 'detailed';

    const tripData = {
      ...mediaReadyBody,
      ownerId: userId, // Clerk user ID (from Clerk Express SDK)
      author: authorName, // Author name from Clerk (always use Clerk data)
      authorFollowers: authorFollowers,
      postType, // 'detailed' or 'quick'
    };

    // Validate trip data structure before creating
    // Only validate activities for detailed posts (ask and quick have minimal structure)
    if (postType === 'detailed' && Array.isArray(tripData.activities)) {
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
      postType: tripData.postType,
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

    // Send notifications to tagged users
    if (Array.isArray(created.taggedUsers) && created.taggedUsers.length > 0) {
      const { actorName, actorImage } = await getActorSnapshot(userId);
      for (const tagged of created.taggedUsers) {
        if (tagged.userId && tagged.userId !== userId) {
          try {
            await createNotification({
              recipientId: tagged.userId,
              actorId: userId,
              actorName,
              actorImage,
              type: "tag",
              message: `${actorName} قام بذكرك في رحلة "${created.title}"`,
              tripId: created._id,
              metadata: { tripTitle: created.title },
            });
          } catch (err) {
            console.error(`Error notifying tagged user ${tagged.userId}:`, err);
          }
        }
      }
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

    const tripId = req.params.id;
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Use findOneAndDelete for atomicity in unliking
    const existingLove = await TripLove.findOneAndDelete({ userId, tripId: trip._id });

    let loved = false;
    let likesCount = trip.likes || 0;

    if (existingLove) {
      // User is unliking
      loved = false;
      likesCount = Math.max(0, likesCount - 1);

      // Update trip in database
      await Trip.updateOne(
        { _id: trip._id },
        { $inc: { likes: -1, weeklyLikes: -1 } }
      );

      // Sync local object for response
      trip.likes = likesCount;
    } else {
      // User is liking
      try {
        await TripLove.create({ userId, tripId: trip._id });
        loved = true;
        likesCount += 1;

        // Update trip in database
        await Trip.updateOne(
          { _id: trip._id },
          { $inc: { likes: 1, weeklyLikes: 1 } }
        );

        // Sync local object for response
        trip.likes = likesCount;

        // Notification logic
        if (trip.ownerId && trip.ownerId !== userId) {
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
          // Already liked (race condition)
          loved = true;
          // Refresh count from DB
          const freshTrip = await Trip.findById(tripId);
          likesCount = freshTrip?.likes || trip.likes;
        } else {
          throw err;
        }
      }
    }

    res.json({ loved, likes: likesCount });
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

    const clerkUser = (req.headers['x-demo-user'] && process.env.NODE_ENV !== 'production')
      ? { fullName: 'Demo User', imageUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde', username: 'demo_user' }
      : await clerkClient.users.getUser(userId);

    const dbUser = await User.findOne({ clerkId: userId });
    let authorName = (clerkUser as any).fullName || (clerkUser as any).firstName || (clerkUser as any).username || 'مستخدم';
    let authorAvatar = clerkUser.imageUrl;

    // If the commenter is a company owner, use company identity
    if (dbUser && dbUser.role === 'company_owner' && dbUser.companyId) {
      const { CorporateCompany } = await import('../models/CorporateCompany');
      const company = await CorporateCompany.findById(dbUser.companyId);
      if (company) {
        authorName = company.name;
        if (company.logo) authorAvatar = company.logo;
      }
    }

    // We no longer block synchronously. We schedule a check.
    // Use a flag to track if we should schedule (after successful save)

    // const cryptoCheck = await toxicityService.checkText(content, userId, authorName);
    // if (cryptoCheck.isToxic) { ... }
    const newCommentId = new mongoose.Types.ObjectId();
    const newComment = {
      _id: newCommentId,
      authorId: userId,
      author: authorName,
      authorAvatar: authorAvatar || undefined,
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

    if (trip.ownerId && trip.ownerId !== userId) {
      try {
        await createNotification({
          recipientId: trip.ownerId,
          actorId: userId,
          actorName: authorName,
          actorImage: authorAvatar,
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

    // Handle @mentions
    const mentionRegex = /@(\w+)/g;
    const mentions = [...new Set([...content.matchAll(mentionRegex)].map(m => m[1]))]; // Unique mentions usernames

    if (mentions.length > 0) {
      // Find users by username
      const mentionedUsers = await User.find({ username: { $in: mentions } });

      for (const mentionedUser of mentionedUsers) {
        // Avoid sending notification if mentioned user is the comment author
        if (mentionedUser.clerkId && mentionedUser.clerkId !== userId) {
          try {
            await createNotification({
              recipientId: mentionedUser.clerkId,
              actorId: userId,
              actorName: authorName,
              actorImage: authorAvatar,
              type: "tag", // using existing 'tag' type for mentions
              message: `${authorName} ذكرك في تعليق: "${content.substring(0, 40)}${content.length > 40 ? '...' : ''}"`,
              tripId: trip._id,
              commentId: newCommentId,
              metadata: { snippet: content.slice(0, 120) },
            });
          } catch (err) {
            console.error(`Error creating mention notification for ${mentionedUser.username}:`, err);
          }
        }
      }
    }

    const responseComment = formatComment(
      {
        ...newComment,
        authorAvatar: toAbsoluteUrl(newComment.authorAvatar, req) || newComment.authorAvatar,
      },
      userId
    );

    // Schedule async toxicity check (fire and forget)
    toxicityService.scheduleCheck(content, userId, authorName, trip._id, newCommentId).catch(err => {
      console.error("Failed to schedule toxicity check:", err);
    });

    res.status(201).json(responseComment);
  } catch (error: any) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment', message: error.message });
  }
});

// Like/unlike a specific comment
// Add a reply to a comment
router.post('/:id/comments/:commentId/replies', requireAuthStrict, async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Reply content is required' });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const parentComment = trip.comments.id(req.params.commentId);
    if (!parentComment) return res.status(404).json({ error: 'Comment not found' });

    const clerkUser = (req.headers['x-demo-user'] && process.env.NODE_ENV !== 'production') 
      ? { fullName: 'Demo User', imageUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde', username: 'demo_user' }
      : await clerkClient.users.getUser(userId);

    const dbUser = await User.findOne({ clerkId: userId });
    let authorName = (clerkUser as any).fullName || (clerkUser as any).firstName || (clerkUser as any).username || 'مستخدم';
    let authorAvatar = clerkUser.imageUrl;

    // If the replier is a company owner, use company identity
    if (dbUser && dbUser.role === 'company_owner' && dbUser.companyId) {
      const { CorporateCompany } = await import('../models/CorporateCompany');
      const company = await CorporateCompany.findById(dbUser.companyId);
      if (company) {
        authorName = company.name;
        if (company.logo) authorAvatar = company.logo;
      }
    }
    
    const replyId = new mongoose.Types.ObjectId();
    const newReply = {
      _id: replyId,
      authorId: userId,
      author: authorName,
      authorAvatar: authorAvatar || undefined,
      content: content.trim(),
      date: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      replies: []
    };

    if (!(parentComment as any).replies) (parentComment as any).replies = [];
    (parentComment as any).replies.push(newReply as any);
    
    await trip.save();

    // Notify the parent comment author
    if (parentComment.authorId && parentComment.authorId !== userId) {
      try {
        await createNotification({
          recipientId: parentComment.authorId,
          actorId: userId,
          actorName: authorName,
          actorImage: authorAvatar,
          type: "comment", // Reuse comment type
          message: `${authorName} رد على تعليقك`,
          tripId: trip._id,
          commentId: parentComment._id,
          metadata: { snippet: content.slice(0, 120) },
        });
      } catch (err) {
        console.error("Error creating reply notification:", err);
      }
    }

    res.json(formatComment(newReply, userId, req));
  } catch (error: any) {
    console.error('Error adding reply:', error);
    res.status(500).json({ error: 'Failed to add reply', message: error.message });
  }
});

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
// Delete trip (requires auth: Owner or Admin)
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
    const isOwner = trip.ownerId === userId;

    // Check if user is admin
    let isAdmin = false;
    try {
      if (userId.startsWith('user_2r9nE5R8r7TzK6pM9wL1vQ3xH4j')) {
        isAdmin = true; // Support admin actions for demo user in dev
      } else {
        const user = await clerkClient.users.getUser(userId);
        const adminEmail = 'supermincraft52@gmail.com';
        isAdmin = !!user.emailAddresses.find(email => email.emailAddress === adminEmail);
      }
    } catch (e) {
      console.error('Error checking admin status', e);
    }

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only delete your own trips' });
    }

    // Remove trip from OWNER's trips array (Target trip.ownerId, not userId if admin)
    await User.updateOne(
      { clerkId: trip.ownerId },
      { $pull: { trips: trip._id } }
    );

    // Delete the trip
    await Trip.findByIdAndDelete(req.params.id);

    // If Admin deleted it (and is not owner), notify the owner and resolve reports
    if (isAdmin && !isOwner) {
      // Send notification to OWNER
      await createNotification({
        recipientId: trip.ownerId,
        actorId: userId,
        actorName: "إدارة رحلتي",
        actorImage: "/assets/logo.png",
        type: "system",
        message: `تم حذف رحلتك "${trip.title}" لمخالفتها شروط النشر وسياسات المجتمع.`,
        isRead: false,
      });

      // Notify REPORTERS and resolve pending reports
      const pendingReports = await ContentReport.find({ tripId: req.params.id, status: 'pending' });
      for (const report of pendingReports) {
        if (report.reportedBy) {
          await createNotification({
            recipientId: report.reportedBy,
            actorId: userId,
            actorName: "إدارة رحلتي",
            actorImage: "/assets/logo.png",
            type: "system",
            message: `تمت مراجعة بلاغك بخصوص الرحلة "${trip.title}" واتخاذ الإجراء اللازم بحذف المحتوى. شكراً لمساعدتك!`,
            isRead: false,
          });
        }
      }

      await ContentReport.updateMany(
        { tripId: req.params.id },
        { status: 'resolved', adminNotes: 'Deleted by admin due to violation' }
      );
    }

    res.json({ message: 'Trip deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting trip:', error);
    res.status(500).json({ error: 'Failed to delete trip', message: error.message });
  }
});

export default router;


