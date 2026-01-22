import mongoose, { Schema, Document } from 'mongoose';

export interface IComplaint extends Document {
    userId?: string;
    name: string;
    email: string;
    subject?: string;
    message: string;
    status: 'pending' | 'resolved' | 'dismissed';
    adminNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ComplaintSchema: Schema = new Schema(
    {
        userId: {
            type: String,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        subject: {
            type: String,
            trim: true,
        },
        message: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'resolved', 'dismissed'],
            default: 'pending',
        },
        adminNotes: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
ComplaintSchema.index({ status: 1, createdAt: -1 });
ComplaintSchema.index({ email: 1 });

export default mongoose.model<IComplaint>('Complaint', ComplaintSchema);
