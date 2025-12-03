import mongoose, { Schema, model } from "mongoose";

const NotificationSchema = new Schema(
  {
    recipientId: { type: String, required: true, index: true },
    actorId: { type: String, required: true },
    actorName: String,
    actorImage: String,
    type: {
      type: String,
      enum: ["love", "save", "comment", "follow"],
      required: true,
    },
    message: { type: String, required: true },
    tripId: { type: Schema.Types.ObjectId, ref: "Trip" },
    commentId: { type: Schema.Types.ObjectId },
    metadata: Schema.Types.Mixed,
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, isRead: 1 });

export type NotificationDocument = mongoose.InferSchemaType<typeof NotificationSchema> & mongoose.Document;
export const Notification = model<NotificationDocument>("Notification", NotificationSchema);












