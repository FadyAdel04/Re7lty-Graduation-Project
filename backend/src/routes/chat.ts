import express from 'express';
import { Conversation, Message } from '../models/Chat';
import { CorporateCompany } from '../models/CorporateCompany';
import { requireAuthStrict, getAuth } from '../utils/auth';
import { createNotification } from '../utils/notificationDispatcher';
import { getPusher } from '../services/pusher';

const router = express.Router();

function serializeMessage(message: InstanceType<typeof Message>) {
  return message.toObject ? message.toObject() : message;
}

/**
 * @swagger
 * /chat/start:
 *   post:
 *     summary: Start or get existing conversation
 */
router.post('/start', requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        let { companyId, tripId } = req.body;

        if (!userId || !companyId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate ObjectId formats to prevent 500 casting errors
        const mongoose = await import('mongoose');
        if (!mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).json({ error: 'Invalid company ID format' });
        }

        if (tripId && !mongoose.Types.ObjectId.isValid(tripId)) {
            console.warn(`[Chat] Invalid tripId format received: ${tripId}. Ignoring trip context.`);
            tripId = undefined; // Don't crash, just ignore invalid trip context
        }

        // Find existing conversation
        let conversation = await Conversation.findOne({
            userId,
            companyId,
            tripId: tripId || { $exists: false } // Only match if trip context matches
        });

        if (!conversation) {
            // Check if we have one without trip context if this one fails? 
            // Or maybe we want a unique conversation per user-company regardless of trip?
            // Usually, one conversation per user-company is better unless trips are very distinct.
            // Let's stick to one conversation per user-company for now to keep history together.
            conversation = await Conversation.findOne({ userId, companyId });
        }

        if (!conversation) {
            conversation = await Conversation.create({
                userId,
                companyId,
                tripId: tripId || undefined,
                participants: [userId, companyId],
                lastMessageAt: new Date()
            });
        } else if (tripId && !conversation.tripId) {
            // Update conversation with trip context if it was missing
            conversation.tripId = tripId as any;
            await conversation.save();
        }

        res.json(conversation);
    } catch (error) {
        console.error('Error starting chat:', error);
        res.status(500).json({ error: 'Failed to start chat', message: error instanceof Error ? error.message : 'Unknown error' });
    }
});

/**
 * @swagger
 * /chat/conversations:
 *   get:
 *     summary: Get conversations for current user (or company owner)
 */
router.get('/conversations', requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
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
            .sort({ lastMessageAt: -1 })
            .lean();

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
                const user = await User.findOne({ clerkId: conv.userId }).select('fullName imageUrl').lean();
                return {
                    ...conv,
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
router.get('/:conversationId/messages', requireAuthStrict, async (req, res) => {
    try {
        const { userId } = getAuth(req);
        const { conversationId } = req.params;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // User or company owner may read this thread
        if (conversation.userId !== userId) {
            const { User } = await import('../models/User');
            const user = await User.findOne({ clerkId: userId });
            const company = await CorporateCompany.findById(conversation.companyId);
            const isCompanyOwner =
                (user?.companyId && user.companyId.toString() === conversation.companyId.toString()) ||
                company?.ownerId === userId ||
                company?.createdBy === userId;
            if (!isCompanyOwner) {
                return res.status(403).json({ error: 'Unauthorized' });
            }
        }

        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 })
            .lean();

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
router.post('/:conversationId/messages', requireAuthStrict, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { content, senderType } = req.body; // senderType: 'user' or 'company'
        const { userId } = getAuth(req);

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
            content,
            readBy: [userId]
        });

        // Update conversation
        conversation.lastMessage = content;
        conversation.lastMessageAt = new Date();
        conversation.unreadCount += 1; // Simplistic unread count
        await conversation.save();

        // Trigger Pusher for real-time update
        const pusher = getPusher();
        if (pusher) {
            const serializedMessage = serializeMessage(message);
            pusher.trigger(`conversation-${conversationId}`, 'new-message', {
                message: serializedMessage
            });

            // Recipient: when user sends, company owner (Clerk ID) gets update on dashboard
            if (senderType === 'user') {
                const company = await CorporateCompany.findById(conversation.companyId);
                if (company?.ownerId) {
                    pusher.trigger(`user-chats-${company.ownerId}`, 'update-conversation', {
                        conversation: conversation.toObject ? conversation.toObject() : conversation,
                        message: serializedMessage,
                    });
                }
            } else {
                pusher.trigger(`user-chats-${conversation.userId}`, 'update-conversation', {
                    conversation: conversation.toObject ? conversation.toObject() : conversation,
                    message: serializedMessage,
                });
            }
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

        res.json(serializeMessage(message));
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

/**
 * Mark conversation as read
 */
router.post('/:conversationId/read', requireAuthStrict, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { userId: myId } = getAuth(req);

        if (!myId) return res.status(401).json({ error: 'Unauthorized' });

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        // Reset unread count if I am the intended receiver
        // Improvement: logic to check if I am user or company owner
        conversation.unreadCount = 0;
        await conversation.save();

        // Mark all messages as read by me
        await Message.updateMany(
            { conversationId, readBy: { $ne: myId } },
            { $addToSet: { readBy: myId }, read: true }
        );

        // Notify other participants that messages were read
        const pusher = getPusher();
        if (pusher) {
            pusher.trigger(`conversation-${conversationId}`, 'messages-read', {
                readerId: myId
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking as read:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

/**
 * Toggle reaction on a message
 */
router.post('/messages/:messageId/reaction', requireAuthStrict, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const { userId: myId } = getAuth(req);

        if (!myId) return res.status(401).json({ error: 'Unauthorized' });

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ error: 'Message not found' });

        const existingReactionIndex = message.reactions?.findIndex(r => r.userId === myId && r.emoji === emoji) ?? -1;

        if (existingReactionIndex > -1) {
            message.reactions.splice(existingReactionIndex, 1);
        } else {
            if (!message.reactions) (message as any).reactions = [];
            message.reactions.push({ emoji, userId: myId });
        }

        await message.save();

        const pusher = getPusher();
        if (pusher) {
            pusher.trigger(`conversation-${message.conversationId}`, 'message-reaction', {
                messageId,
                reactions: message.reactions
            });
        }

        res.json(message);
    } catch (error) {
        console.error('Error toggling reaction:', error);
        res.status(500).json({ error: 'Failed to update reaction' });
    }
});

export default router;
