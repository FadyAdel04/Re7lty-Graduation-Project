import mongoose, { Schema, model } from "mongoose";

const ItineraryDaySchema = new Schema({
    day: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    activities: [{ type: String }]
}, { _id: false });

const BookingMethodSchema = new Schema({
    whatsapp: { type: Boolean, default: true },
    phone: { type: Boolean, default: true },
    website: { type: Boolean, default: false }
}, { _id: false });

const CorporateTripSchema = new Schema({
    slug: { type: String, required: true, unique: true, index: true }, // URL-friendly ID
    title: { type: String, required: true },
    destination: { type: String, required: true },
    duration: { type: String, required: true }, // e.g., "3 أيام"
    price: { type: String, required: true }, // Stored as string for flexibility
    rating: { type: Number, required: true, min: 0, max: 5, default: 4.5 },
    images: [{ type: String }], // Array of image URLs
    shortDescription: { type: String, required: true },
    fullDescription: { type: String, required: true },
    itinerary: [ItineraryDaySchema],
    includedServices: [{ type: String }],
    excludedServices: [{ type: String }],
    meetingLocation: { type: String, required: true },
    bookingMethod: { type: BookingMethodSchema, required: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'CorporateCompany', required: true },
    likes: { type: Number, default: 0 },
    maxGroupSize: { type: Number },
    difficulty: {
        type: String,
        enum: ['سهل', 'متوسط', 'صعب']
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String }, // Clerk ID of admin who created
}, { timestamps: true });

// Indexes for faster queries
CorporateTripSchema.index({ companyId: 1, isActive: 1 });
CorporateTripSchema.index({ destination: 1, isActive: 1 });
CorporateTripSchema.index({ rating: -1 });
CorporateTripSchema.index({ title: 'text', shortDescription: 'text', destination: 'text' });

export type CorporateTripDocument = mongoose.InferSchemaType<typeof CorporateTripSchema> & mongoose.Document;
export const CorporateTrip = model<CorporateTripDocument>('CorporateTrip', CorporateTripSchema);
