import mongoose, { Schema, Document } from "mongoose";

export interface IMemoryItem {
  url: string;
  tripTitle: string;
  destination: string;
  date: Date;
}

export interface IMemory extends Document {
  userId: string;
  monthLabel: string;
  items: IMemoryItem[];
  trackIndex: number;
  createdAt: Date;
}

const MemorySchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  monthLabel: { type: String, required: true },
  items: [{
    url: String,
    tripTitle: String,
    destination: String,
    date: Date
  }],
  trackIndex: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Compound index to ensure one memory per month per user
MemorySchema.index({ userId: 1, monthLabel: 1 }, { unique: true });

export default mongoose.model<IMemory>("Memory", MemorySchema);
