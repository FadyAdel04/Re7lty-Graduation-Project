import mongoose, { Schema, model } from "mongoose";

const AIPlanUsageSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

AIPlanUsageSchema.index({ userId: 1, createdAt: -1 });

export type AIPlanUsageDocument = mongoose.InferSchemaType<typeof AIPlanUsageSchema> & mongoose.Document;
export const AIPlanUsage = model<AIPlanUsageDocument>("AIPlanUsage", AIPlanUsageSchema);
