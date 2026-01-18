import mongoose, { Schema, model } from "mongoose";

const CommentSchema = new Schema({
  authorId: { type: String, index: true },
  author: String,
  authorAvatar: String,
  content: String,
  date: String,
  likes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
}, { _id: true, timestamps: true });

const ActivitySchema = new Schema({
  name: String,
  images: [String],
  videos: [String],
  coordinates: { lat: Number, lng: Number },
  day: Number,
}, { _id: false });

const DaySchema = new Schema({
  title: String,
  date: String,
  activities: [Number],
}, { _id: false });

const FoodSchema = new Schema({
  name: String,
  image: String,
  rating: Number,
  description: String,
}, { _id: false });

const HotelSchema = new Schema({
  name: String,
  image: String,
  rating: Number,
  description: String,
  priceRange: String,
}, { _id: false });

const TripSchema = new Schema({
  title: { type: String, required: true },
  destination: String,
  city: String,
  duration: String,
  rating: { type: Number, default: 4.5 },
  image: String,
  author: String,
  authorFollowers: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  weeklyLikes: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  description: String,
  budget: String,
  season: {
    type: String,
    enum: ['winter', 'summer', 'fall', 'spring'],
    required: false // Optional for backward compatibility with existing trips
  },
  activities: [ActivitySchema],
  days: [DaySchema],
  foodAndRestaurants: [FoodSchema],
  hotels: [HotelSchema],
  comments: [CommentSchema],
  postedAt: { type: Date, default: () => new Date() },
  ownerId: { type: String, index: true }, // Clerk user id
  isAIGenerated: { type: Boolean, default: false }, // Flag for AI-generated trips
}, { timestamps: true });

TripSchema.index({ postedAt: -1 });
TripSchema.index({ likes: -1 });

export type TripDocument = mongoose.InferSchemaType<typeof TripSchema> & mongoose.Document;
export const Trip = model<TripDocument>("Trip", TripSchema);


