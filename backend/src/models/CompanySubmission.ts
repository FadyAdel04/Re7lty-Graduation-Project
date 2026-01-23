import mongoose, { Schema, model } from "mongoose";

const CompanySubmissionSchema = new Schema({
    userId: { type: String, required: true, index: true },
    companyName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    whatsapp: { type: String, required: true },
    tripTypes: { type: String, required: true }, // e.g., "Safari, Beach, Historical"
    message: { type: String }, // Optional message from company
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    adminNotes: { type: String }, // Notes added by admin
    rejectionReason: { type: String }, // Reason for rejection
    processedBy: { type: String }, // Clerk ID of admin who processed
    processedAt: { type: Date }, // When it was approved/rejected
}, { timestamps: true });

// Index for faster queries
CompanySubmissionSchema.index({ status: 1, createdAt: -1 });

export type CompanySubmissionDocument = mongoose.InferSchemaType<typeof CompanySubmissionSchema> & mongoose.Document;
export const CompanySubmission = model<CompanySubmissionDocument>('CompanySubmission', CompanySubmissionSchema);
