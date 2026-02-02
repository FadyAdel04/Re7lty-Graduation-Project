import { Router } from "express";
import { requireAuthStrict, getAuth, clerkClient } from "../utils/auth";
import { Booking } from "../models/Booking";
import { CorporateTrip } from "../models/CorporateTrip";
import { CorporateCompany } from "../models/CorporateCompany";
import { createNotification } from "../utils/notificationDispatcher";

const router = Router();

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tripId
 *               - numberOfPeople
 *               - bookingDate
 *               - userPhone
 *             properties:
 *               tripId:
 *                 type: string
 *               numberOfPeople:
 *                 type: number
 *               bookingDate:
 *                 type: string
 *                 format: date
 *               userPhone:
 *                 type: string
 *               specialRequests:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 */
router.post("/", requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Fetch user from Clerk
        const user = await clerkClient.users.getUser(userId);

        const { tripId, numberOfPeople, bookingDate, userPhone, specialRequests, firstName, lastName, email, selectedSeats } = req.body;

        // Validate required fields
        if (!tripId || !numberOfPeople || !bookingDate || !userPhone) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Fetch trip details
        const trip = await CorporateTrip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ error: "Trip not found" });
        }

        // Check if any of the selected seats are already booked
        if (selectedSeats && selectedSeats.length > 0) {
            const alreadyBooked = trip.seatBookings?.some(s => selectedSeats.includes(s.seatNumber));
            if (alreadyBooked) {
                return res.status(400).json({ error: "بعض المقاعد المختارة محجوزة بالفعل، يرجى اختيار مقاعد أخرى" });
            }
        }

        // Fetch company details
        const company = await CorporateCompany.findById(trip.companyId);
        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }

        // Calculate total price (extract number from price string)
        const priceMatch = trip.price.match(/\d+/);
        const unitPrice = priceMatch ? parseInt(priceMatch[0]) : 0;
        const totalPrice = unitPrice * numberOfPeople;

        // Use provided contact info or fallback to Clerk data
        const userEmail = email || user.emailAddresses?.[0]?.emailAddress || "no-email@provided.com";
        let userName = "User";
        if (firstName && lastName) {
            userName = `${firstName} ${lastName}`;
        } else {
            userName = (user.firstName ? user.firstName + " " : "") + (user.lastName || "") || "User";
        }

        // Generate unique booking reference
        const timestamp = Date.now().toString(36).toUpperCase();
        const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
        const bookingReference = `REF-${timestamp}-${randomStr}`;

        const booking = await Booking.create({
            bookingReference,
            userId,
            userName,
            userEmail,
            userPhone,
            tripId: trip._id,
            tripTitle: trip.title,
            tripDestination: trip.destination,
            tripPrice: trip.price,
            companyId: company._id,
            companyName: company.name,
            numberOfPeople,
            bookingDate: new Date(bookingDate),
            specialRequests: specialRequests || "",
            totalPrice,
            status: "pending",
            selectedSeats: selectedSeats || [],
            transportationType: trip.transportationType || 'bus-48',
            seatNumber: (selectedSeats && selectedSeats.length > 0) ? selectedSeats[0] : undefined
        });

        // Notify company owner about new booking
        const companyOwnerId = company.ownerId;
        if (companyOwnerId) {
            try {
                await createNotification({
                    recipientId: companyOwnerId,
                    actorId: userId,
                    actorName: userName,
                    actorImage: user.imageUrl,
                    type: "system",
                    message: `حجز جديد لرحلة "${trip.title}" من ${booking.userName}`,
                    metadata: { bookingId: booking._id, tripId: trip._id }
                });
            } catch (notifyError) {
                console.error("Failed to send notification:", notifyError);
                // Don't fail the booking if notification fails
            }
        }

        res.status(201).json({
            success: true,
            booking: booking.toObject()
        });
    } catch (error: any) {
        console.error("Error creating booking:", error);
        if (error.name === 'ValidationError') {
            console.error("Validation Details:", JSON.stringify(error.errors, null, 2));
            return res.status(400).json({ error: "Booking validation failed", details: error.message });
        }
        res.status(500).json({ error: error.message || "Failed to create booking" });
    }
});

/**
 * @swagger
 * /api/bookings/my-bookings:
 *   get:
 *     summary: Get current user's bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.get("/my-bookings", requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const bookings = await Booking.find({ userId })
            .sort({ createdAt: -1 })
            .lean();

        res.json(bookings);
    } catch (error: any) {
        console.error("Error fetching user bookings:", error);
        res.status(500).json({ error: error.message || "Failed to fetch bookings" });
    }
});

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   post:
 *     summary: Cancel a booking by the user
 *     tags: [Bookings]
 */
