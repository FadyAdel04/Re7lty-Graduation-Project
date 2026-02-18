import express from 'express';
import multer from 'multer';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { TripChatGroup, TripChatMessage } from '../models/TripChat';
import { CorporateCompany } from '../models/CorporateCompany';
import { User } from '../models/User';
import { uploadBufferToCloudinary, persistBase64 } from '../utils/media';
import { safePusherTrigger } from '../utils/pusherSafe';

import { CorporateTrip } from '../models/CorporateTrip';
import { ensureTripGroupExists } from '../utils/tripChatManager';
import { createNotification } from '../utils/notificationDispatcher';

const router = express.Router();

// Multer: store files in memory for Cloudinary stream upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit
});

/**
 * @swagger
 * /api/trip-groups:
 *   get:
 *     summary: Get all trip groups the user is part of
 */
router.get('/', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const userId = req.auth?.userId;

        // 1. Find user's company
        const user = await User.findOne({ clerkId: userId });
        console.log(`[TripChat] Fetching groups for user ${userId}. Linked company: ${user?.companyId}`);

        if (user && user.companyId) {
            // 2. Find all active trips for this company
            const trips = await CorporateTrip.find({ companyId: user.companyId });
            console.log(`[TripChat] Found ${trips.length} trips for company ${user.companyId}`);

            // 3. Ensure groups exist for these trips (parallelized)
            if (trips.length > 0) {
                await Promise.all(trips.map((trip: any) => ensureTripGroupExists(trip._id.toString(), userId)));
            }
        } else {
            // Check if user is owner of any company directly
            const company = await CorporateCompany.findOne({ ownerId: userId });
            if (company) {
                console.log(`[TripChat] User ${userId} is owner of company ${company._id} (no companyId in User model)`);
                const trips = await CorporateTrip.find({ companyId: company._id });
                if (trips.length > 0) {
                    await Promise.all(trips.map((trip: any) => ensureTripGroupExists(trip._id.toString(), userId)));
                }
            } else {
                console.log(`[TripChat] User ${userId} has no linked company and is not an owner.`);
            }
        }

        // 4. Return all groups the user is a participant in OR any groups belonging to their company if they are an owner/admin
        const query: any = {
            $or: [
                { participants: userId }
            ]
        };

        if (user && user.companyId) {
            query.$or.push({ companyId: user.companyId });
        } else {
            const company = await CorporateCompany.findOne({ ownerId: userId });
            if (company) {
                query.$or.push({ companyId: company._id });
            }
        }

        const groupsRaw = await TripChatGroup.find(query)
            .populate('tripId', 'startDate title')
            .populate('companyId', 'name logo ownerId')
            .sort({ lastMessageAt: -1 });

        console.log(`[TripChat] Returning ${groupsRaw.length} groups for user ${userId} (Query: ${JSON.stringify(query)})`);

        // Flatten so frontend gets companyName, companyLogo, companyOwnerId, unreadCount
        const groups = groupsRaw.map((g: any) => {
            const group = g.toObject ? g.toObject() : { ...g };
            const company = group.companyId;
            if (company && typeof company === 'object') {
                group.companyName = company.name;
                group.companyLogo = company.logo;
                group.companyOwnerId = company.ownerId;
                group.companyId = company._id;
            }
            const counts = group.unreadCounts;
            group.unreadCount = (userId && counts && (typeof counts.get === 'function' ? counts.get(userId) : (counts as Record<string, number>)[userId])) || 0;
            return group;
        });

        res.json(groups);
    } catch (error) {
        console.error("Error fetching trip groups:", error);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

/**
 * @swagger
 * /api/trip-groups/:groupId/participants:
 *   get:
 *     summary: Get details of participants in a trip group
 */
router.get('/:groupId/participants', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await TripChatGroup.findById(groupId);
        if (!group) return res.status(404).json({ error: 'Group not found' });

        // Company data from MongoDB (CorporateCompany) – used for admin display
        const company = await CorporateCompany.findById(group.companyId).select('name logo ownerId');
        const companyOwnerId = company?.ownerId;

        // Fetch users from our local User model
        const users = await User.find({
            clerkId: { $in: group.participants }
        }).select('clerkId fullName imageUrl username');

        // For the company owner, attach company name/logo from DB so UI shows company branding, not user data
        const participants = users.map((u: any) => {
            const doc = u.toObject ? u.toObject() : { ...u };
            if (company && companyOwnerId && doc.clerkId === companyOwnerId) {
                doc.isCompanyAdmin = true;
                doc.displayName = company.name;
                doc.displayImage = company.logo;
            } else {
                doc.displayName = doc.fullName;
                doc.displayImage = doc.imageUrl;
            }
            return doc;
        });

        res.json(participants);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch participants' });
    }
});

