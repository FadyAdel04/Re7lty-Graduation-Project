import mongoose, { Schema, model } from "mongoose";

const TripChatGroupSchema = new Schema({
    tripId: { type: Schema.Types.ObjectId, ref: 'CorporateTrip', required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'CorporateCompany', required: true },
    name: { type: String, required: true },
    tripImage: { type: String },
    participants: [{ type: String }], // Clerk IDs
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
    lastMessageSenderId: { type: String },
    isLocked: { type: Boolean, default: false }, // If true, only admin can send messages
    pinnedMessageId: { type: Schema.Types.ObjectId, ref: 'TripChatMessage' },
    unreadCounts: {
        type: Map,
        of: Number,
        default: {}
    },
}, { timestamps: true });

const TripChatMessageSchema = new Schema({
    conversationId: { type: Schema.Types.ObjectId, ref: 'TripChatGroup', required: true, index: true },
    senderId: { type: String, required: true }, // Clerk ID
    senderName: { type: String },
    senderImage: { type: String },
    content: { type: String, required: false, default: "" },
    type: {
        type: String,
        enum: ['text', 'image', 'voice', 'video', 'pdf', 'announcement', 'system'],
        default: 'text'
    },
    mediaUrl: { type: String },
    isAnnouncement: { type: Boolean, default: false },
    reactions: [{
        emoji: { type: String, required: true },
        userId: { type: String, required: true }
    }],
    readBy: [{ type: String }], // List of Clerk IDs who read the message
}, { timestamps: true });

// Indexes
TripChatGroupSchema.index({ participants: 1 });
TripChatMessageSchema.index({ conversationId: 1, createdAt: 1 });

export type TripChatGroupDocument = mongoose.InferSchemaType<typeof TripChatGroupSchema> & mongoose.Document;
export type TripChatMessageDocument = mongoose.InferSchemaType<typeof TripChatMessageSchema> & mongoose.Document;

export const TripChatGroup = model<TripChatGroupDocument>('TripChatGroup', TripChatGroupSchema);
export const TripChatMessage = model<TripChatMessageDocument>('TripChatMessage', TripChatMessageSchema);