router.post("/:id/cancel", requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        const { id } = req.params;

        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).json({ error: "Booking not found" });

        if (booking.userId !== userId) {
            return res.status(403).json({ error: "You can only cancel your own bookings" });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ error: "الطلب ملغي بالفعل" });
        }

        // If it was accepted and has seats, we should free them
        if (booking.status === 'accepted' && booking.selectedSeats && booking.selectedSeats.length > 0) {
            const trip = await CorporateTrip.findById(booking.tripId);
            if (trip) {
                (trip.seatBookings as any) = trip.seatBookings.filter(s => !booking.selectedSeats.includes(s.seatNumber));
                await trip.save();
            }
        }

        booking.status = "cancelled";
        booking.cancellationReason = "تم الإلغاء من قبل المستخدم";
        booking.statusUpdatedAt = new Date();
        await booking.save();

        res.json({ success: true, booking });
    } catch (error: any) {
        console.error("Error cancelling booking:", error);
        res.status(500).json({ error: error.message || "Failed to cancel booking" });
    }
});

/**
 * @swagger
 * /api/bookings/{id}:
 *   put:
 *     summary: Update a booking by the user
 *     tags: [Bookings]
 */
router.put("/:id", requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        const { id } = req.params;
        const { numberOfPeople, userPhone, specialRequests, selectedSeats, firstName, lastName, email } = req.body;

        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).json({ error: "Booking not found" });

        if (booking.userId !== userId) {
            return res.status(403).json({ error: "You can only edit your own bookings" });
        }

        if (booking.status === 'accepted') {
            return res.status(400).json({ error: "لا يمكن تعديل الحجز بعد قبوله. يرجى التواصل مع الشركة." });
        }

        if (numberOfPeople) booking.numberOfPeople = numberOfPeople;
        if (userPhone) booking.userPhone = userPhone;
        if (specialRequests) booking.specialRequests = specialRequests;
        if (selectedSeats) booking.selectedSeats = selectedSeats;

        if (firstName && lastName) {
            booking.userName = `${firstName} ${lastName}`;
        }
        if (email) booking.userEmail = email;

        await booking.save();
        res.json({ success: true, booking });
    } catch (error: any) {
        console.error("Error updating booking:", error);
        res.status(500).json({ error: error.message || "Failed to update booking" });
    }
});

