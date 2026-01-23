import express from 'express';
import { CompanySubmission } from '../models/CompanySubmission';
import { requireAdmin } from '../utils/adminMiddleware';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';


/**
 * @swagger
 * components:
 *   schemas:
 *     CompanySubmission:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         companyName:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         whatsapp:
 *           type: string
 *         tripTypes:
 *           type: array
 *           items:
 *             type: string
 *         message:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         processedBy:
 *           type: string
 *         processedAt:
 *           type: string
 *           format: date-time
 *         rejectionReason:
 *           type: string
 *         adminNotes:
 *           type: string
 */

const router = express.Router();

/**
 * @swagger
 * /submissions:
 *   post:
 *     summary: Create a new company submission
 *     tags: [Submissions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyName
 *               - email
 *               - phone
 *               - whatsapp
 *               - tripTypes
 *             properties:
 *               companyName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               whatsapp:
 *                 type: string
 *               tripTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Submission created successfully
 *       400:
 *         description: Missing required fields
 */
import { getAuth } from '@clerk/express';
import { Notification as NotificationModel } from '../models/Notification';

// ... (existing code)

/**
 * POST /submissions
 * Create a new company submission
 */
router.post('/', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        // Set CORS headers explicitly for this endpoint
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header('Access-Control-Allow-Credentials', 'true');

        const { companyName, email, phone, whatsapp, tripTypes, message } = req.body;
        const { userId } = getAuth(req);

        // Validation
        if (!companyName || !email || !phone || !whatsapp || !tripTypes) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['companyName', 'email', 'phone', 'whatsapp', 'tripTypes']
            });
        }

        // Create submission
        const submission = new CompanySubmission({
            userId,
            companyName,
            email,
            phone,
            whatsapp,
            tripTypes,
            message: message || '',
            status: 'pending'
        });

        await submission.save();

        res.status(201).json({
            success: true,
            message: 'تم إرسال طلبك بنجاح. سنتواصل معك قريباً.',
            submission: {
                id: submission._id,
                companyName: submission.companyName,
                status: submission.status
            }
        });
    } catch (error) {
        console.error('Error creating submission:', error);
        res.status(500).json({ error: 'Failed to create submission' });
    }
});

// ... (stats route)

/**
 * PUT /admin/:id/approve
 * Approve a submission
 */
router.put('/admin/:id/approve', ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
    try {
        const { adminNotes } = req.body;
        const { userId: adminId } = getAuth(req);

        const submission = await CompanySubmission.findByIdAndUpdate(
            req.params.id,
            {
                status: 'approved',
                processedBy: req.auth?.userId,
                processedAt: new Date(),
                adminNotes: adminNotes || ''
            },
            { new: true }
        );

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        // Send notification
        if (submission.userId && adminId) {
            await NotificationModel.create({
                recipientId: submission.userId,
                actorId: adminId,
                actorName: "إدارة رحلتي",
                actorImage: "/assets/logo.png",
                type: "system",
                message: `تهانينا! تمت الموافقة على طلب انضمام شركتكم "${submission.companyName}". مرحباً بكم كشركاء في رحلتي!`,
                isRead: false,
                link: `/company/dashboard` // Or wherever they should go
            });
        }

        res.json({
            success: true,
            message: 'Submission approved successfully',
            submission
        });
    } catch (error) {
        console.error('Error approving submission:', error);
        res.status(500).json({ error: 'Failed to approve submission' });
    }
});

/**
 * PUT /admin/:id/reject
 * Reject a submission
 */
router.put('/admin/:id/reject', ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
    try {
        const { rejectionReason, adminNotes } = req.body;
        const { userId: adminId } = getAuth(req);

        const submission = await CompanySubmission.findByIdAndUpdate(
            req.params.id,
            {
                status: 'rejected',
                rejectionReason: rejectionReason || 'No reason provided',
                processedBy: req.auth?.userId,
                processedAt: new Date(),
                adminNotes: adminNotes || ''
            },
            { new: true }
        );

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        // Send notification
        if (submission.userId && adminId) {
            await NotificationModel.create({
                recipientId: submission.userId,
                actorId: adminId,
                actorName: "إدارة رحلتي",
                actorImage: "/assets/logo.png",
                type: "system",
                message: `نأسف لإبلاغكم أنه تم رفض طلب انضمام شركتكم "${submission.companyName}". السبب: ${rejectionReason || 'غير محدد'}`,
                isRead: false,
                link: `/contact`
            });
        }

        res.json({
            success: true,
            message: 'Submission rejected',
            submission
        });
    } catch (error) {
        console.error('Error rejecting submission:', error);
        res.status(500).json({ error: 'Failed to reject submission' });
    }
});

