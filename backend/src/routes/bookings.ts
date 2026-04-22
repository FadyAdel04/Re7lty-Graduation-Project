import { Router } from "express";
import mongoose from "mongoose";
import { requireAuthStrict, getAuth, clerkClient } from "../utils/auth";
import { Booking } from "../models/Booking";
import { CorporateTrip } from "../models/CorporateTrip";
import { CorporateCompany } from "../models/CorporateCompany";
import { User } from "../models/User";
import { createNotification } from "../utils/notificationDispatcher";
import { handleBookingAccepted, handleBookingCancelled } from "../utils/tripChatManager";
import { validateEgyptPhone, validateEmail } from "../utils/validators";

const router = Router();

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 */
router.post("/", requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const user = await clerkClient.users.getUser(userId);
        const { tripId, numberOfPeople, bookingDate, userPhone, specialRequests, firstName, lastName, email, selectedSeats } = req.body;

        if (!tripId || !numberOfPeople || !bookingDate || !userPhone) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const phoneCheck = validateEgyptPhone(String(userPhone || ""));
        if (!phoneCheck.valid) return res.status(400).json({ error: phoneCheck.message });

        const userEmail = email || user.emailAddresses?.[0]?.emailAddress || "";
        const emailCheck = validateEmail(userEmail || " ");
        if (!emailCheck.valid) return res.status(400).json({ error: emailCheck.message });

        const trip = await CorporateTrip.findById(tripId);
        if (!trip) return res.status(404).json({ error: "Trip not found" });

        const tripStart = trip.startDate ? new Date(trip.startDate) : null;
        if (tripStart && tripStart <= new Date()) {
            return res.status(400).json({ error: "لا يمكن الحجز بعد بدء موعد الرحلة" });
        }

        let totalSeats = trip.maxGroupSize || (trip as any).availableSeats || 0;
        if (totalSeats === 0 && (trip as any).transportations?.length) {
            totalSeats = (trip as any).transportations.reduce((s: number, t: any) => s + (t.capacity || 0) * (t.count || 1), 0);
        }
        const bookedCount = (trip.seatBookings?.length || 0) + (await Booking.countDocuments({ tripId, status: { $in: ["pending", "accepted"] } }));
        if (totalSeats > 0 && bookedCount + numberOfPeople > totalSeats) {
            return res.status(400).json({ error: "لا توجد مقاعد كافية في هذه الرحلة" });
        }

        // Removed: Check for existing booking to allow multiple bookings per user

        if (selectedSeats && selectedSeats.length > 0) {
            const alreadyBooked = trip.seatBookings?.some(s => selectedSeats.includes(s.seatNumber));
            if (alreadyBooked) {
                return res.status(400).json({ error: "بعض المقاعد المختارة محجوزة بالفعل، يرجى اختيار مقاعد أخرى" });
            }
        }

        const company = await CorporateCompany.findById(trip.companyId);
        if (!company) return res.status(404).json({ error: "Company not found" });

        const priceMatch = trip.price.match(/\d+/);
        const unitPrice = priceMatch ? parseInt(priceMatch[0]) : 0;
        let totalPrice = unitPrice * numberOfPeople;
        let discountApplied = 0;

        const { couponId } = req.body;
        if (couponId) {
            const { Coupon } = await import("../models/Coupon");
            const coupon = await Coupon.findById(couponId);
            if (coupon && coupon.isActive && coupon.expiryDate > new Date()) {
                if (coupon.companyId.toString() === trip.companyId.toString()) {
                    if (coupon.applicableTrips.length === 0 || coupon.applicableTrips.some(id => id.toString() === tripId)) {
                        discountApplied = coupon.discountType === 'percentage' ? (totalPrice * coupon.discountValue) / 100 : coupon.discountValue;
                        totalPrice = Math.max(0, totalPrice - discountApplied);
                        coupon.usageCount += 1;
                        await coupon.save();
                    }
                }
            }
        }

        const commissionAmount = parseFloat((totalPrice * 0.05).toFixed(2));
        const netAmount = parseFloat((totalPrice - commissionAmount).toFixed(2));

        const userName = (firstName && lastName) ? `${firstName} ${lastName}` : ((user.firstName ? user.firstName + " " : "") + (user.lastName || "") || "User");

        const timestamp = Date.now().toString(36).toUpperCase();
        const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
        const bookingReference = `REF-${timestamp}-${randomStr}`;

        const booking = await Booking.create({
            bookingReference, userId, userName, userEmail: userEmail || user.emailAddresses?.[0]?.emailAddress || "no-email@provided.com", userPhone,
            tripId: trip._id, tripTitle: trip.title, tripDestination: trip.destination, tripPrice: trip.price,
            companyId: company._id, companyName: company.name, numberOfPeople,
            bookingDate: new Date(bookingDate), specialRequests: specialRequests || "",
            totalPrice, commissionAmount, netAmount, status: "pending",
            selectedSeats: selectedSeats || [], transportationType: trip.transportationType || 'bus-48',
            seatNumber: (selectedSeats && selectedSeats.length > 0) ? selectedSeats[0] : undefined,
            couponId: (couponId as any) || undefined, discountApplied
        });

        const recipients = new Set<string>();
        if (company.ownerId) recipients.add(company.ownerId);
        if ((company as any).createdBy) recipients.add((company as any).createdBy);

        for (const recipientId of recipients) {
            await createNotification({
                recipientId, actorId: userId, actorName: userName, actorImage: user.imageUrl, type: "system",
                message: `حجز جديد لرحلة "${trip.title}" من ${booking.userName}`,
                metadata: { bookingId: booking._id, tripId: trip._id }
            });
        }

        res.status(201).json({ success: true, booking });
    } catch (error: any) {
        console.error("Error creating booking:", error);
        res.status(500).json({ error: error.message || "Failed to create booking" });
    }
});