/**
 * @swagger
 * /api/bookings/company-bookings:
 *   get:
 *     summary: Get bookings for company owner
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.get("/company-bookings", requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Find user to get linked company
        const { User } = await import("../models/User");
        const user = await User.findOne({ clerkId: userId });

        let companyId;
        if (user && user.companyId) {
            companyId = user.companyId;
        } else {
            // Fallback to searching by ownerId or createdBy
            const company = await CorporateCompany.findOne({
                $or: [{ ownerId: userId }, { createdBy: userId }]
            });
            if (company) companyId = company._id;
        }

        if (!companyId) {
            return res.status(404).json({ error: "Company not found" });
        }

        const bookings = await Booking.find({ companyId })
            .sort({ createdAt: -1 })
            .lean();

        res.json(bookings);
    } catch (error: any) {
        console.error("Error fetching company bookings:", error);
        res.status(500).json({ error: error.message || "Failed to fetch bookings" });
    }
});

/**
 * @swagger
 * /api/bookings/{id}/accept:
 *   post:
 *     summary: Accept a booking (company owner only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.post("/:id/accept", requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { id } = req.params;
        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        // Verify company ownership (Robust check)
        const { User } = await import("../models/User");
        const user = await User.findOne({ clerkId: userId });

        let isAuthorized = false;

        // Check 1: User linked to this company
        if (user && user.companyId && user.companyId.toString() === booking.companyId.toString()) {
            isAuthorized = true;
        }

        if (!isAuthorized) {
            const companyToCheck = await CorporateCompany.findById(booking.companyId);
            // Check 2: Direct ownership
            if (companyToCheck && (companyToCheck.ownerId === userId || companyToCheck.createdBy === userId)) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ error: "Not authorized to manage this booking" });
        }

        const company = await CorporateCompany.findById(booking.companyId);
        if (!company) return res.status(404).json({ error: "Company not found" });

        // Update booking status
        booking.status = "accepted";
        booking.statusUpdatedAt = new Date();
        await booking.save();

        // Auto-assign seats if user selected them and trip exists
        if (booking.selectedSeats && booking.selectedSeats.length > 0) {
            const trip = await CorporateTrip.findById(booking.tripId);
            if (trip) {
                booking.selectedSeats.forEach(seatNum => {
                    // Check if seat already assigned to avoid duplicates
                    if (!trip.seatBookings.some(s => s.seatNumber === seatNum)) {
                        trip.seatBookings.push({
                            seatNumber: seatNum,
                            passengerName: booking.userName,
                            userId: booking.userId,
                            bookingId: booking._id
                        } as any);
                    }
                });

                await trip.save();
            }
        }

        // Notify user
        await createNotification({
            recipientId: booking.userId,
            actorId: userId,
            actorName: company.name,
            actorImage: company.logo,
            type: "system",
            message: `تم قبول حجزك لرحلة "${booking.tripTitle}" 🎉`,
            metadata: { bookingId: booking._id, status: "accepted" }
        });

        res.json({ success: true, booking: booking.toObject() });
    } catch (error: any) {
        console.error("Error accepting booking:", error);
        res.status(500).json({ error: error.message || "Failed to accept booking" });
    }
});

/**
 * @swagger
 * /api/bookings/{id}/reject:
 *   post:
 *     summary: Reject a booking (company owner only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.post("/:id/reject", requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { id } = req.params;
        const { reason } = req.body;

        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        // Verify company ownership (Robust check)
        const { User } = await import("../models/User");
        const user = await User.findOne({ clerkId: userId });

        let isAuthorized = false;

        // Check 1: User linked to this company
        if (user && user.companyId && user.companyId.toString() === booking.companyId.toString()) {
            isAuthorized = true;
        }

        if (!isAuthorized) {
            const companyToCheck = await CorporateCompany.findById(booking.companyId);
            // Check 2: Direct ownership
            if (companyToCheck && (companyToCheck.ownerId === userId || companyToCheck.createdBy === userId)) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ error: "Not authorized to manage this booking" });
        }

        const company = await CorporateCompany.findById(booking.companyId);
        if (!company) return res.status(404).json({ error: "Company not found" });

        // Update booking status
        booking.status = "rejected";
        booking.statusUpdatedAt = new Date();
        booking.rejectionReason = reason || "لم يتم توضيح السبب";
        await booking.save();

        // Notify user
        await createNotification({
            recipientId: booking.userId,
            actorId: userId,
            actorName: company.name,
            actorImage: company.logo,
            type: "system",
            message: `تم رفض حجزك لرحلة "${booking.tripTitle}"`,
            metadata: { bookingId: booking._id, status: "rejected", reason: booking.rejectionReason }
        });

        res.json({ success: true, booking: booking.toObject() });
    } catch (error: any) {
        console.error("Error rejecting booking:", error);
        res.status(500).json({ error: error.message || "Failed to reject booking" });
    }
});

/**
 * @swagger
 * /api/bookings/{id}/cancel-by-company:
 *   post:
 *     summary: Cancel a booking by the company (even after accept)
 *     tags: [Bookings]
 */
router.post("/:id/cancel-by-company", requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        const { id } = req.params;
        const { reason } = req.body;

        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).json({ error: "Booking not found" });

        // Verify ownership (simplified for brevity here, assuming shared logic or using robust check)
        const { User } = await import("../models/User");
        const user = await User.findOne({ clerkId: userId });

        const isOwner = (user && user.companyId && user.companyId.toString() === booking.companyId.toString()) ||
            (await CorporateCompany.findOne({ _id: booking.companyId, $or: [{ ownerId: userId }, { createdBy: userId }] }));

        if (!isOwner) return res.status(403).json({ error: "Unauthorized" });

        booking.status = "cancelled";
        booking.cancellationReason = reason || "تم إلغاء الحجز من قبل الشركة";
        booking.statusUpdatedAt = new Date();
        await booking.save();

        const company = await CorporateCompany.findById(booking.companyId);

        // Notify user
        await createNotification({
            recipientId: booking.userId as string,
            actorId: userId as string,
            actorName: company?.name || "الشركة",
            actorImage: company?.logo,
            type: "system",
            message: `تم إلغاء حجزك لرحلة "${booking.tripTitle}" من قبل الشركة. السبب: ${booking.cancellationReason}`,
            metadata: { bookingId: booking._id, status: "cancelled", reason: booking.cancellationReason }
        });

        res.json({ success: true, booking });
    } catch (error: any) {
        console.error("Error cancelling booking:", error);
        res.status(500).json({ error: error.message || "Failed to cancel booking" });
    }
});

