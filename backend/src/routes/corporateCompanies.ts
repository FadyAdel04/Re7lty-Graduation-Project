import express from 'express';
import { CorporateCompany } from '../models/CorporateCompany';
import { CorporateTrip } from '../models/CorporateTrip';
import { requireAdmin } from '../utils/adminMiddleware';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';


/**
 * @swagger
 * components:
 *   schemas:
 *     CorporateCompany:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         logo:
 *           type: string
 *         contactEmail:
 *           type: string
 *         contactPhone:
 *           type: string
 *         website:
 *           type: string
 *         isActive:
 *           type: boolean
 *         rating:
 *           type: number
 *         tripsCount:
 *           type: integer
 */

const router = express.Router();

/**
 * @swagger
 * /corporate/companies:
 *   get:
 *     summary: Get all active corporate companies
 *     tags: [Corporate Companies]
 *     responses:
 *       200:
 *         description: List of active companies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CorporateCompany'
 */
router.get('/', async (req, res) => {
    try {
        const companies = await CorporateCompany.find({ isActive: true })
            .sort({ rating: -1 });

        res.json(companies);
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
});

/**
 * @swagger
 * /corporate/companies/{id}:
 *   get:
 *     summary: Get company by ID
 *     tags: [Corporate Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Company details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CorporateCompany'
 *       404:
 *         description: Company not found
 */
router.get('/:id', async (req, res) => {
    try {
        const company = await CorporateCompany.findById(req.params.id);

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.json(company);
    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({ error: 'Failed to fetch company' });
    }
});

/**
 * @swagger
 * /corporate/companies/admin/stats:
 *   get:
 *     summary: Get company statistics
 *     tags: [Admin - Corporate Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company statistics
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
        const total = await CorporateCompany.countDocuments();
        const active = await CorporateCompany.countDocuments({ isActive: true });
        res.json({ total, active, inactive: total - active });
    } catch (error) {
        console.error('Error fetching company stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

/**
 * @swagger
 * /admin/corporate/companies/all:
 *   get:
 *     summary: Get all companies (including inactive)
 *     tags: [Admin - Corporate Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all companies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CorporateCompany'
 */
router.get('/admin/all', ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
    try {
        const companies = await CorporateCompany.find()
            .sort({ createdAt: -1 });

        res.json(companies);
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
});

/**
 * @swagger
 * /admin/corporate/companies/create:
 *   post:
 *     summary: Create new company
 *     tags: [Admin - Corporate Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CorporateCompany'
 *     responses:
 *       201:
 *         description: Company created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CorporateCompany'
 */
router.post('/admin/create', ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
    try {
        const companyData = {
            ...req.body,
            createdBy: req.auth?.userId
        };

        const company = new CorporateCompany(companyData);
        await company.save();

        res.status(201).json({
            success: true,
            message: 'Company created successfully',
            company
        });
    } catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({ error: 'Failed to create company' });
    }
});

/**
 * @swagger
 * /admin/corporate/companies/{id}:
 *   put:
 *     summary: Update company
 *     tags: [Admin - Corporate Companies]
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
 *             $ref: '#/components/schemas/CorporateCompany'
 *     responses:
 *       200:
 *         description: Company updated
 */
router.put('/admin/:id', ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
    try {
        const company = await CorporateCompany.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.json({
            success: true,
            message: 'Company updated successfully',
            company
        });
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({ error: 'Failed to update company' });
    }
});

/**
 * @swagger
 * /admin/corporate/companies/{id}:
 *   delete:
 *     summary: Delete company (soft delete)
 *     tags: [Admin - Corporate Companies]
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
 *         description: Company deactivated
 */
router.delete('/admin/:id', ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
    try {
        const company = await CorporateCompany.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Also deactivate all trips for this company
        await CorporateTrip.updateMany(
            { companyId: req.params.id },
            { isActive: false }
        );

        res.json({
            success: true,
            message: 'Company deactivated successfully'
        });
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({ error: 'Failed to delete company' });
    }
});

/**
 * @swagger
 * /admin/corporate/companies/{id}/toggle-active:
 *   put:
 *     summary: Toggle company active status
 *     tags: [Admin - Corporate Companies]
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
 *         description: Company status toggled
 */
router.put('/admin/:id/toggle-active', ClerkExpressRequireAuth(), requireAdmin, async (req, res) => {
    try {
        const company = await CorporateCompany.findById(req.params.id);

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        company.isActive = !company.isActive;
        await company.save();

        res.json({
            success: true,
            message: `Company ${company.isActive ? 'activated' : 'deactivated'} successfully`,
            company
        });
    } catch (error) {
        console.error('Error toggling company status:', error);
        res.status(500).json({ error: 'Failed to toggle company status' });
    }
});

export default router;
