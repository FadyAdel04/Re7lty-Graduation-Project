import mongoose, { Schema, model } from "mongoose";

const BookingSchema = new Schema({
    tripId: { type: Schema.Types.ObjectId, ref: 'CorporateTrip', required: true },
    userId: { type: String, required: true }, // Clerk ID
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },
    passengers: [{
        name: { type: String, required: true },
        age: { type: Number },
        gender: { type: String, enum: ['male', 'female'] }
    }],
    totalPrice: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'cancelled', 'completed'], 
        default: 'pending' 
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'partially_paid', 'paid'],
        default: 'unpaid'
    },
    bookingDate: { type: Date, default: Date.now },
    notes: { type: String }
}, { timestamps: true });

export type BookingDocument = mongoose.InferSchemaType<typeof BookingSchema> & mongoose.Document;
export const Booking = model<BookingDocument>('Booking', BookingSchema);