/**
 * @swagger
 * /api/trip-groups/:groupId/messages:
 *   get:
 *     summary: Get messages for a trip group
 */
router.get('/:groupId/messages', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { groupId } = req.params;

        if (!groupId) return res.status(400).json({ error: 'Group ID required' });

        const group = await TripChatGroup.findById(groupId);
        if (!group) return res.status(404).json({ error: 'Group not found' });

        const isMember = group.participants?.includes(userId as string);
        const company = group.companyId ? await CorporateCompany.findById(group.companyId) : null;
        const isOwner = company?.ownerId === userId;

        if (!isMember && !isOwner) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const rawMessages = await TripChatMessage.find({ conversationId: groupId })
            .sort({ createdAt: 1 })
            .limit(100)
            .lean();

        // Enrich company admin messages with company name and logo
        const messages = rawMessages.map((m: any) => {
            const doc = { ...m };
            if (company?.ownerId && doc.senderId === company.ownerId) {
                doc.senderName = company.name;
                doc.senderImage = company.logo;
            }
            return doc;
        });

        res.json(messages);
    } catch (error: any) {
        console.error('[TripGroupChat] GET messages error:', error?.message, error?.stack);
        res.status(500).json({ error: 'Failed to fetch messages', message: error?.message });
    }
});

/**
 * @swagger
 * /api/trip-groups/:groupId/messages:
 *   post:
 *     summary: Send a message to a trip group
 *     description: Accepts multipart/form-data for file uploads OR application/json for text-only messages.
 */
