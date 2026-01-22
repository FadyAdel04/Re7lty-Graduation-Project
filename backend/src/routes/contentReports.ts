import express from 'express';
import { getAuth } from '@clerk/express';
import ContentReport from '../models/ContentReport';
import { Trip } from '../models/Trip';

const router = express.Router();

// Middleware to check authentication
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

/**
 * POST /api/content-reports
 * Submit a content report (authenticated users)
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        const { tripId, reason, description } = req.body;

        if (!tripId || !reason) {
            return res.status(400).json({ error: 'Trip ID and reason are required' });
        }

        if (!['spam', 'inappropriate', 'misleading', 'other'].includes(reason)) {
            return res.status(400).json({ error: 'Invalid reason' });
        }

        // Check if trip exists
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        // Check if user already reported this trip
        const existingReport = await ContentReport.findOne({
            tripId,
            reportedBy: userId,
        });

        if (existingReport) {
            return res.status(400).json({ error: 'You have already reported this trip' });
        }

        const report = new ContentReport({
            tripId,
            reportedBy: userId!,
            reason,
            description,
            status: 'pending',
        });

        await report.save();

        res.status(201).json({
            message: 'Report submitted successfully',
            report: {
                id: report._id,
                tripId: report.tripId,
                reason: report.reason,
                createdAt: report.createdAt,
            },
        });
    } catch (error: any) {
        console.error('Error submitting report:', error);

        // Handle duplicate report error
        if (error.code === 11000) {
            return res.status(400).json({ error: 'You have already reported this trip' });
        }

        res.status(500).json({ error: 'Failed to submit report', message: error.message });
    }
});

/**
 * GET /api/content-reports
 * Get all content reports (admin only)
 */
router.get('/', requireAuth, async (req, res) => {
    try {
        const { status } = req.query;

        const filter: any = {};
        if (status && ['pending', 'resolved', 'dismissed'].includes(status as string)) {
            filter.status = status;
        }

        const reports = await ContentReport.find(filter)
            .populate('tripId', 'title destination author images')
            .sort({ createdAt: -1 })
            .lean();

        res.json(reports);
    } catch (error: any) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Failed to fetch reports', message: error.message });
    }
});

/**
 * GET /api/content-reports/trip/:tripId
 * Get reports for a specific trip (admin only)
 */
router.get('/trip/:tripId', requireAuth, async (req, res) => {
    try {
        const { tripId } = req.params;

        const reports = await ContentReport.find({ tripId })
            .sort({ createdAt: -1 })
            .lean();

        res.json(reports);
    } catch (error: any) {
        console.error('Error fetching trip reports:', error);
        res.status(500).json({ error: 'Failed to fetch trip reports', message: error.message });
    }
});

/**
 * PATCH /api/content-reports/:id
 * Update report status and notes (admin only)
 */
router.patch('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;

        if (status && !['pending', 'resolved', 'dismissed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updateData: any = {};
        if (status) updateData.status = status;
        if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

        const report = await ContentReport.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('tripId', 'title destination author');

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        res.json(report);
    } catch (error: any) {
        console.error('Error updating report:', error);
        res.status(500).json({ error: 'Failed to update report', message: error.message });
    }
});

/**
 * DELETE /api/content-reports/:id
 * Delete a report (admin only)
 */
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const report = await ContentReport.findByIdAndDelete(id);

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        res.json({ message: 'Report deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting report:', error);
        res.status(500).json({ error: 'Failed to delete report', message: error.message });
    }
});

export default router;
