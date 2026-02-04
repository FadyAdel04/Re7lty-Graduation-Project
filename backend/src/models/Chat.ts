import mongoose, { Schema, model } from "mongoose";

const MessageSchema = new Schema({
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: String, required: true }, // Clerk ID
    senderType: { type: String, enum: ['user', 'company'], required: true },
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
}, { timestamps: true });

const ConversationSchema = new Schema({
    participants: [{ type: String, required: true }], // [User Clerk ID, Company Owner Clerk ID/Company ID]
    userId: { type: String, required: true }, // The normal user
    companyId: { type: Schema.Types.ObjectId, ref: 'CorporateCompany', required: true }, // The company
    tripId: { type: Schema.Types.ObjectId, ref: 'CorporateTrip' }, // Optional: if chat started from specific trip
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
    unreadCount: { type: Number, default: 0 }, // For the receiver
}, { timestamps: true });

// Indexes
ConversationSchema.index({ userId: 1, companyId: 1 });
ConversationSchema.index({ companyId: 1 });
MessageSchema.index({ conversationId: 1, createdAt: 1 });

export type MessageDocument = mongoose.InferSchemaType<typeof MessageSchema> & mongoose.Document;
export type ConversationDocument = mongoose.InferSchemaType<typeof ConversationSchema> & mongoose.Document;

export const Message = model<MessageDocument>('Message', MessageSchema);
export const Conversation = model<ConversationDocument>('Conversation', ConversationSchema);
