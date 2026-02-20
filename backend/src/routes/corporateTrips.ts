import express from 'express';
import { CorporateTrip } from '../models/CorporateTrip';
import { CorporateCompany } from '../models/CorporateCompany';
import { requireAdmin } from '../utils/adminMiddleware';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { persistBase64 } from '../utils/media';
import { createNotification } from '../utils/notificationDispatcher';
import { Booking } from '../models/Booking';
import { ensureTripGroupExists } from '../utils/tripChatManager';
import {
  validateTripTitle,
  validateDescription,
  validatePrice,
  validateSeats,
  validateStartDate,
  validateReturnDate
} from '../utils/validators';


/**
 * @swagger
 * components:
 *   schemas:
 *     CorporateTrip:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         slug:
 *           type: string
 *         description:
 *           type: string
 *         destination:
 *           type: string
 *         companyId:
 *           type: string
 *         price:
 *           type: number
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         duration:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         isActive:
 *           type: boolean
 *         rating:
 *           type: number
 */

const router = express.Router();

/**
 * @swagger
 * /corporate/trips:
 *   get:
 *     summary: Get all active corporate trips
 *     tags: [Corporate Trips]
 *     parameters:
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of trips
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trips:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CorporateTrip'
 *                 total:
 *                   type: integer
 *                 hasMore:
 *                   type: boolean
 */
router.get('/', async (req, res) => {
    try {
        const {
            destination,
            companyId,
            minRating,
            season,
            limit = 100,
            skip = 0
        } = req.query;

        const query: any = { isActive: true };

        if (destination) query.destination = destination;
        if (companyId) query.companyId = companyId;
        if (season) query.season = season;
        if (minRating) query.rating = { $gte: Number(minRating) };

        const trips = await CorporateTrip.find(query)
            .populate('companyId')
            .sort({ rating: -1, createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip));

        const total = await CorporateTrip.countDocuments(query);

        res.json({
            trips,
            total,
            hasMore: total > Number(skip) + trips.length
        });
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).json({ error: 'Failed to fetch trips' });
    }
});

/**
 * @swagger
 * /corporate/trips/{slug}:
 *   get:
 *     summary: Get trip by slug
 *     tags: [Corporate Trips]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CorporateTrip'
 *       404:
 *         description: Trip not found
 */
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const isObjectId = slug.match(/^[0-9a-fA-F]{24}$/);

        const query: any = {
            isActive: true,
            $or: [{ slug }]
        };

        if (isObjectId) {
            query.$or.push({ _id: slug });
        }

        const trip = await CorporateTrip.findOneAndUpdate(
            query,
            { $inc: { views: 1 } },
            { new: true }
        ).populate('companyId');

        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        // Fetch all pending bookings for this trip to block their seats
        const pendingBookings = await Booking.find({
            tripId: trip._id,
            status: 'pending'
        });

        // Create a copy of the trip to modify it for the response
        const tripObj = trip.toObject();

        // Add pending seats to seatBookings list
        pendingBookings.forEach(booking => {
            if (booking.selectedSeats && booking.selectedSeats.length > 0) {
                booking.selectedSeats.forEach(seatNum => {
                    // Avoid duplicates if already accepted or in another pending booking
                    if (!tripObj.seatBookings.some((s: any) => s.seatNumber === seatNum)) {
                        tripObj.seatBookings.push({
                            seatNumber: seatNum,
                            passengerName: `${booking.userName} (قيد الانتظار)`,
                            userId: booking.userId,
                            bookingId: booking._id
                        });
                    }
                });
            }
        });

        res.json(tripObj);
    } catch (error) {
        console.error('Error fetching trip:', error);
        res.status(500).json({ error: 'Failed to fetch trip' });
    }
});

/**
 * @swagger
 * /corporate/trips/company/{companyId}:
 *   get:
 *     summary: Get all trips for a specific company
 *     tags: [Corporate Trips]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Company trips
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CorporateTrip'
 */
router.get('/company/:companyId', async (req, res) => {
    try {
        const query: any = { companyId: req.params.companyId };

        // Ensure we're fetching only active trips for public view
        query.isActive = true;
        const trips = await CorporateTrip.find(query).sort({ rating: -1 });

        res.json(trips);
    } catch (error) {
        console.error('Error fetching company trips:', error);
        res.status(500).json({ error: 'Failed to fetch company trips' });
    }
});

