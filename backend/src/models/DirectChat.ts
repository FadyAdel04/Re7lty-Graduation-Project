import mongoose, { Schema, model } from "mongoose";

const DirectMessageSchema = new Schema({
    conversationId: { type: Schema.Types.ObjectId, ref: 'DirectConversation', required: true },
    senderId: { type: String, required: true }, // Clerk ID
    content: { type: String, required: false, default: "" },
    readBy: [{ type: String }], // List of Clerk IDs who read the message
    type: { type: String, enum: ['text', 'image', 'voice', 'video'], default: 'text' },
    mediaUrl: { type: String }, // For image/voice/video
    reactions: [{
        emoji: { type: String, required: true },
        userId: { type: String, required: true } // Clerk ID
    }],
}, { timestamps: true });

const DirectConversationSchema = new Schema({
    participants: [{ type: String, required: true }], // Clerk IDs
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
    lastMessageSenderId: { type: String },
    unreadCounts: {
        type: Map,
        of: Number,
        default: {}
    }, // Map of Clerk ID -> unread count
}, { timestamps: true });

// Indexes
DirectConversationSchema.index({ participants: 1 });
DirectMessageSchema.index({ conversationId: 1, createdAt: 1 });

export type DirectMessageDocument = mongoose.InferSchemaType<typeof DirectMessageSchema> & mongoose.Document;
export type DirectConversationDocument = mongoose.InferSchemaType<typeof DirectConversationSchema> & mongoose.Document;

export const DirectMessage = model<DirectMessageDocument>('DirectMessage', DirectMessageSchema);
export const DirectConversation = model<DirectConversationDocument>('DirectConversation', DirectConversationSchema);
