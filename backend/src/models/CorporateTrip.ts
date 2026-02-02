import mongoose, { Schema, model } from "mongoose";

const ItineraryDaySchema = new Schema({
    day: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    activities: [{ type: String }]
}, { _id: false });

const SeatBookingSchema = new Schema({
    seatNumber: { type: String, required: true },
    passengerName: { type: String, required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    userId: { type: String }, // Add userId to track ownership
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
    season: {
        type: String,
        enum: ['winter', 'summer', 'fall', 'spring'],
        required: false // Optional for backward compatibility with existing trips
    },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
    transportationImages: [{ type: String }], // Array of transportation image URLs
    availableSeats: { type: Number, default: 0 },
    transportationType: { type: String, enum: ['bus-48', 'minibus-28', 'van-14'], default: 'bus-48' },
    seatBookings: [SeatBookingSchema],
    createdBy: { type: String }, // Clerk ID of admin who created
}, { timestamps: true });

// Indexes for faster queries
CorporateTripSchema.index({ companyId: 1, isActive: 1 });
CorporateTripSchema.index({ destination: 1, isActive: 1 });
CorporateTripSchema.index({ rating: -1 });
CorporateTripSchema.index({ title: 'text', shortDescription: 'text', destination: 'text' });

export type CorporateTripDocument = mongoose.InferSchemaType<typeof CorporateTripSchema> & mongoose.Document;
export const CorporateTrip = model<CorporateTripDocument>('CorporateTrip', CorporateTripSchema);
