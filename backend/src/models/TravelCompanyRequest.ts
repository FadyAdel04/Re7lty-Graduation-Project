import mongoose, { Schema, model } from "mongoose";

const TravelCompanyRequestSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    companyId: { type: String, required: true },
    companyName: { type: String, required: true },
    destination: { type: String, required: true },
    travelDates: {
      checkIn: String,
      checkOut: String,
    },
    numberOfTravelers: { type: Number, default: 1 },
    budget: String,
    tripDetails: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ["pending", "viewed", "responded", "confirmed", "declined"],
      default: "pending",
    },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    quotedPrice: { type: Number },
    companyNotes: { type: String },
    confirmedAt: { type: Date },
    message: String,
    requestedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

TravelCompanyRequestSchema.index({ userId: 1, requestedAt: -1 });
TravelCompanyRequestSchema.index({ companyId: 1, status: 1 });

export type TravelCompanyRequestDocument = mongoose.InferSchemaType<
  typeof TravelCompanyRequestSchema
> &
  mongoose.Document;

export const TravelCompanyRequest = model<TravelCompanyRequestDocument>(
  "TravelCompanyRequest",
  TravelCompanyRequestSchema
);