router.post('/:groupId/messages', ClerkExpressRequireAuth(), upload.single('file'), async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { groupId } = req.params;
        const body = req.body || {};
        const content = (body.content != null ? String(body.content) : '');
        const type = body.type;
        const mediaUrl = body.mediaUrl;
        const isAnnouncement = body.isAnnouncement;
        const uploadedFile = (req as any).file as Express.Multer.File | undefined;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!groupId) return res.status(400).json({ error: 'Group ID required' });

        const sender = await User.findOne({ clerkId: userId });

        const group = await TripChatGroup.findById(groupId);
        if (!group) return res.status(404).json({ error: 'Group not found' });

        // Sanitize participants in memory so we never use null/undefined when building unreadCounts
        if (Array.isArray(group.participants)) {
            group.participants = group.participants.filter((p: any) => p != null && p !== '' && typeof p === 'string');
        }

        const company = group.companyId ? await CorporateCompany.findById(group.companyId) : null;

        const isMember = group.participants?.includes(userId);
        const isCompanyStaff = company && (
            company.ownerId === userId ||
            company.createdBy === userId ||
            (sender?.companyId && sender.companyId.toString() === (company._id as any).toString())
        );

        if (!isMember && !isCompanyStaff) {
            return res.status(403).json({ error: 'Not a member' });
        }

        if (group.isLocked && !isCompanyStaff) {
            return res.status(403).json({ error: 'Group is locked (announcement mode)' });
        }

        const textContent = typeof content === 'string' ? content : (content || '');
        if (!textContent.trim() && !uploadedFile && !mediaUrl) {
            return res.status(400).json({ error: 'Message content or attachment required' });
        }

        let senderName = sender?.fullName || 'عضو';
        let senderImage = sender?.imageUrl;

        if (isCompanyStaff && company) {
            senderName = company.name;
            senderImage = company.logo;
        }

        let finalMediaUrl: string | undefined;
        let finalType = type || 'text';

        if (uploadedFile) {
            const mimeType = uploadedFile.mimetype;
            if (!type || type === 'text') {
                if (mimeType.startsWith('image/')) finalType = 'image';
                else if (mimeType.startsWith('video/')) finalType = 'video';
                else if (mimeType.startsWith('audio/')) finalType = 'voice';
                else if (mimeType === 'application/pdf') finalType = 'pdf';
                else finalType = 'pdf';
            }
            const subdir = finalType === 'voice' ? 'audio' : finalType === 'video' ? 'video' : finalType === 'image' ? 'images' : 'files';
            try {
                finalMediaUrl = await uploadBufferToCloudinary(uploadedFile.buffer, mimeType, subdir);
            } catch (uploadErr: any) {
                console.warn('[TripGroupChat] Cloudinary upload failed, trying base64 fallback:', uploadErr?.message);
                const maxBase64Media = 4 * 1024 * 1024;
                const maxBase64Pdf = 6 * 1024 * 1024;
                const allowFallback = (finalType === 'image' || finalType === 'voice' || finalType === 'video') && uploadedFile.buffer.length <= maxBase64Media
                    || (finalType === 'pdf') && uploadedFile.buffer.length <= maxBase64Pdf;
                if (allowFallback) {
                    try {
                        const b64 = uploadedFile.buffer.toString('base64');
                        const dataUrl = `data:${mimeType};base64,${b64}`;
                        finalMediaUrl = await persistBase64(dataUrl, subdir);
                    } catch (e2: any) {
                        console.warn('[TripGroupChat] Base64 fallback failed:', e2?.message);
                    }
                }
            }
        } else if (mediaUrl && typeof mediaUrl === 'string' && mediaUrl.startsWith('data:')) {
            try {
                const subdir = (finalType === 'voice' ? 'audio' : finalType === 'video' ? 'video' : 'chat');
                finalMediaUrl = await persistBase64(mediaUrl, subdir);
            } catch (persistErr: any) {
                console.warn('[TripGroupChat] Base64 persist failed:', persistErr?.message);
            }
        }

        const message = await TripChatMessage.create({
            conversationId: groupId,
            senderId: userId,
            senderName,
            senderImage,
            content: textContent || '',
            type: finalType,
            mediaUrl: finalMediaUrl,
            isAnnouncement: isAnnouncement === 'true' || isAnnouncement === true || false,
            readBy: userId ? [userId] : []
        });

        group.lastMessage = textContent || `أرسل ${finalType !== 'text' ? finalType : 'ملفاً'}`;
        group.lastMessageAt = new Date();
        group.lastMessageSenderId = userId;

        // Build unread map: only valid string keys (MongoDB/Mongoose reject null/undefined as Map keys)
        const raw = group.unreadCounts;
        const updatedUnread = new Map<string, number>();
        if (raw) {
            const entries = raw instanceof Map ? [...raw.entries()] : Object.entries(raw);
            for (const [k, v] of entries) {
                if (k != null && k !== '' && typeof k === 'string') {
                    updatedUnread.set(k, Number(v) || 0);
                }
            }
        }
        (group.participants || []).forEach((pId: any) => {
            const id = pId != null && pId !== '' && typeof pId === 'string' ? String(pId) : '';
            if (id && id !== userId) {
                updatedUnread.set(id, (updatedUnread.get(id) || 0) + 1);
            }
        });
        // Assign as plain object so Mongoose never receives a Map with invalid keys
        const obj: Record<string, number> = {};
        updatedUnread.forEach((v, k) => { obj[k] = v; });
        group.unreadCounts = obj as any;
        group.markModified('unreadCounts');

        await group.save();

        const messageObj = message.toObject ? message.toObject() : { ...message, _id: message._id };
        // Ensure type and mediaUrl are always present for frontend media rendering
        if (messageObj.type == null) messageObj.type = 'text';
        if (messageObj.mediaUrl == null && finalMediaUrl) messageObj.mediaUrl = finalMediaUrl;
        await safePusherTrigger(`trip-group-${groupId}`, 'new-message', { message: messageObj });

        // Notify company owner if the sender is not the owner
        if (company?.ownerId && userId && company.ownerId !== userId) {
            createNotification({
                recipientId: company.ownerId,
                actorId: userId!,
                actorName: sender?.fullName || group.name || 'مشارك',
                actorImage: sender?.imageUrl,
                type: 'message',
                message: content ? (content.substring(0, 60) + (content.length > 60 ? '...' : '')) : 'رسالة جديدة في مجموعة الرحلة',
                metadata: { tripGroupId: groupId, tripGroupName: group.name }
            }).catch((err: any) => console.error('Trip group notification error:', err));
        }

        res.json(messageObj);
    } catch (error: any) {
        console.error('[TripGroupChat] Critical Send Error:', error.message, error.stack);
        res.status(500).json({
            error: 'Failed to send message',
            message: error.message,
        });
    }
});

