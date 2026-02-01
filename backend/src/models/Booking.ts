import mongoose, { Schema, model } from "mongoose";

const BookingSchema = new Schema(
    {
        userId: { type: String, required: true, index: true }, // Clerk ID of the user making the booking
        userName: { type: String, required: true },
        userEmail: { type: String, required: true },
        userPhone: { type: String, required: true },

        tripId: { type: Schema.Types.ObjectId, ref: "CorporateTrip", required: true, index: true },
        bookingReference: { type: String, unique: true, required: true },
        tripTitle: { type: String, required: true },
        tripDestination: { type: String, required: true },
        tripPrice: { type: String, required: true },

        companyId: { type: Schema.Types.ObjectId, ref: "CorporateCompany", required: true, index: true },
        companyName: { type: String, required: true },

        numberOfPeople: { type: Number, required: true, min: 1 },
        bookingDate: { type: Date, required: true }, // Requested trip start date
        specialRequests: { type: String, default: "" },

        status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "cancelled"],
            default: "pending",
            index: true
        },

        statusUpdatedAt: { type: Date },
        rejectionReason: { type: String },

        totalPrice: { type: Number, required: true }, // Calculated: numberOfPeople * price
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "refunded", "partially_paid"],
            default: "pending"
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "card", "bank_transfer", "other"],
            default: "cash"
        },
        cancellationReason: { type: String },
    },
    { timestamps: true }
);

// Indexes for efficient querying
BookingSchema.index({ userId: 1, status: 1 });
BookingSchema.index({ companyId: 1, status: 1, createdAt: -1 });
BookingSchema.index({ tripId: 1, status: 1 });

export type BookingDocument = mongoose.InferSchemaType<typeof BookingSchema> & mongoose.Document;
export const Booking = model<BookingDocument>("Booking", BookingSchema);
