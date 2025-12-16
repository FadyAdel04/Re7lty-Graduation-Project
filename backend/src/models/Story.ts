import { Schema, model } from "mongoose";

const StorySchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true, // Clerk user id (same as Trip.ownerId / Follow ids)
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    caption: {
      type: String,
      maxlength: 500,
    },
    viewedBy: {
      type: [String], // array of viewer Clerk IDs
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Automatically remove stories after their expiration time
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Story = model("Story", StorySchema);

export type StoryDocument = typeof Story extends { prototype: infer P } ? P : never;