/**
 * @swagger
 * /api/trip-groups/:groupId/read:
 *   post:
 *     summary: Mark trip group as read for current user
 */
router.post('/:groupId/read', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { groupId } = req.params;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const group = await TripChatGroup.findById(groupId);
        if (!group) return res.status(404).json({ error: 'Group not found' });
        if (!group.participants.includes(userId)) return res.status(403).json({ error: 'Not a member' });

        const raw = group.unreadCounts;
        const updated = new Map<string, number>();
        if (raw) {
            const entries = raw instanceof Map ? [...raw.entries()] : Object.entries(raw);
            for (const [k, v] of entries) {
                if (k != null && k !== '' && typeof k === 'string') updated.set(k, Number(v) || 0);
            }
        }
        updated.set(userId, 0);
        const obj: Record<string, number> = {};
        updated.forEach((v, k) => { obj[k] = v; });
        group.unreadCounts = obj as any;
        group.markModified('unreadCounts');
        await group.save();

        // Mark all messages as read by me in this group
        await TripChatMessage.updateMany(
            { conversationId: groupId, readBy: { $ne: userId } },
            { $addToSet: { readBy: userId } }
        );

        // Notify others
        await safePusherTrigger(`trip-group-${groupId}`, 'messages-read', {
            readerId: userId
        });
        res.json({ success: true, unreadCount: 0 });
    } catch (error) {
        console.error('Error marking trip group read:', error);
        res.status(500).json({ error: 'Failed to mark read' });
    }
});

/**
 * @swagger
 * /api/trip-groups/:groupId/pin/:messageId:
 *   post:
 *     summary: Pin a message (admin only)
 */
router.post('/:groupId/pin/:messageId', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { groupId, messageId } = req.params;

        const group = await TripChatGroup.findById(groupId);
        const company = await CorporateCompany.findById(group?.companyId);

        if (company?.ownerId !== userId) {
            return res.status(403).json({ error: 'Admin only' });
        }

        if (group) {
            group.pinnedMessageId = messageId as any;
            await group.save();

            await safePusherTrigger(`trip-group-${groupId}`, 'pinned-update', { pinnedMessageId: messageId });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to pin message' });
    }
});

/**
 * @swagger
 * /api/trip-groups/:groupId/lock:
 *   post:
 *     summary: Toggle group lock (admin only)
 */
router.post('/:groupId/lock', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { groupId } = req.params;

        const group = await TripChatGroup.findById(groupId);
        const company = await CorporateCompany.findById(group?.companyId);

        if (company?.ownerId !== userId) {
            return res.status(403).json({ error: 'Admin only' });
        }

        if (group) {
            group.isLocked = !group.isLocked;
            await group.save();

            await safePusherTrigger(`trip-group-${groupId}`, 'lock-update', { isLocked: group.isLocked });
        }

        res.json({ success: true, isLocked: group?.isLocked });
    } catch (error) {
        res.status(500).json({ error: 'Failed to lock group' });
    }
});

/**
 * Toggle reaction on a group message
 */
router.post('/messages/:messageId/reaction', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const myId = req.auth?.userId;

        if (!myId) return res.status(401).json({ error: 'Unauthorized' });

        const message = await TripChatMessage.findById(messageId);
        if (!message) return res.status(404).json({ error: 'Message not found' });

        const existingReactionIndex = message.reactions?.findIndex(r => r.userId === myId && r.emoji === emoji) ?? -1;

        if (existingReactionIndex > -1) {
            message.reactions.splice(existingReactionIndex, 1);
        } else {
            if (!message.reactions) (message as any).reactions = [];
            message.reactions.push({ emoji, userId: myId });
        }

        await message.save();

        await safePusherTrigger(`trip-group-${message.conversationId}`, 'message-reaction', {
            messageId,
            reactions: message.reactions
        });

        res.json(message);
    } catch (error) {
        console.error('Error toggling reaction:', error);
        res.status(500).json({ error: 'Failed to update reaction' });
    }
});

export default router;
