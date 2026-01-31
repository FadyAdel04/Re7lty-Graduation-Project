import mongoose, { Schema, model } from "mongoose";

const RemovedCommentSchema = new Schema({
    originalCommentId: String,
    tripId: String,
    userId: String,
    authorName: String, // Snapshot of name at time of storage
    content: String,
    detectedWords: [String],
    reason: String,
    removedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export type RemovedCommentDocument = mongoose.InferSchemaType<typeof RemovedCommentSchema> & mongoose.Document;
export const RemovedComment = model<RemovedCommentDocument>("RemovedComment", RemovedCommentSchema);
