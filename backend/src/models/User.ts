import mongoose, { Schema, model } from "mongoose";

const UserSchema = new Schema({
  clerkId: { type: String, required: true, unique: true, index: true },
  email: String,
  username: String,
  fullName: String,
  imageUrl: String, // Profile picture
  bio: String, // User bio/description
  location: String, // User location (city, country)
  coverImage: String, // Background/cover image URL
  trips: [{ type: Schema.Types.ObjectId, ref: "Trip" }],
  // Stats (can be calculated or stored)
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },
  totalLikes: { type: Number, default: 0 }, // Total likes on all trips
  // Gamification / badge system
  activityScore: { type: Number, default: 0 }, // Derived score from trips + activity
  badgeLevel: {
    type: String,
    enum: ["none", "bronze", "silver", "gold", "diamond", "legend"],
    default: "none",
  },
  // Onboarding & Role
  role: {
    type: String,
    enum: ["user", "admin", "company_pending", "company_approved", "company_rejected", "company_owner"],
    default: "user"
  },
  profileType: {
    type: String,
    enum: ["user", "company"],
    default: "user"
  },
  lastRoleSwitchAt: { type: Date },
  isOnboarded: { type: Boolean, default: false },
  companyId: { type: Schema.Types.ObjectId, ref: "CorporateCompany" }, // Linked company profile

  // Subscription
  subscription: {
    plan: { type: String, enum: ["free_trial", "basic", "premium", "enterprise"], default: "free_trial" },
    status: { type: String, enum: ["active", "expired", "cancelled"], default: "active" },
    startDate: { type: Date },
    endDate: { type: Date }
  }
}, { timestamps: true });

export type UserDocument = mongoose.InferSchemaType<typeof UserSchema> & mongoose.Document;
export const User = model<UserDocument>('User', UserSchema);