/**
 * @swagger
 * /corporate/trips/featured/top:
 *   get:
 *     summary: Get featured/top-rated trips
 *     tags: [Corporate Trips]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *     responses:
 *       200:
 *         description: Featured trips
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CorporateTrip'
 */
router.get('/featured/top', async (req, res) => {
    try {
        const { limit = 4 } = req.query;

        const trips = await CorporateTrip.find({ isActive: true })
            .populate('companyId')
            .sort({ rating: -1, likes: -1 })
            .limit(Number(limit));

        res.json(trips);
    } catch (error) {
        console.error('Error fetching featured trips:', error);
        res.status(500).json({ error: 'Failed to fetch featured trips' });
    }
});

/**
 * @swagger
 * /corporate/trips/admin/stats:
 *   get:
 *     summary: Get trip statistics
 *     tags: [Admin - Corporate Trips]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trip statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 active:
 *                   type: integer
 *                 inactive:
 *                   type: integer
 */
router.get('/admin/stats', ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
    try {
        const total = await CorporateTrip.countDocuments();
        const active = await CorporateTrip.countDocuments({ isActive: true });
        res.json({ total, active, inactive: total - active });
    } catch (error) {
        console.error('Error fetching trip stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

/**
 * @swagger
 * /admin/corporate/trips/all:
 *   get:
 *     summary: Get all trips (including inactive)
 *     tags: [Admin - Corporate Trips]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all trips
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CorporateTrip'
 */
router.get('/admin/all', ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
    try {
        const trips = await CorporateTrip.find()
            .populate('companyId')
            .sort({ createdAt: -1 });

        res.json(trips);
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).json({ error: 'Failed to fetch trips' });
    }
});

/**
 * @swagger
 * /admin/corporate/trips/create:
 *   post:
 *     summary: Create new trip
 *     tags: [Admin - Corporate Trips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CorporateTrip'
 *     responses:
 *       201:
 *         description: Trip created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CorporateTrip'
 */
router.post('/admin/create', ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
    try {
        // Process images if present
        let processedImages = req.body.images;
        if (processedImages && Array.isArray(processedImages)) {
            processedImages = await Promise.all(processedImages.map((img: string) => persistBase64(img, 'corporate-trips')));
        }

        const tripData = {
            ...req.body,
            images: processedImages || req.body.images,
            createdBy: req.auth?.userId
        };

        // Fix empty strings causing CastErrors
        if (!tripData.startDate) delete tripData.startDate;
        if (!tripData.endDate) delete tripData.endDate;
        if (!tripData.maxGroupSize) delete tripData.maxGroupSize;

        const trip = new CorporateTrip(tripData) as any;
        await trip.save();

        // Update company trips count
        await CorporateCompany.findByIdAndUpdate(
            trip.companyId,
            { $inc: { tripsCount: 1 } }
        );

        // Ensure trip group exists
        await ensureTripGroupExists(trip._id.toString(), req.auth?.userId);

        res.status(201).json({
            success: true,
            message: 'Trip created successfully',
            trip
        });
    } catch (error) {
        console.error('Error creating trip:', error);
        res.status(500).json({ error: 'Failed to create trip' });
    }
});

/**
 * @swagger
 * /corporate/trips/me/create:
 *   post:
 *     summary: Create new trip for current company owner
 *     tags: [Corporate Trips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CorporateTrip'
 *     responses:
 *       201:
 *         description: Trip created
 */
function validateImageBase64(dataUrl: string): { valid: boolean; message?: string } {
    if (!dataUrl || typeof dataUrl !== 'string') return { valid: true };
    const m = /^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/.exec(dataUrl);
    if (!m) return { valid: true }; // not base64, might be URL
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(m[1].toLowerCase())) {
        return { valid: false, message: 'يجب أن تكون الصور من نوع jpeg, png, gif أو webp فقط' };
    }
    const base64Len = m[2].length;
    const approxBytes = (base64Len * 3) / 4;
    if (approxBytes > 5 * 1024 * 1024) {
        return { valid: false, message: 'حجم الصورة يجب ألا يتجاوز 5 ميجابايت' };
    }
    return { valid: true };
}

