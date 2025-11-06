import mongoose, { Schema, model } from "mongoose";

const UserSchema = new Schema({
  clerkId: { type: String, required: true, unique: true, index: true },
  email: String,
  username: String,
  fullName: String,
  imageUrl: String,
  trips: [{ type: Schema.Types.ObjectId, ref: 'Trip' }],
}, { timestamps: true });

export type UserDocument = mongoose.InferSchemaType<typeof UserSchema> & mongoose.Document;
export const User = model<UserDocument>('User', UserSchema);


