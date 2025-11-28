import mongoose, { Schema, model } from "mongoose";

const TripLoveSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    tripId: { type: Schema.Types.ObjectId, ref: "Trip", required: true, index: true },
  },
  { timestamps: true }
);

TripLoveSchema.index({ userId: 1, tripId: 1 }, { unique: true });

export type TripLoveDocument = mongoose.InferSchemaType<typeof TripLoveSchema> & mongoose.Document;
export const TripLove = model<TripLoveDocument>("TripLove", TripLoveSchema);