/**
 * GET /api/bookings/verify/:reference
 * Public route for QR code verification
 */
router.get("/verify/:reference", async (req, res) => {
    try {
        const { reference } = req.params;
        const normalizedRef = String(reference).trim().toUpperCase();

        const booking = await Booking.findOne({ bookingReference: normalizedRef });
        if (!booking) {
            console.log(`[Verify] Booking not found for reference: "${normalizedRef}" (original: "${reference}")`);
            return res.status(404).json({ error: "Booking not found" });
        }

        const trip = await CorporateTrip.findById(booking.tripId);
        const company = await CorporateCompany.findById(booking.companyId);

        res.json({
            success: true,
            booking,
            trip,
            company: company ? {
                name: company.name,
                logo: company.logo,
                phone: company.contactInfo.phone,
                email: company.contactInfo.email
            } : null
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/bookings/trip/:tripId
 * Returns all pending/accepted bookings for a trip to show occupied seats.
 */
router.get("/trip/:tripId", async (req, res) => {
    try {
        const { tripId } = req.params;
        const bookings = await Booking.find({ 
            tripId: tripId, 
            status: { $in: ["pending", "accepted"] } 
        }).select('selectedSeats status userName').lean();
        
        res.json(bookings);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/my-bookings", requireAuthStrict, async (req: any, res) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });
        const bookings = await Booking.find({ userId }).sort({ createdAt: -1 }).lean();
        res.json(bookings);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});


router.post("/:id/cancel", requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        const { id } = req.params;
        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).json({ error: "Booking not found" });
        if (booking.userId !== userId) return res.status(403).json({ error: "Unauthorized" });
        if (booking.status === 'cancelled') return res.status(400).json({ error: "الطلب ملغي بالفعل" });

        if (booking.status === 'accepted') {
            const trip = await CorporateTrip.findById(booking.tripId);
            if (trip) {
                (trip.seatBookings as any) = (trip.seatBookings || []).filter((s: any) =>
                    s.bookingId?.toString() !== (booking as any)._id.toString()
                );
                await trip.save();
            }
        }

        booking.status = "cancelled";
        booking.cancellationReason = "تم الإلغاء من قبل المستخدم";
        booking.statusUpdatedAt = new Date();
        await booking.save();
        await handleBookingCancelled(booking.tripId.toString(), booking.userId);

        // Notify company (dashboard) that the user cancelled
        const company = await CorporateCompany.findById(booking.companyId);
        const companyOwnerId = company?.ownerId || (company as any)?.createdBy;
        if (companyOwnerId) {
            await createNotification({
                recipientId: companyOwnerId,
                actorId: booking.userId,
                actorName: booking.userName,
                type: "system",
                message: `ألغى ${booking.userName} حجزه لرحلة "${booking.tripTitle}" (المرجع: ${booking.bookingReference}).`,
                metadata: { bookingId: booking._id, status: "cancelled", tripId: booking.tripId }
            } as any);
        }

        res.json({ success: true, booking });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/company-bookings", requireAuthStrict, async (req: any, res) => {
    try {
        const auth = req.auth;
        const userId = auth?.userId;
        
        if (!userId) {
            console.error("GET /company-bookings - No userId found in req.auth");
            return res.status(401).json({ error: "Unauthorized - No user ID" });
        }

        let user = await User.findOne({ clerkId: userId });
        let companyId = user?.companyId;

        if (!companyId) {
            const company = await CorporateCompany.findOne({ $or: [{ ownerId: userId }, { createdBy: userId }] });
            if (company) {
                companyId = company._id as any;
            }
        }

        if (!companyId) {
            return res.status(404).json({ error: "Company not found for this user" });
        }

        const bookings = await Booking.find({ companyId: companyId as any })
            .sort({ createdAt: -1 })
            .lean();
            
        res.json(bookings);
    } catch (error: any) {
        console.error("GET /company-bookings - Server Error:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

router.post("/:id/accept", requireAuthStrict, async (req: any, res) => {
    try {
        const userId = req.auth?.userId;
        const { id } = req.params;
        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).json({ error: "Booking not found" });

        const currentUserProfile = await User.findOne({ clerkId: userId });

        const company = await CorporateCompany.findById(booking.companyId);
        const isAuthorized = company && (
            company.ownerId === userId ||
            company.createdBy === userId ||
            (currentUserProfile?.companyId && currentUserProfile.companyId.toString() === (company._id as any).toString())
        );

        if (!isAuthorized || !company) {
            return res.status(403).json({ error: "Unauthorized: You don't have permission to manage this company's bookings" });
        }

        booking.status = "accepted";
        booking.statusUpdatedAt = new Date();
        await booking.save();

        if (booking.selectedSeats && booking.selectedSeats.length > 0) {
            const trip = await CorporateTrip.findById(booking.tripId);
            if (trip) {
                booking.selectedSeats.forEach(seatStr => {
                    let seatNumber = seatStr;
                    let busIndex = 0;

                    // Support "busIndex-seatNumber" format
                    if (seatStr.includes('-')) {
                        const parts = seatStr.split('-');
                        busIndex = parseInt(parts[0]) || 0;
                        seatNumber = parts[1];
                    }

                    if (!trip.seatBookings.some(s => s.seatNumber === seatNumber && (s.busIndex || 0) === busIndex)) {
                        trip.seatBookings.push({
                            busIndex,
                            seatNumber,
                            passengerName: booking.userName,
                            userId: booking.userId || "",
                            bookingId: booking._id as any
                        } as any);
                    }
                });
                await trip.save();
            }
        }

        await createNotification({
            recipientId: booking.userId, actorId: userId, actorName: company.name, actorImage: company.logo, type: "system",
            message: `تم قبول حجزك لرحلة "${booking.tripTitle}" 🎉`,
            metadata: { bookingId: booking._id, status: "accepted" }
        } as any);

        await handleBookingAccepted(booking.tripId.toString(), booking.userId);
        res.json({ success: true, booking });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/:id/reject", requireAuthStrict, async (req: any, res) => {
    try {
        const userId = req.auth?.userId;
        const { id } = req.params;
        const { reason } = req.body;
        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).json({ error: "Booking not found" });

        const currentUserProfile = await User.findOne({ clerkId: userId });

        const company = await CorporateCompany.findById(booking.companyId);
        const isAuthorized = company && (
            company.ownerId === userId ||
            company.createdBy === userId ||
            (currentUserProfile?.companyId && currentUserProfile.companyId.toString() === (company._id as any).toString())
        );

        if (!isAuthorized || !company) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        if (booking.status === 'accepted') {
            const trip = await CorporateTrip.findById(booking.tripId);
            if (trip) {
                (trip.seatBookings as any) = (trip.seatBookings || []).filter((s: any) =>
                    s.bookingId?.toString() !== (booking as any)._id.toString()
                );
                await trip.save();
            }
        }

        booking.status = "rejected";
        booking.rejectionReason = reason || "لم يتم توضيح السبب";
        booking.statusUpdatedAt = new Date();
        await booking.save();

        await createNotification({
            recipientId: booking.userId, actorId: userId, actorName: company.name, actorImage: company.logo, type: "system",
            message: `تم رفض حجزك لرحلة "${booking.tripTitle}"`,
            metadata: { bookingId: booking._id, status: "rejected", reason: booking.rejectionReason }
        } as any);

        res.json({ success: true, booking });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/:id/cancel-by-company", requireAuthStrict, async (req: any, res) => {
    try {
        const userId = req.auth?.userId;
        const { id } = req.params;
        const { reason } = req.body;
        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).json({ error: "Booking not found" });

        const currentUserProfile = await User.findOne({ clerkId: userId });

        const company = await CorporateCompany.findById(booking.companyId);
        const isAuthorized = company && (
            company.ownerId === userId ||
            company.createdBy === userId ||
            (currentUserProfile?.companyId && currentUserProfile.companyId.toString() === (company._id as any).toString())
        );

        if (!isAuthorized || !company) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        if (booking.status === 'accepted') {
            const trip = await CorporateTrip.findById(booking.tripId);
            if (trip) {
                (trip.seatBookings as any) = (trip.seatBookings || []).filter((s: any) =>
                    s.bookingId?.toString() !== (booking as any)._id.toString()
                );
                await trip.save();
            }
        }

        booking.status = "cancelled";
        booking.cancellationReason = reason || "تم إلغاء الحجز من قبل الشركة";
        booking.statusUpdatedAt = new Date();
        await booking.save();

        await createNotification({
            recipientId: booking.userId, actorId: userId, actorName: company?.name || "الشركة", actorImage: company?.logo, type: "system",
            message: `تم إلغاء حجزك لرحلة "${booking.tripTitle}" من قبل الشركة. السبب: ${booking.cancellationReason}`,
            metadata: { bookingId: booking._id, status: "cancelled", reason: booking.cancellationReason }
        } as any);

        await handleBookingCancelled(booking.tripId.toString(), booking.userId);
        res.json({ success: true, booking });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/bookings/:id/payment – Update payment status (company owner only)
 */
router.put("/:id/payment", requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        const { id } = req.params;
        const { paymentStatus, paymentMethod } = req.body;

        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).json({ error: "Booking not found" });

        const { User } = await import("../models/User");
        const currentUserProfile = await User.findOne({ clerkId: userId });

        const company = await CorporateCompany.findById(booking.companyId);
        const isAuthorized = company && (
            company.ownerId === userId ||
            company.createdBy === userId ||
            (currentUserProfile?.companyId && currentUserProfile.companyId.toString() === (company._id as any).toString())
        );

        if (!isAuthorized || !company) {
            return res.status(403).json({ error: "Unauthorized: You don't have permission to manage this company's bookings" });
        }

        if (paymentStatus !== undefined) {
            const allowed = ["pending", "paid", "refunded", "partially_paid"];
            if (allowed.includes(paymentStatus)) booking.paymentStatus = paymentStatus;
        }
        if (paymentMethod !== undefined) {
            const allowed = ["cash", "card", "bank_transfer", "other"];
            if (allowed.includes(paymentMethod)) booking.paymentMethod = paymentMethod;
        }
        await booking.save();

        res.json({ success: true, booking });
    } catch (error: any) {
        console.error("Error updating payment:", error);
        res.status(500).json({ error: error.message || "Failed to update payment" });
    }
});

router.get("/analytics", requireAuthStrict, async (req: any, res) => {
    try {
        const auth = req.auth;
        const userId = auth?.userId;

        if (!userId) {
            console.error("GET /analytics - No userId found in req.auth");
            return res.status(401).json({ error: "Unauthorized - No user ID" });
        }

        const user = await User.findOne({ clerkId: userId });
        let companyId = user?.companyId;

        if (!companyId) {
            const company = await CorporateCompany.findOne({ $or: [{ ownerId: userId }, { createdBy: userId }] });
            if (company) {
                companyId = company._id as any;
            }
        }

        if (!companyId) {
            return res.status(404).json({ error: "Company not found for this user" });
        }

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [totalBookings, pendingBookings, acceptedBookings, todayBookings, weekBookings, monthBookings] = await Promise.all([
            Booking.countDocuments({ companyId }),
            Booking.countDocuments({ companyId, status: "pending" }),
            Booking.countDocuments({ companyId, status: "accepted" }),
            Booking.countDocuments({ companyId, createdAt: { $gte: startOfDay } }),
            Booking.countDocuments({ companyId, createdAt: { $gte: startOfWeek } }),
            Booking.countDocuments({ companyId, createdAt: { $gte: startOfMonth } })
        ]);

        const cId = new mongoose.Types.ObjectId(companyId.toString());
        const acceptedMatch = { companyId: cId, status: "accepted" };

        const [revenueAll, revenuePaid, revenuePending, revenueRefunded, revenueToday, revenueWeek, revenueMonth] = await Promise.all([
            Booking.aggregate([
                { $match: acceptedMatch },
                { $group: { _id: null, total: { $sum: "$totalPrice" }, commission: { $sum: "$commissionAmount" }, net: { $sum: "$netAmount" } } }
            ]),
            Booking.aggregate([
                { $match: { ...acceptedMatch, paymentStatus: "paid" } },
                { $group: { _id: null, total: { $sum: "$totalPrice" }, commission: { $sum: "$commissionAmount" }, net: { $sum: "$netAmount" } } }
            ]),
            Booking.aggregate([
                { $match: { ...acceptedMatch, paymentStatus: { $in: ["pending", "partially_paid"] } } },
                { $group: { _id: null, total: { $sum: "$totalPrice" }, commission: { $sum: "$commissionAmount" }, net: { $sum: "$netAmount" } } }
            ]),
            Booking.aggregate([
                { $match: { ...acceptedMatch, paymentStatus: "refunded" } },
                { $group: { _id: null, total: { $sum: "$totalPrice" }, commission: { $sum: "$commissionAmount" }, net: { $sum: "$netAmount" } } }
            ]),
            Booking.aggregate([
                { $match: { companyId: cId, status: "accepted", createdAt: { $gte: startOfDay } } },
                { $group: { _id: null, total: { $sum: "$totalPrice" }, net: { $sum: "$netAmount" } } }
            ]),
            Booking.aggregate([
                { $match: { companyId: cId, status: "accepted", createdAt: { $gte: startOfWeek } } },
                { $group: { _id: null, total: { $sum: "$totalPrice" }, net: { $sum: "$netAmount" } } }
            ]),
            Booking.aggregate([
                { $match: { companyId: cId, status: "accepted", createdAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: "$totalPrice" }, net: { $sum: "$netAmount" } } }
            ])
        ]);

        const rAll = revenueAll[0] || { total: 0, commission: 0, net: 0 };
        const rPaid = revenuePaid[0] || { total: 0, commission: 0, net: 0 };
        const rPending = revenuePending[0] || { total: 0, commission: 0, net: 0 };
        const rRefunded = revenueRefunded[0] || { total: 0, commission: 0, net: 0 };
        const rToday = revenueToday[0] || { total: 0, net: 0 };
        const rWeek = revenueWeek[0] || { total: 0, net: 0 };
        const rMonth = revenueMonth[0] || { total: 0, net: 0 };

        res.json({
            overview: { totalBookings, pendingBookings, acceptedBookings, todayBookings, weekBookings, monthBookings },
            revenue: {
                total: rAll.total,
                commission: rAll.commission,
                net: rAll.net,
                paid: rPaid.total,
                pending: rPending.total,
                refunded: rRefunded.total
            },
            trends: {
                today: rToday.total,
                week: rWeek.total,
                month: rMonth.total
            }
        });
    } catch (error: any) {
        console.error("GET /analytics - Server Error:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

router.get("/:id", requireAuthStrict, async (req: any, res) => {
    try {
        const userId = req.auth?.userId;
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid booking ID format" });
        }
        
        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).json({ error: "Booking not found" });
        
        // Ensure the user owns this booking or is the company owner
        if (booking.userId !== userId) {
            // Check if it's the company owner
            const user = await User.findOne({ clerkId: userId });
            const company = await CorporateCompany.findById(booking.companyId);
            const isCompanyOwner = company && (
                (company as any).ownerId === userId || 
                (company as any).createdBy === userId || 
                (user?.companyId?.toString() === (company as any)._id?.toString())
            );
            
            if (!isCompanyOwner) {
                return res.status(403).json({ error: "Unauthorized" });
            }
        }
        
        res.json(booking);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
