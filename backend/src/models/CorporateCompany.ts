import mongoose, { Schema, model } from "mongoose";

const ContactInfoSchema = new Schema({
    phone: { type: String, required: true },
    whatsapp: { type: String, required: true },
    email: { type: String, required: true },
    website: { type: String },
    address: { type: String }
}, { _id: false });

const CorporateCompanySchema = new Schema({
    name: { type: String, required: true },
    logo: { type: String, required: true }, // URL to logo image
    rating: { type: Number, required: true, min: 0, max: 5, default: 4.5 },
    description: { type: String, required: true },
    contactInfo: { type: ContactInfoSchema, required: true },
    tags: [{ type: String }], // e.g., ["سفاري", "مغامرات", "تخييم"]
    color: { type: String, required: true }, // Tailwind gradient classes
    tripsCount: { type: Number, default: 0 }, // Auto-calculated
    isActive: { type: Boolean, default: true },
    createdBy: { type: String }, // Clerk ID of admin who created
}, { timestamps: true });

// Index for faster queries
CorporateCompanySchema.index({ isActive: 1, rating: -1 });
CorporateCompanySchema.index({ name: 'text', description: 'text' });

export type CorporateCompanyDocument = mongoose.InferSchemaType<typeof CorporateCompanySchema> & mongoose.Document;
export const CorporateCompany = model<CorporateCompanyDocument>('CorporateCompany', CorporateCompanySchema);
