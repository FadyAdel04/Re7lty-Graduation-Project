import mongoose, { Schema, model } from "mongoose";

const BookingSchema = new Schema({
    bookingReference: { type: String, unique: true },
    tripId: { type: Schema.Types.ObjectId, ref: 'CorporateTrip', required: true },
    tripTitle: { type: String },
    tripDestination: { type: String },
    tripPrice: { type: String },
    companyId: { type: Schema.Types.ObjectId, ref: 'CorporateCompany' },
    companyName: { type: String },
    userId: { type: String, required: true }, // Clerk ID
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },
    userEmail: { type: String },
    numberOfPeople: { type: Number },
    passengers: [{
        name: { type: String, required: true },
        age: { type: Number },
        gender: { type: String, enum: ['male', 'female'] }
    }],
    totalPrice: { type: Number, required: true },
    commissionAmount: { type: Number },
    netAmount: { type: Number },
    status: { 
        type: String, 
        enum: ['pending', 'accepted', 'rejected', 'confirmed', 'cancelled', 'completed'], 
        default: 'pending' 
    },
    statusUpdatedAt: { type: Date },
    cancellationReason: { type: String },
    rejectionReason: { type: String },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'pending', 'partially_paid', 'paid', 'refunded'],
        default: 'unpaid'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'bank_transfer', 'other']
    },
    selectedSeats: [{ type: String }],
    transportationType: { type: String },
    seatNumber: { type: String },
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    discountApplied: { type: Number },
    bookingDate: { type: Date, default: Date.now },
    specialRequests: { type: String },
    notes: { type: String }
}, { timestamps: true });

export type BookingDocument = mongoose.InferSchemaType<typeof BookingSchema> & mongoose.Document;
export const Booking = model<BookingDocument>('Booking', BookingSchema);
