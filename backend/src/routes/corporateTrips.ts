import express from 'express';
import { CorporateTrip } from '../models/CorporateTrip';
import { CorporateCompany } from '../models/CorporateCompany';
import { requireAdmin } from '../utils/adminMiddleware';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';


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

        const trip = await CorporateTrip.findOne(query).populate('companyId');

        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        res.json(trip);
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
        const trips = await CorporateTrip.find({
            companyId: req.params.companyId,
            isActive: true
        }).sort({ rating: -1 });

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
        const tripData = {
            ...req.body,
            createdBy: req.auth?.userId
        };

        const trip = new CorporateTrip(tripData);
        await trip.save();

        // Update company trips count
        await CorporateCompany.findByIdAndUpdate(
            trip.companyId,
            { $inc: { tripsCount: 1 } }
        );

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
        const trip = await CorporateTrip.findByIdAndUpdate(
            req.params.id,
            req.body,
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
        const trip = await CorporateTrip.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

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

export default router;
