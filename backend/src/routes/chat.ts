import express from 'express';
import { Conversation, Message } from '../models/Chat';
import { CorporateCompany } from '../models/CorporateCompany';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { createNotification } from '../utils/notificationDispatcher';
import { getPusher } from '../services/pusher';

const router = express.Router();

/**
 * @swagger
 * /chat/start:
 *   post:
 *     summary: Start or get existing conversation
 */
router.post('/start', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { companyId, tripId } = req.body;

        if (!userId || !companyId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Find existing conversation
        let conversation = await Conversation.findOne({
            userId,
            companyId
        });

        if (!conversation) {
            conversation = await Conversation.create({
                userId,
                companyId,
                tripId, // Optional context
                participants: [userId, companyId], // Simply storing IDs involved
                lastMessageAt: new Date()
            });
        }

        res.json(conversation);
    } catch (error) {
        console.error('Error starting chat:', error);
        res.status(500).json({ error: 'Failed to start chat' });
    }
});

/**
 * @swagger
 * /chat/conversations:
 *   get:
 *     summary: Get conversations for current user (or company owner)
 */
router.get('/conversations', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { asCompany } = req.query; // If true, finding conversations for my company

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        let query: any = {};

        if (asCompany === 'true') {
            // Find company owned by this user
            const { User } = await import('../models/User');
            const user = await User.findOne({ clerkId: userId });

            if (!user?.companyId) {
                return res.status(404).json({ error: 'Company not found' });
            }
            query = { companyId: user.companyId };
        } else {
            query = { userId };
        }

        const conversations = await Conversation.find(query)
            .populate('companyId', 'name logo')
            .populate('tripId', 'title slug')
            .sort({ lastMessageAt: -1 });

        // If I am the company, I might want to populate user details too? 
        // Typically we would need a User model reference or fetch from Clerk.
        // For now, let's rely on the client fetching user details or storing basic info.
        // Or we can populate if we have a User model stored locally (which we do).

        if (asCompany === 'true') {
            // Populate user info if possible. Since userId is String (Clerk ID), 
            // we can't standard populate unless we use virtuals or manual lookup.
            // Let's do manual lookup for simplicity.
            const { User } = await import('../models/User');
            const conversationsWithUsers = await Promise.all(conversations.map(async (conv) => {
                const user = await User.findOne({ clerkId: conv.userId }).select('fullName imageUrl');
                return {
                    ...conv.toObject(),
                    user
                };
            }));
            return res.json(conversationsWithUsers);
        }

        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

/**
 * @swagger
 * /chat/:conversationId/messages:
 *   get:
 *     summary: Get messages for a conversation
 */
router.get('/:conversationId/messages', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const { conversationId } = req.params;
        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

/**
 * @swagger
 * /chat/:conversationId/messages:
 *   post:
 *     summary: Send a message
 */
router.post('/:conversationId/messages', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { content, senderType } = req.body; // senderType: 'user' or 'company'
        const userId = req.auth?.userId;

        if (!content || !userId) {
            return res.status(400).json({ error: 'Missing content' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        // Security check: Ensure sender belongs to conversation
        if (senderType === 'user' && conversation.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (senderType === 'company') {
            // Verify user owns the company
            const { User } = await import('../models/User');
            const user = await User.findOne({ clerkId: userId });
            if (!user?.companyId || user.companyId.toString() !== conversation.companyId.toString()) {
                return res.status(403).json({ error: 'Unauthorized company representative' });
            }
        }

        const message = await Message.create({
            conversationId,
            senderId: userId,
            senderType,
            content
        });

        // Update conversation
        conversation.lastMessage = content;
        conversation.lastMessageAt = new Date();
        conversation.unreadCount += 1; // Simplistic unread count
        await conversation.save();

        // Trigger Pusher for real-time update
        const pusher = getPusher();
        if (pusher) {
            pusher.trigger(`conversation-${conversationId}`, 'new-message', {
                message
            });

            // Also trigger a general 'new-conversation-message' for the recipient's main list
            const recipientId = senderType === 'user' ? conversation.companyId.toString() : conversation.userId;
            pusher.trigger(`user-chats-${recipientId}`, 'update-conversation', {
                conversation
            });
        }

        // Notification Logic
        if (senderType === 'company') {
            // Notify User
            await createNotification({
                recipientId: conversation.userId,
                actorId: userId,
                actorName: "الدعم الفني للشركة", // Could fetch actual company name
                type: "system", // or 'message' if supported
                message: `رد جديد من الشركة: ${content.substring(0, 50)}...`, // Preview
                tripId: conversation.tripId,
                metadata: {
                    conversationId: conversation._id,
                    action: 'chat_reply'
                }
            });
        } else {
            // Notify Company Owner
            const company = await CorporateCompany.findById(conversation.companyId);
            if (company && company.ownerId) {
                const { User } = await import('../models/User');
                const senderUser = await User.findOne({ clerkId: userId });
                const senderName = senderUser ? `${senderUser.fullName}` : "عميل";

                await createNotification({
                    recipientId: company.ownerId, // Assuming ownerId is stored on company
                    actorId: userId,
                    actorName: senderName,
                    type: "system",
                    message: `رسالة جديدة من ${senderName}: ${content.substring(0, 50)}...`,
                    tripId: conversation.tripId,
                    metadata: {
                        conversationId: conversation._id,
                        action: 'chat_message'
                    }
                });
            }
            // Fallback: if company.createdBy stores the admin who is owner
            else if (company && company.createdBy) {
                // logic to notify createdBy if ownerId is missing
            }
        }

        res.json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

export default router;
