import express from 'express';
import { getAuth } from '@clerk/express';
import Complaint from '../models/Complaint';

const router = express.Router();

// Middleware to check if user is admin
const requireAuthStrict = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

import { Notification as NotificationModel } from '../models/Notification';

/**
 * POST /api/complaints
 * Submit a new complaint (public endpoint)
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        // Try to get auth if available (optional for public form)
        const { userId } = getAuth(req);

        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, email, and message are required' });
        }

        const complaint = new Complaint({
            userId, // Save userId if authenticated
            name,
            email,
            subject,
            message,
            status: 'pending',
        });

        await complaint.save();

        res.status(201).json({
            message: 'Complaint submitted successfully',
            complaint: {
                id: complaint._id,
                name: complaint.name,
                email: complaint.email,
                subject: complaint.subject,
                createdAt: complaint.createdAt,
            },
        });
    } catch (error: any) {
        console.error('Error submitting complaint:', error);
        res.status(500).json({ error: 'Failed to submit complaint', message: error.message });
    }
});

/**
 * GET /api/complaints
 * Get all complaints (admin only)
 */
router.get('/', requireAuthStrict, async (req, res) => {
    try {
        const { status } = req.query;

        const filter: any = {};
        if (status && ['pending', 'resolved', 'dismissed'].includes(status as string)) {
            filter.status = status;
        }

        const complaints = await Complaint.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        res.json(complaints);
    } catch (error: any) {
        console.error('Error fetching complaints:', error);
        res.status(500).json({ error: 'Failed to fetch complaints', message: error.message });
    }
});

/**
 * PATCH /api/complaints/:id
 * Update complaint status and notes (admin only)
 */
router.patch('/:id', requireAuthStrict, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        const { userId: adminId } = getAuth(req);

        if (status && !['pending', 'resolved', 'dismissed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updateData: any = {};
        if (status) updateData.status = status;
        if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

        const complaint = await Complaint.findByIdAndUpdate(
            id,
            updateData,
            { new: false } // Get original document to check status change
        );

        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        // Send notification if status changed and user exists
        if (status && status !== complaint.status && complaint.userId && adminId) {
            let message = "";
            const subjectPreview = complaint.subject || "No Subject";

            if (status === 'resolved') {
                message = `تم حل استفسارك بخصوص "${subjectPreview}". شكراً لمساعدتك في تحسين المنصة!`;
            } else if (status === 'dismissed') {
                message = `تمت مراجعة وإغلاق استفسارك بخصوص "${subjectPreview}". شكراً لملاحظاتك.`;
            }

            if (message) {
                await NotificationModel.create({
                    recipientId: complaint.userId,
                    actorId: adminId,
                    actorName: "دعم رحلتي",
                    actorImage: "/assets/logo.png",
                    type: "system",
                    message: message,
                    isRead: false,
                    link: "/contact"
                });
            }
        }

        // Return updated document
        const updatedComplaint = await Complaint.findById(id);
        res.json(updatedComplaint);
    } catch (error: any) {
        console.error('Error updating complaint:', error);
        res.status(500).json({ error: 'Failed to update complaint', message: error.message });
    }
});

/**
 * DELETE /api/complaints/:id
 * Delete a complaint (admin only)
 */
router.delete('/:id', requireAuthStrict, async (req, res) => {
    try {
        const { id } = req.params;

        const complaint = await Complaint.findByIdAndDelete(id);

        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        res.json({ message: 'Complaint deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting complaint:', error);
        res.status(500).json({ error: 'Failed to delete complaint', message: error.message });
    }
});

export default router;
