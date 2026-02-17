import mongoose, { Schema, model } from "mongoose";

const CouponSchema = new Schema({
    code: { type: String, required: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    discountValue: { type: Number, required: true },
    expiryDate: { type: Date, required: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'CorporateCompany', required: true },
    isActive: { type: Boolean, default: true },
    usageLimit: { type: Number }, // Total times it can be used
    usageCount: { type: Number, default: 0 },
    applicableTrips: [{ type: Schema.Types.ObjectId, ref: 'CorporateTrip' }], // If empty, applies to all company trips
}, { timestamps: true });

// Ensure code is unique per company
CouponSchema.index({ code: 1, companyId: 1 }, { unique: true });

export type CouponDocument = mongoose.InferSchemaType<typeof CouponSchema> & mongoose.Document;
export const Coupon = model<CouponDocument>('Coupon', CouponSchema);