router.post('/me/create', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        // Get user and verify company owner status
        const { User } = await import('../models/User');
        const user = await User.findOne({ clerkId: req.auth?.userId });

        if (!user || !user.companyId || user.role !== 'company_owner') {
            return res.status(403).json({ error: 'Unauthorized: Only company owners can create trips' });
        }

        const { title, shortDescription, fullDescription, price, maxGroupSize, availableSeats, startDate, endDate } = req.body;

        const tCheck = validateTripTitle(title);
        if (!tCheck.valid) return res.status(400).json({ error: tCheck.message });

        const descVal = fullDescription || shortDescription || '';
        const dCheck = validateDescription(descVal);
        if (!dCheck.valid) return res.status(400).json({ error: dCheck.message });

        const pCheck = validatePrice(price);
        if (!pCheck.valid) return res.status(400).json({ error: pCheck.message });

        const seatsVal = availableSeats ?? maxGroupSize ?? 0;
        const sCheck = validateSeats(seatsVal);
        if (!sCheck.valid) return res.status(400).json({ error: sCheck.message });

        if (startDate) {
            const sdCheck = validateStartDate(startDate);
            if (!sdCheck.valid) return res.status(400).json({ error: sdCheck.message });
        }
        if (startDate && endDate) {
            const rdCheck = validateReturnDate(endDate, startDate);
            if (!rdCheck.valid) return res.status(400).json({ error: rdCheck.message });
        }

        const startForDup = startDate ? new Date(startDate) : null;
        if (req.body.destination && startForDup) {
            const startDay = new Date(startForDup);
            startDay.setHours(0, 0, 0, 0);
            const endDay = new Date(startDay);
            endDay.setDate(endDay.getDate() + 1);
            const dup = await CorporateTrip.findOne({
                companyId: user.companyId,
                destination: req.body.destination,
                startDate: { $gte: startDay, $lt: endDay },
                isActive: true
            });
            if (dup) return res.status(400).json({ error: 'رحلة بنفس الوجهة وتاريخ البداية موجودة مسبقاً' });
        }

        const images = req.body.images;
        if (images && Array.isArray(images)) {
            for (let i = 0; i < images.length; i++) {
                if (images[i] && typeof images[i] === 'string') {
                    const imgCheck = validateImageBase64(images[i]);
                    if (!imgCheck.valid) return res.status(400).json({ error: imgCheck.message });
                }
            }
        }

        // Sanitize itinerary: remove items with empty title or description
        if (req.body.itinerary && Array.isArray(req.body.itinerary)) {
            req.body.itinerary = req.body.itinerary.filter((item: any) =>
                item.title?.trim() || item.description?.trim()
            );
        }

        // Process images if present
        let processedImages = req.body.images;
        if (processedImages && Array.isArray(processedImages)) {
            processedImages = await Promise.all(processedImages.map((img: string) => persistBase64(img, 'corporate-trips')));
        }

        const tripData = {
            ...req.body,
            images: processedImages || req.body.images,
            companyId: user.companyId, // Force company ID from user profile
            createdBy: req.auth?.userId,
            isActive: true
        };

        // Fix empty strings causing CastErrors
        if (!tripData.startDate) delete tripData.startDate;
        if (!tripData.endDate) delete tripData.endDate;
        if (!tripData.maxGroupSize) delete tripData.maxGroupSize;

        const trip = new CorporateTrip(tripData) as any;
        await trip.save();

        // Update company trips count
        await CorporateCompany.findByIdAndUpdate(
            user.companyId,
            { $inc: { tripsCount: 1 } }
        );

        // Ensure trip group exists
        await ensureTripGroupExists(trip._id.toString(), req.auth?.userId);

        res.status(201).json({
            success: true,
            message: 'Trip created successfully',
            trip
        });
    } catch (error: any) {
        console.error('Error creating trip:', error);

        // Handle Mongoose validation errors specifically
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'خطأ في التحقق من البيانات',
                details: Object.values(error.errors).map((err: any) => err.message).join(', ')
            });
        }

        // Handle duplication error (e.g. slug)
        if (error.code === 11000) {
            return res.status(400).json({
                error: 'هذه الرحلة موجودة بالفعل (العنوان مكرر)',
                details: 'يرجى تغيير عنوان الرحلة'
            });
        }

        res.status(500).json({
            error: 'Failed to create trip',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * @swagger
 * /corporate/trips/me/{id}:
 *   put:
 *     summary: Update trip by company owner
 *     tags: [Corporate Trips]
 *     security:
 *       - bearerAuth: []
 */
router.put('/me/:id', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const { User } = await import('../models/User');
        const user = await User.findOne({ clerkId: req.auth?.userId });

        if (!user || !user.companyId || user.role !== 'company_owner') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const trip = await CorporateTrip.findById(req.params.id);
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        // Verify that this trip belongs to the user's company
        if (trip.companyId.toString() !== user.companyId.toString()) {
            return res.status(403).json({ error: 'Unauthorized: This trip belongs to another company' });
        }

        const { title, shortDescription, fullDescription, price, maxGroupSize, availableSeats, startDate, endDate } = req.body;

        if (title !== undefined) {
            const tCheck = validateTripTitle(title);
            if (!tCheck.valid) return res.status(400).json({ error: tCheck.message });
        }
        if ((fullDescription || shortDescription) !== undefined) {
            const descVal = fullDescription ?? shortDescription ?? trip.fullDescription ?? trip.shortDescription ?? '';
            const dCheck = validateDescription(descVal);
            if (!dCheck.valid) return res.status(400).json({ error: dCheck.message });
        }
        if (price !== undefined) {
            const pCheck = validatePrice(price);
            if (!pCheck.valid) return res.status(400).json({ error: pCheck.message });
        }
        const seatsVal = availableSeats ?? maxGroupSize ?? trip.maxGroupSize ?? trip.availableSeats;
        if (seatsVal !== undefined) {
            const bookedCount = trip.seatBookings?.length || 0;
            const sCheck = validateSeats(seatsVal, bookedCount);
            if (!sCheck.valid) return res.status(400).json({ error: sCheck.message });
        }
        if (startDate) {
            const sdCheck = validateStartDate(startDate);
            if (!sdCheck.valid) return res.status(400).json({ error: sdCheck.message });
        }
        if (startDate && endDate) {
            const rdCheck = validateReturnDate(endDate, startDate);
            if (!rdCheck.valid) return res.status(400).json({ error: rdCheck.message });
        }
        if (req.body.images && Array.isArray(req.body.images)) {
            for (let i = 0; i < req.body.images.length; i++) {
                if (req.body.images[i] && typeof req.body.images[i] === 'string' && req.body.images[i].startsWith('data:')) {
                    const imgCheck = validateImageBase64(req.body.images[i]);
                    if (!imgCheck.valid) return res.status(400).json({ error: imgCheck.message });
                }
            }
        }

        // Process images if present
        if (req.body.images && Array.isArray(req.body.images)) {
            // Only process if it looks like base64
            req.body.images = await Promise.all(req.body.images.map((img: string) => {
                if (img.startsWith('data:')) {
                    return persistBase64(img, 'corporate-trips');
                }
                return img;
            }));
        }

        const updateData = { ...req.body };
        // Clean up empty fields that might cause CastErrors
        if (updateData.startDate === '') delete updateData.startDate;
        if (updateData.endDate === '') delete updateData.endDate;
        if (updateData.maxGroupSize === '') delete updateData.maxGroupSize;

        const updatedTrip = await CorporateTrip.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('companyId');

        res.json({
            success: true,
            message: 'Trip updated successfully',
            trip: updatedTrip
        });
    } catch (error: any) {
        console.error('Error updating trip:', error);
        res.status(500).json({ error: 'Failed to update trip', details: error.message });
    }
});