/**
 * @swagger
 * /api/bookings/{id}/payment:
 *   put:
 *     summary: Update payment status/method
 *     tags: [Bookings]
 */
router.put("/:id/payment", requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        const { id } = req.params;
        const { paymentStatus, paymentMethod } = req.body;

        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).json({ error: "Booking not found" });

        // Ownership check
        const { User } = await import("../models/User");
        const user = await User.findOne({ clerkId: userId });
        const isOwner = (user && user.companyId && user.companyId.toString() === booking.companyId.toString());

        if (!isOwner) return res.status(403).json({ error: "Unauthorized" });

        if (paymentStatus) booking.paymentStatus = paymentStatus;
        if (paymentMethod) booking.paymentMethod = paymentMethod;
        await booking.save();

        res.json({ success: true, booking });
    } catch (error: any) {
        console.error("Error updating payment:", error);
        res.status(500).json({ error: error.message || "Failed to update payment" });
    }
});

/**
 * @swagger
 * /api/bookings/analytics:
 *   get:
 *     summary: Get booking analytics for company dashboard
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.get("/analytics", requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Find user to get linked company
        const { User } = await import("../models/User");
        const user = await User.findOne({ clerkId: userId });

        let companyId;
        if (user && user.companyId) {
            companyId = user.companyId;
        } else {
            const company = await CorporateCompany.findOne({
                $or: [{ ownerId: userId }, { createdBy: userId }]
            });
            if (company) companyId = company._id;
        }

        if (!companyId) {
            return res.status(404).json({ error: "Company not found" });
        }

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Aggregate bookings data
        const [
            totalBookings,
            pendingBookings,
            acceptedBookings,
            todayBookings,
            weekBookings,
            monthBookings,
            totalRevenue,
            todayRevenue,
            weekRevenue,
            monthRevenue
        ] = await Promise.all([
            Booking.countDocuments({ companyId }),
            Booking.countDocuments({ companyId, status: "pending" }),
            Booking.countDocuments({ companyId, status: "accepted" }),
            Booking.countDocuments({ companyId, createdAt: { $gte: startOfDay } }),
            Booking.countDocuments({ companyId, createdAt: { $gte: startOfWeek } }),
            Booking.countDocuments({ companyId, createdAt: { $gte: startOfMonth } }),
            Booking.aggregate([
                { $match: { companyId, status: "accepted" } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ]),
            Booking.aggregate([
                { $match: { companyId, status: "accepted", createdAt: { $gte: startOfDay } } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ]),
            Booking.aggregate([
                { $match: { companyId, status: "accepted", createdAt: { $gte: startOfWeek } } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ]),
            Booking.aggregate([
                { $match: { companyId, status: "accepted", createdAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ])
        ]);

        // Get bookings by trip
        const bookingsByTrip = await Booking.aggregate([
            { $match: { companyId } },
            { $group: { _id: "$tripTitle", count: { $sum: 1 }, revenue: { $sum: "$totalPrice" } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Get daily bookings for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailyBookings = await Booking.aggregate([
            { $match: { companyId, createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 },
                    revenue: { $sum: "$totalPrice" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Aggregated payment stats
        const [
            paidRevenue,
            pendingRevenue,
            refundedRevenue,
            paymentSummary
        ] = await Promise.all([
            Booking.aggregate([
                { $match: { companyId, paymentStatus: "paid" } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ]),
            Booking.aggregate([
                { $match: { companyId, paymentStatus: "pending" } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ]),
            Booking.aggregate([
                { $match: { companyId, paymentStatus: "refunded" } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ]),
            Booking.aggregate([
                { $match: { companyId } },
                { $group: { _id: "$paymentStatus", count: { $sum: 1 }, total: { $sum: "$totalPrice" } } }
            ])
        ]);

        res.json({
            overview: {
                totalBookings,
                pendingBookings,
                acceptedBookings,
                todayBookings,
                weekBookings,
                monthBookings
            },
            revenue: {
                total: totalRevenue[0]?.total || 0,
                today: todayRevenue[0]?.total || 0,
                week: weekRevenue[0]?.total || 0,
                month: monthRevenue[0]?.total || 0,
                paid: paidRevenue[0]?.total || 0,
                pending: pendingRevenue[0]?.total || 0,
                refunded: refundedRevenue[0]?.total || 0
            },
            bookingsByTrip,
            dailyBookings,
            paymentSummary
        });
    } catch (error: any) {
        console.error("Error fetching analytics:", error);
        res.status(500).json({ error: error.message || "Failed to fetch analytics" });
    }
});

export default router;
