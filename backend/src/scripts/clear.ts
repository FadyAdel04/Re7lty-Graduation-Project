import mongoose from "mongoose";
import dotenv from "dotenv";

// 22 Models to import
import { User } from "../models/User";
import { Trip } from "../models/Trip";
import { Booking } from "../models/Booking";
import { Conversation, Message } from "../models/Chat";
import { CorporateCompany } from "../models/CorporateCompany";
import { CorporateTrip } from "../models/CorporateTrip";
import { Profile } from "../models/Profile";
import { AIPlanUsage } from "../models/AIPlanUsage";
import { CompanySubmission } from "../models/CompanySubmission";
import Complaint from "../models/Complaint";
import ContentReport from "../models/ContentReport";
import { Coupon } from "../models/Coupon";
import { DirectConversation, DirectMessage } from "../models/DirectChat";
import { Follow } from "../models/Follow";
import { Leaderboard } from "../models/Leaderboard";
import Memory from "../models/Memory";
import { Notification } from "../models/Notification";
import { Story } from "../models/Story";
import { TripChatGroup, TripChatMessage } from "../models/TripChat";
import { TripLove } from "../models/TripLove";
import { TripSave } from "../models/TripSave";

dotenv.config();

const dbUri = process.env.MONGODB_URI;

if (!dbUri) {
    console.error("MONGODB_URI is not defined in .env");
    process.exit(1);
}

const clearData = async () => {
    try {
        console.log(`Connecting to MongoDB...`);
        await mongoose.connect(dbUri);
        console.log("Connected successfully to DB!");

        console.log("Emptying all collections...");
        
        const deletePromises = [
            User.deleteMany({}),
            CorporateCompany.deleteMany({}),
            Trip.deleteMany({}),
            CorporateTrip.deleteMany({}),
            Booking.deleteMany({}),
            Conversation.deleteMany({}),
            Message.deleteMany({}),
            Profile.deleteMany({}),
            AIPlanUsage.deleteMany({}),
            CompanySubmission.deleteMany({}),
            Complaint.deleteMany({}),
            ContentReport.deleteMany({}),
            Coupon.deleteMany({}),
            DirectConversation.deleteMany({}),
            DirectMessage.deleteMany({}),
            Follow.deleteMany({}),
            Leaderboard.deleteMany({}),
            Memory.deleteMany({}),
            Notification.deleteMany({}),
            Story.deleteMany({}),
            TripChatGroup.deleteMany({}),
            TripChatMessage.deleteMany({}),
            TripLove.deleteMany({}),
            TripSave.deleteMany({})
        ];

        await Promise.all(deletePromises);

        console.log("✅ All collections have been cleared successfully.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error clearing database:", err);
        process.exit(1);
    }
};

clearData();
