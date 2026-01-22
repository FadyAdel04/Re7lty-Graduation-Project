import mongoose, { Schema, Document } from 'mongoose';

export interface IContentReport extends Document {
    tripId: mongoose.Types.ObjectId;
    reportedBy: string; // Clerk userId
    reason: 'spam' | 'inappropriate' | 'misleading' | 'other';
    description?: string;
    status: 'pending' | 'resolved' | 'dismissed';
    adminNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ContentReportSchema: Schema = new Schema(
    {
        tripId: {
            type: Schema.Types.ObjectId,
            ref: 'Trip',
            required: true,
        },
        reportedBy: {
            type: String,
            required: true,
        },
        reason: {
            type: String,
            enum: ['spam', 'inappropriate', 'misleading', 'other'],
            required: true,
        },
        description: {
            type: String,
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

// Indexes for faster queries
ContentReportSchema.index({ status: 1, createdAt: -1 });
ContentReportSchema.index({ tripId: 1 });
ContentReportSchema.index({ reportedBy: 1 });

// Prevent duplicate reports from same user for same trip
ContentReportSchema.index({ tripId: 1, reportedBy: 1 }, { unique: true });

export default mongoose.model<IContentReport>('ContentReport', ContentReportSchema);
