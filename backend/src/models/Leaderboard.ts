import mongoose, { Schema, model } from "mongoose";

const LeaderboardEntrySchema = new Schema({
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  rank: { type: Number, required: true },
  score: { type: Number, required: true },
  winnerName: String,
  winnerImage: String,
  tripTitle: String,
  tripImage: String,
  ownerId: String // Clerk user ID
}, { _id: false });

const LeaderboardSchema = new Schema({
  weekNumber: { type: Number, required: true },
  year: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  winners: [LeaderboardEntrySchema],
  label: String // e.g. "Week 12, 2024" or "20-27 March"
}, { timestamps: true });

// Ensure uniqueness of week and year
LeaderboardSchema.index({ weekNumber: 1, year: 1 }, { unique: true });

export type LeaderboardDocument = mongoose.InferSchemaType<typeof LeaderboardSchema> & mongoose.Document;
export const Leaderboard = model<LeaderboardDocument>("Leaderboard", LeaderboardSchema);
