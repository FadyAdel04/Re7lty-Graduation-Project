import mongoose, { Schema, model } from "mongoose";

const FollowSchema = new Schema(
  {
    followerId: { type: String, required: true, index: true },
    followingId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

export type FollowDocument = mongoose.InferSchemaType<typeof FollowSchema> & mongoose.Document;
export const Follow = model<FollowDocument>("Follow", FollowSchema);













