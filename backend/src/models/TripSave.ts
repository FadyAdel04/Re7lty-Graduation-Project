import mongoose, { Schema, model } from "mongoose";

const TripSaveSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    tripId: { type: Schema.Types.ObjectId, ref: "Trip", required: true, index: true },
  },
  { timestamps: true }
);

TripSaveSchema.index({ userId: 1, tripId: 1 }, { unique: true });

export type TripSaveDocument = mongoose.InferSchemaType<typeof TripSaveSchema> & mongoose.Document;
export const TripSave = model<TripSaveDocument>("TripSave", TripSaveSchema);