// ... (delete route)

/**
 * @swagger
 * /admin/submissions:
 *   get:
 *     summary: Get all submissions
 *     tags: [Admin - Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, approved, rejected]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 1000
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *         default: 0
 *     responses:
 *       200:
 *         description: List of submissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 submissions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CompanySubmission'
 *                 total:
 *                   type: integer
 *                 hasMore:
 *                   type: boolean
 */
/**
 * @swagger
 * /admin/submissions/stats:
 *   get:
 *     summary: Get submission statistics
 *     tags: [Admin - Submissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Submission stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pending:
 *                   type: integer
 *                 approved:
 *                   type: integer
 *                 rejected:
 *                   type: integer
 *                 total:
 *                   type: integer
 */
router.get('/admin/stats', ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
    try {
        const [pending, approved, rejected, total] = await Promise.all([
            CompanySubmission.countDocuments({ status: 'pending' }),
            CompanySubmission.countDocuments({ status: 'approved' }),
            CompanySubmission.countDocuments({ status: 'rejected' }),
            CompanySubmission.countDocuments()
        ]);

        res.json({
            pending,
            approved,
            rejected,
            total
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

router.get('/admin', ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
    try {
        const { status, limit = 1000, skip = 0 } = req.query;

        const query: any = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const submissions = await CompanySubmission.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip));

        const total = await CompanySubmission.countDocuments(query);

        res.json({
            submissions,
            total,
            hasMore: total > Number(skip) + submissions.length
        });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

/**
 * @swagger
 * /admin/submissions/{id}:
 *   get:
 *     summary: Get submission details
 *     tags: [Admin - Submissions]
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
 *         description: Submission details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompanySubmission'
 *       404:
 *         description: Submission not found
 */
router.get('/admin/:id', ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
    try {
        const submission = await CompanySubmission.findById(req.params.id);

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        res.json(submission);
    } catch (error) {
        console.error('Error fetching submission:', error);
        res.status(500).json({ error: 'Failed to fetch submission' });
    }
});

/**
 * @swagger
 * /admin/submissions/{id}/approve:
 *   put:
 *     summary: Approve a submission
 *     tags: [Admin - Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Submission approved
 *       404:
 *         description: Submission not found
 */
router.put('/admin/:id/approve', ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
    try {
        const { adminNotes } = req.body;

        const submission = await CompanySubmission.findByIdAndUpdate(
            req.params.id,
            {
                status: 'approved',
                processedBy: req.auth?.userId,
                processedAt: new Date(),
                adminNotes: adminNotes || ''
            },
            { new: true }
        );

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        res.json({
            success: true,
            message: 'Submission approved successfully',
            submission
        });
    } catch (error) {
        console.error('Error approving submission:', error);
        res.status(500).json({ error: 'Failed to approve submission' });
    }
});

/**
 * @swagger
 * /admin/submissions/{id}/reject:
 *   put:
 *     summary: Reject a submission
 *     tags: [Admin - Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rejectionReason:
 *                 type: string
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Submission rejected
 *       404:
 *         description: Submission not found
 */
router.put('/admin/:id/reject', ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
    try {
        const { rejectionReason, adminNotes } = req.body;

        const submission = await CompanySubmission.findByIdAndUpdate(
            req.params.id,
            {
                status: 'rejected',
                rejectionReason: rejectionReason || 'No reason provided',
                processedBy: req.auth?.userId,
                processedAt: new Date(),
                adminNotes: adminNotes || ''
            },
            { new: true }
        );

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        res.json({
            success: true,
            message: 'Submission rejected',
            submission
        });
    } catch (error) {
        console.error('Error rejecting submission:', error);
        res.status(500).json({ error: 'Failed to reject submission' });
    }
});

/**
 * @swagger
 * /admin/submissions/{id}:
 *   delete:
 *     summary: Delete a submission
 *     tags: [Admin - Submissions]
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
 *         description: Submission deleted
 *       404:
 *         description: Submission not found
 */
router.delete('/admin/:id', ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
    try {
        const submission = await CompanySubmission.findByIdAndDelete(req.params.id);

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        res.json({
            success: true,
            message: 'Submission deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting submission:', error);
        res.status(500).json({ error: 'Failed to delete submission' });
    }
});

export default router;
