import express from 'express';
import { DirectConversation, DirectMessage } from '../models/DirectChat';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { getPusher } from '../services/pusher';
import { persistBase64 } from '../utils/media';
import { safePusherTrigger } from '../utils/pusherSafe';

const router = express.Router();

/**
 * Start or get existing direct conversation
 */
router.post('/start', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const myId = req.auth?.userId;
        const { targetUserId } = req.body;

        if (!myId || !targetUserId) {
            return res.status(400).json({ error: 'Missing target user ID' });
        }

        if (myId === targetUserId) {
            return res.status(400).json({ error: 'Cannot message yourself' });
        }

        // Find existing direct conversation between these two users
        let conversation = await DirectConversation.findOne({
            participants: { $all: [myId, targetUserId], $size: 2 }
        });

        if (!conversation) {
            conversation = await DirectConversation.create({
                participants: [myId, targetUserId],
                lastMessageAt: new Date(),
                unreadCounts: { [myId]: 0, [targetUserId]: 0 }
            });
        }

        res.json(conversation);
    } catch (error) {
        console.error('Error starting direct chat:', error);
        res.status(500).json({ error: 'Failed to start chat' });
    }
});

/**
 * Get all conversations for current user
 */
router.get('/conversations', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const myId = req.auth?.userId;
        if (!myId) return res.status(401).json({ error: 'Unauthorized' });

        const conversations = await DirectConversation.find({
            participants: myId
        }).sort({ lastMessageAt: -1 });

        // Populate participant info manually
        const results = await Promise.all(conversations.map(async (conv) => {
            const otherParticipantId = conv.participants.find(p => p !== myId);
            let otherParticipant = null;

            if (otherParticipantId) {
                otherParticipant = await User.findOne({ clerkId: otherParticipantId })
                    .select('fullName imageUrl username clerkId');
            }

            return {
                ...conv.toObject(),
                otherParticipant,
                unreadCount: conv.unreadCounts.get(myId) || 0
            };
        }));

        res.json(results);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

/**
 * Search users for new chat
 */
router.get('/search-users', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || typeof query !== 'string') return res.json([]);

        const users = await User.find({
            $or: [
                { fullName: { $regex: query, $options: 'i' } },
                { username: { $regex: query, $options: 'i' } }
            ],
            clerkId: { $ne: req.auth?.userId }
        }).select('fullName imageUrl username clerkId').limit(10);

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

/**
 * Get messages
 */
router.get('/:conversationId/messages', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const { conversationId } = req.params;
        const messages = await DirectMessage.find({ conversationId })
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

/**
 * Send a message
 */
router.post('/:conversationId/messages', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { content, type, mediaUrl } = req.body;
        const myId = req.auth?.userId;

        if (!myId) return res.status(401).json({ error: 'Unauthorized' });

        const conversation = await DirectConversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        if (!conversation.participants.includes(myId)) {
            return res.status(403).json({ error: 'Not a member of this conversation' });
        }

        // Persist media if it's base64
        let finalMediaUrl = mediaUrl;
        if (mediaUrl && mediaUrl.startsWith('data:')) {
            const subdir = type === 'voice' ? 'audio' : type === 'video' ? 'video' : 'chat';
            finalMediaUrl = await persistBase64(mediaUrl, subdir);
        }

        const message = await DirectMessage.create({
            conversationId,
            senderId: myId,
            content,
            type: type || 'text',
            mediaUrl: finalMediaUrl,
            readBy: [myId]
        });

        // Update conversation state
        conversation.lastMessage = type === 'image' ? '📸 Image' : (type === 'voice' ? '🎤 Voice message' : content);
        conversation.lastMessageAt = new Date();
        conversation.lastMessageSenderId = myId;

        // Increment unread counts for all OTHERS
        const updatedUnreadCounts = new Map(conversation.unreadCounts);
        conversation.participants.forEach(pId => {
            if (pId !== myId) {
                const current = updatedUnreadCounts.get(pId) || 0;
                updatedUnreadCounts.set(pId.toString(), current + 1);
            }
        });
        conversation.unreadCounts = updatedUnreadCounts;
        await conversation.save();

        // Safe Trigger Pusher
        await safePusherTrigger(`direct-conversation-${conversationId}`, 'new-message', {
            message
        });

        // Get sender info for the notification
        const sender = await User.findOne({ clerkId: myId }).select('fullName imageUrl username');

        conversation.participants.forEach(pId => {
            if (pId !== myId) {
                safePusherTrigger(`user-direct-chats-${pId}`, 'update-conversation', {
                    conversation: {
                        ...conversation.toObject(),
                        otherParticipant: sender,
                        unreadCount: conversation.unreadCounts.get(pId) || 0
                    },
                    lastMessage: message,
                    senderId: myId
                });

                // Persist notification in DB (avoiding duplicate awaits in the loop)
                Notification.create({
                    recipientId: pId,
                    actorId: myId,
                    actorName: sender?.fullName || 'مستخدم',
                    actorImage: sender?.imageUrl,
                    type: 'message',
                    message: conversation.lastMessage,
                    metadata: { conversationId }
                }).catch(err => console.error('Error creating chat notification record:', err));
            }
        });

        res.json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

/**
 * Mark conversation as read
 */
router.post('/:conversationId/read', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const { conversationId } = req.params;
        const myId = req.auth?.userId;

        if (!myId) return res.status(401).json({ error: 'Unauthorized' });

        const conversation = await DirectConversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        // Reset my unread count
        const updatedCounts = new Map(conversation.unreadCounts);
        updatedCounts.set(myId.toString(), 0);
        conversation.unreadCounts = updatedCounts;
        await conversation.save();

        // Mark all messages as read by me
        await DirectMessage.updateMany(
            { conversationId, readBy: { $ne: myId } },
            { $addToSet: { readBy: myId } }
        );

        // Notify other participants that messages were read
        const pusher = getPusher();
        if (pusher) {
            pusher.trigger(`direct-conversation-${conversationId}`, 'messages-read', {
                readerId: myId
            });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

/**
 * Toggle reaction on a message
 */
router.post('/messages/:messageId/reaction', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const myId = req.auth?.userId;

        if (!myId) return res.status(401).json({ error: 'Unauthorized' });

        const message = await DirectMessage.findById(messageId);
        if (!message) return res.status(404).json({ error: 'Message not found' });

        // Check if user already reacted with THIS emoji
        const existingReactionIndex = message.reactions?.findIndex(r => r.userId === myId && r.emoji === emoji) ?? -1;

        if (existingReactionIndex > -1) {
            // Remove reaction
            message.reactions.splice(existingReactionIndex, 1);
        } else {
            // Add reaction
            if (!message.reactions) (message as any).reactions = [];
            message.reactions.push({ emoji, userId: myId });
        }

        await message.save();

        // Trigger Pusher
        const pusher = getPusher();
        if (pusher) {
            pusher.trigger(`direct-conversation-${message.conversationId}`, 'message-reaction', {
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