/**
 * @swagger
 * /admin/corporate/trips/{id}:
 *   put:
 *     summary: Update trip
 *     tags: [Admin - Corporate Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CorporateTrip'
 *     responses:
 *       200:
 *         description: Trip updated
 */
router.put('/admin/:id', ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
    try {
        // Process images if present
        if (req.body.images && Array.isArray(req.body.images)) {
            req.body.images = await Promise.all(req.body.images.map((img: string) => persistBase64(img, 'corporate-trips')));
        }

        const updateData = { ...req.body };
        if (!updateData.startDate) delete updateData.startDate;
        if (!updateData.endDate) delete updateData.endDate;
        if (!updateData.maxGroupSize) delete updateData.maxGroupSize;

        const trip = await CorporateTrip.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('companyId');

        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        res.json({
            success: true,
            message: 'Trip updated successfully',
            trip
        });
    } catch (error) {
        console.error('Error updating trip:', error);
        res.status(500).json({ error: 'Failed to update trip' });
    }
});

/**
 * @swagger
 * /admin/corporate/trips/{id}:
 *   delete:
 *     summary: Delete trip (soft delete)
 *     tags: [Admin - Corporate Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip deactivated
 */
router.delete('/admin/:id', ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
    try {
        const trip = await CorporateTrip.findById(req.params.id);
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        const bookingsCount = await Booking.countDocuments({
            tripId: trip._id,
            status: { $in: ['pending', 'accepted'] }
        });
        if (bookingsCount > 0) {
            return res.status(400).json({
                error: 'لا يمكن حذف رحلة بها حجوزات',
                message: `يوجد ${bookingsCount} حجز(ات) لهذه الرحلة. يرجى إلغاء الحجوزات أولاً أو إلغاء تفعيل الرحلة بدلاً من الحذف.`
            });
        }

        await CorporateTrip.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        // Update company trips count
        await CorporateCompany.findByIdAndUpdate(
            trip.companyId,
            { $inc: { tripsCount: -1 } }
        );

        res.json({
            success: true,
            message: 'Trip deactivated successfully'
        });
    } catch (error) {
        console.error('Error deleting trip:', error);
        res.status(500).json({ error: 'Failed to delete trip' });
    }
});

