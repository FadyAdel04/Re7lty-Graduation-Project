import express from 'express';
import { CompanySubmission } from '../models/CompanySubmission';
import { requireAdmin } from '../utils/adminMiddleware';
import { requireAuthStrict, getAuth, clerkClient } from '../utils/auth';
import { User } from '../models/User';
import { Notification as NotificationModel } from '../models/Notification';

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

/**
 * POST /submissions
 * Create a new company submission
 */
router.post('/', requireAuthStrict, async (req, res) => {
    try {
        // Set CORS headers explicitly for this endpoint
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header('Access-Control-Allow-Credentials', 'true');

        const { companyName, email, phone, whatsapp, tripTypes, message } = req.body;
        const { userId } = getAuth(req);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: User ID missing' });
        }

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

        // Update User Role and Onboarding Status
        await User.findOneAndUpdate(
            { clerkId: userId },
            {
                $set: {
                    role: "company_pending",
                    isOnboarded: true,
                    companyId: submission._id
                }
            },
            { upsert: true }
        );

        // Update Clerk Metadata
        try {
            await clerkClient.users.updateUser(userId, {
                publicMetadata: {
                    role: "company_pending",
                    isOnboarded: true
                }
            });
        } catch (err) {
            console.error("Failed to update Clerk metadata:", err);
            // Don't fail the request if Clerk update fails
        }

        res.status(201).json({
            success: true,
            message: 'تم إرسال طلبك بنجاح. سنتواصل معك قريباً.',
            submission: {
                id: submission._id,
                companyName: submission.companyName,
                status: submission.status
            }
        });
    } catch (error: any) {
        console.error('Error creating submission:', error);
        res.status(500).json({ error: 'Failed to create submission', details: error.message });
    }
});

// ... (stats route)

// Duplicate routes removed

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
router.get('/admin/stats', requireAuthStrict, requireAdmin, async (req, res) => {
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

router.get('/admin', requireAuthStrict, requireAdmin, async (req, res) => {
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
router.get('/admin/:id', requireAuthStrict, requireAdmin, async (req, res) => {
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
router.put('/admin/:id/approve', requireAuthStrict, requireAdmin, async (req, res) => {
    try {
        const { adminNotes } = req.body;
        const { userId: adminId } = getAuth(req);

        const submission = await CompanySubmission.findByIdAndUpdate(
            req.params.id,
            {
                status: 'approved',
                processedBy: adminId,
                processedAt: new Date(),
                adminNotes: adminNotes || ''
            },
            { new: true }
        );

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        // Update User Role to Company Owner
        if (submission.userId) {
            const { User } = await import("../models/User");
            const { CorporateCompany } = await import("../models/CorporateCompany");

            // Check if company already exists
            const existingCompany = await CorporateCompany.findOne({ contactInfo: { email: submission.email } });
            let companyId;

            if (existingCompany) {
                companyId = existingCompany._id;
            } else {
                // Create new Corporate Company Profile
                const newCompany = await CorporateCompany.create({
                    name: submission.companyName,
                    description: submission.message || `مرحباً بكم في ${submission.companyName}`,
                    logo: "https://via.placeholder.com/150",
                    color: "from-blue-500 to-cyan-500", // Default color
                    contactInfo: {
                        email: submission.email,
                        phone: submission.phone,
                        whatsapp: submission.whatsapp,
                        website: "",
                        address: ""
                    },
                    tags: submission.tripTypes.split(',').map(t => t.trim()),
                    isActive: true,
                    ownerId: submission.userId,
                    createdBy: adminId
                });
                companyId = newCompany._id;
            }

            await User.findOneAndUpdate(
                { clerkId: submission.userId },
                {
                    $set: {
                        role: 'company_owner',
                        companyId: companyId
                    }
                }
            );

            // Update Clerk
            try {
                const { clerkClient } = await import("../utils/auth");
                await clerkClient.users.updateUser(submission.userId, {
                    publicMetadata: { role: 'company_owner' }
                });
            } catch (err) {
                console.error("Clerk role update failed:", err);
            }

            // Send notification
            if (adminId) {
                await NotificationModel.create({
                    recipientId: submission.userId,
                    actorId: adminId,
                    actorName: "إدارة رحلتي",
                    actorImage: "/assets/logo.png",
                    type: "system",
                    message: `تهانينا! تمت الموافقة على طلب انضمام شركتكم "${submission.companyName}". مرحباً بكم كشركاء في رحلتي!`,
                    isRead: false,
                    link: `/company/dashboard`
                });
            }
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
router.put('/admin/:id/reject', requireAuthStrict, requireAdmin, async (req, res) => {
    try {
        const { rejectionReason, adminNotes } = req.body;
        const { userId: adminId } = getAuth(req);

        const submission = await CompanySubmission.findByIdAndUpdate(
            req.params.id,
            {
                status: 'rejected',
                rejectionReason: rejectionReason || 'No reason provided',
                processedBy: adminId,
                processedAt: new Date(),
                adminNotes: adminNotes || ''
            },
            { new: true }
        );

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        // Update User Role to Company Rejected
        if (submission.userId) {
            const { User } = await import("../models/User");
            await User.findOneAndUpdate(
                { clerkId: submission.userId },
                { $set: { role: 'company_rejected' } }
            );

            // Update Clerk
            try {
                const { clerkClient } = await import("../utils/auth");
                await clerkClient.users.updateUser(submission.userId, {
                    publicMetadata: { role: 'company_rejected' }
                });
            } catch (err) {
                console.error("Clerk role update failed:", err);
            }

            // Send notification
            if (adminId) {
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
router.delete('/admin/:id', requireAuthStrict, requireAdmin, async (req, res) => {
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
