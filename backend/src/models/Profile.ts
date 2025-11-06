import mongoose, { Schema, model } from "mongoose";

const StatsSchema = new Schema({
  trips: { type: Number, default: 0 },
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
}, { _id: false });

const ProfileSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  username: String,
  fullName: String,
  bio: String,
  location: String,
  imageUrl: String,
  coverImage: String,
  stats: { type: StatsSchema, default: () => ({}) },
}, { timestamps: true });

export type ProfileDocument = mongoose.InferSchemaType<typeof ProfileSchema> & mongoose.Document;
export const Profile = model<ProfileDocument>("Profile", ProfileSchema);


