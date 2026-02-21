import express from 'express';
import { Coupon } from '../models/Coupon';
import { User } from '../models/User';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { CorporateTrip } from '../models/CorporateTrip';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Coupon:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         code:
 *           type: string
 *         discountType:
 *           type: string
 *           enum: [percentage, fixed]
 *         discountValue:
 *           type: number
 *         expiryDate:
 *           type: string
 *           format: date-time
 *         companyId:
 *           type: string
 *         isActive:
 *           type: boolean
 *         usageLimit:
 *           type: number
 *         usageCount:
 *           type: number
 *         applicableTrips:
 *           type: array
 *           items:
 *             type: string
 */

// Get current user's company's coupons
router.get('/my-coupons', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const user = await User.findOne({ clerkId: req.auth?.userId });
        if (!user || user.role !== 'company_owner' || !user.companyId) {
            return res.status(403).json({ error: 'Only company owners can access coupons' });
        }

        const coupons = await Coupon.find({ companyId: user.companyId }).sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ error: 'Failed to fetch coupons' });
    }
});

// Create a new coupon
router.post('/', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const user = await User.findOne({ clerkId: req.auth?.userId });
        if (!user || user.role !== 'company_owner' || !user.companyId) {
            return res.status(403).json({ error: 'Only company owners can create coupons' });
        }

        const { code, discountType, discountValue, expiryDate, usageLimit, applicableTrips } = req.body;

        const newCoupon = new Coupon({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            expiryDate,
            usageLimit,
            applicableTrips,
            companyId: user.companyId
        });

        await newCoupon.save();
        res.status(201).json(newCoupon);
    } catch (error: any) {
        console.error('Error creating coupon:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'كود الخصم هذا موجود بالفعل لشركتك' });
        }
        res.status(500).json({ error: 'Failed to create coupon' });
    }
});

// Delete a coupon
router.delete('/:id', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const user = await User.findOne({ clerkId: req.auth?.userId });
        if (!user || user.role !== 'company_owner' || !user.companyId) {
            return res.status(403).json({ error: 'Only company owners can delete coupons' });
        }

        const coupon = await Coupon.findOneAndDelete({ _id: req.params.id, companyId: user.companyId });
        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

        res.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ error: 'Failed to delete coupon' });
    }
});

// Validate a coupon
router.post('/validate', async (req, res) => {
    try {
        const rawCode = req.body?.code;
        const rawTripId = req.body?.tripId;
        const code = typeof rawCode === 'string' ? rawCode.trim() : '';
        const tripId = rawTripId != null ? String(rawTripId).trim() : '';

        if (!code || !tripId) {
            return res.status(400).json({ error: 'أدخل كود الخصم وتأكد من الرحلة' });
        }

        const trip = await CorporateTrip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ error: 'الرحلة غير موجودة' });
        }

        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            companyId: trip.companyId,
            isActive: true,
            expiryDate: { $gt: new Date() }
        });

        if (!coupon) {
            return res.status(400).json({ error: 'كود الخصم غير صالح أو منتهي الصلاحية' });
        }

        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            return res.status(400).json({ error: 'تم استهلاك كود الخصم بالكامل' });
        }

        if (coupon.applicableTrips.length > 0 && !coupon.applicableTrips.some(id => id.toString() === tripId)) {
            return res.status(400).json({ error: 'هذا الكود لا ينطبق على هذه الرحلة' });
        }

        res.json({
            success: true,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            couponId: coupon._id
        });
    } catch (error) {
        console.error('Error validating coupon:', error);
        res.status(500).json({ error: 'Failed to validate coupon' });
    }
});

export default router;