/**
 * @swagger
 * /admin/corporate/trips/{id}/toggle-active:
 *   put:
 *     summary: Toggle trip active status
 *     tags: [Admin - Corporate Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip status toggled
 */
router.put('/admin/:id/toggle-active', ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
    try {
        const trip = await CorporateTrip.findById(req.params.id);

        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        const wasActive = trip.isActive;
        trip.isActive = !trip.isActive;
        await trip.save();

        // Update company trips count
        const increment = trip.isActive ? 1 : -1;
        await CorporateCompany.findByIdAndUpdate(
            trip.companyId,
            { $inc: { tripsCount: increment } }
        );

        res.json({
            success: true,
            message: `Trip ${trip.isActive ? 'activated' : 'deactivated'} successfully`,
            trip
        });
    } catch (error) {
        console.error('Error toggling trip status:', error);
        res.status(500).json({ error: 'Failed to toggle trip status' });
    }
});

/**
 * @swagger
 * /corporate/trips/{id}/seats:
 *   patch:
 *     summary: Update seat bookings (Company Owner only)
 *     tags: [Corporate Trips]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const { User } = await import('../models/User');
        const user = await User.findOne({ clerkId: req.auth?.userId });

        if (!user || !user.companyId || user.role !== 'company_owner') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const trip = await CorporateTrip.findById(req.params.id);
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        if (trip.companyId.toString() !== user.companyId.toString()) {
            return res.status(403).json({ error: 'Unauthorized: This trip belongs to another company' });
        }

        const updatedTrip = await CorporateTrip.findByIdAndUpdate(
            req.params.id,
            { seatBookings: req.body.seatBookings },
            { new: true }
        );

        // Notify users who have bookings for this trip
        try {
            const bookings = await Booking.find({ tripId: req.params.id, status: 'accepted' });
            for (const booking of bookings) {
                // Find if this user has a seat assigned in the new layout
                const assignedSeat = req.body.seatBookings.find((s: any) =>
                    s.passengerName.toLowerCase().includes(booking.userName.toLowerCase())
                );

                if (assignedSeat) {
                    // Save seat number to booking for easy retrieval
                    await Booking.findByIdAndUpdate(booking._id, { seatNumber: assignedSeat.seatNumber });
                } else {
                    // Clear seat if no longer assigned (optional but cleaner)
                    await Booking.findByIdAndUpdate(booking._id, { $unset: { seatNumber: "" } });
                }

                await createNotification({
                    recipientId: booking.userId,
                    actorId: user.clerkId,
                    actorName: user.fullName || "فريق الرحلة",
                    type: "system",
                    message: assignedSeat
                        ? `تم تحديد مقعدك في الرحلة: ${trip.title}. رقم مقعدك هو ${assignedSeat.seatNumber}.`
                        : `تم تحديث مخطط المقاعد لرحلتك: ${trip.title}.`,
                    tripId: trip._id,
                    metadata: {
                        seatNumber: assignedSeat?.seatNumber,
                        action: 'seat_assignment',
                        tripSlug: trip.slug
                    }
                });
            }
        } catch (notifyError) {
            console.error('Error sending seat notifications:', notifyError);
        }

        res.json({
            success: true,
            message: 'Seat bookings updated successfully',
            trip: updatedTrip
        });
    } catch (error: any) {
        console.error('Error updating seats:', error);
        res.status(500).json({ error: 'Failed to update seats', details: error.message });
    }
});

export default router;
