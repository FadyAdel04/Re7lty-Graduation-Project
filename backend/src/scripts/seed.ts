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

const dbUri = process.env.MONGODB_URI || "mongodb+srv://wocode:Fa5251596%40@re7lty.xwg0o7y.mongodb.net/re7lty?retryWrites=true&w=majority&appName=Re7lty";

console.log(`Connecting to MongoDB...`);

const seedData = async () => {
    try {
        await mongoose.connect(dbUri);
        console.log("Connected successfully to DB!");

        console.log("Clearing existing collections...");
        await User.deleteMany({});
        await CorporateCompany.deleteMany({});
        await Trip.deleteMany({});
        await CorporateTrip.deleteMany({});
        await Booking.deleteMany({});
        await Conversation.deleteMany({});
        await Message.deleteMany({});
        await Profile.deleteMany({});
        
        // Clear all new tables
        await AIPlanUsage.deleteMany({});
        await CompanySubmission.deleteMany({});
        await Complaint.deleteMany({});
        await ContentReport.deleteMany({});
        await Coupon.deleteMany({});
        await DirectConversation.deleteMany({});
        await DirectMessage.deleteMany({});
        await Follow.deleteMany({});
        await Leaderboard.deleteMany({});
        await Memory.deleteMany({});
        await Notification.deleteMany({});
        await Story.deleteMany({});
        await TripChatGroup.deleteMany({});
        await TripChatMessage.deleteMany({});
        await TripLove.deleteMany({});
        await TripSave.deleteMany({});

        console.log("Inserting Sample Data into All Tables...");

        // 1. Create a Test User and Company Owner
        const testUser = await User.create({
            clerkId: "user_test_clerk_123",
            email: "test@re7lty.com",
            username: "testuser",
            fullName: "Test User",
            role: "user",
            isOnboarded: true,
        });

        const testCompanyOwner = await User.create({
            clerkId: "comp_test_clerk_456",
            email: "company@re7lty.com",
            username: "re7lty_company",
            fullName: "Re7lty Travel Co.",
            role: "company_owner",
            profileType: "company",
            isOnboarded: true,
        });

        // 2. Profiles
        await Profile.create({ userId: testUser.clerkId, username: testUser.username, fullName: testUser.fullName });
        await Profile.create({ userId: testCompanyOwner.clerkId, username: testCompanyOwner.username, fullName: testCompanyOwner.fullName });

        // 3. Follow Relationship
        await Follow.create({ followerId: testUser.clerkId, followingId: testCompanyOwner.clerkId });

        // 4. Corporate Company & Trips
        const testCompany = await CorporateCompany.create({
            name: "Re7lty Awesome Travel",
            logo: "https://via.placeholder.com/150",
            rating: 5,
            description: "The best travel company in Egypt.",
            contactInfo: { phone: "01000000000", whatsapp: "01000000000", email: "contact@re7ltyawesome.com" },
            color: "bg-blue-500",
            ownerId: testCompanyOwner.clerkId,
            isActive: true,
        });

        const corporateTrip = await CorporateTrip.create({
            slug: "awesome-dahab-trip-2026",
            title: "Summer Vacation in Dahab",
            destination: "Dahab",
            duration: "4 Days",
            price: "5000",
            shortDescription: "Amazing trip to Dahab.",
            fullDescription: "Incredibly amazing trip.",
            meetingLocation: "Tahrir Square",
            bookingMethod: { whatsapp: true, phone: true, website: true },
            companyId: testCompany._id,
        });

        // 5. Normal Trip
        const userTrip = await Trip.create({
            title: "Amazing Day in Cairo",
            destination: "Cairo",
            duration: "1 day",
            author: testUser.username,
            ownerId: testUser.clerkId,
            description: "Saw the pyramids.",
            postType: "detailed",
        });

        // 6. User Analytics & Reactions
        await TripLove.create({ userId: testUser.clerkId, tripId: userTrip._id });
        await TripSave.create({ userId: testUser.clerkId, tripId: userTrip._id });
        await AIPlanUsage.create({ userId: testUser.clerkId });
        await Memory.create({
            userId: testUser.clerkId,
            monthLabel: "March 2026",
            items: [{ url: "img.jpg", tripTitle: "Awesome Trip", destination: "Cairo", date: new Date() }]
        });

        // 7. Booking & Coupons
        const testCoupon = await Coupon.create({
            code: "SUMMER10",
            discountValue: 10,
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            companyId: testCompany._id
        });

        await Booking.create({
            userId: testUser.clerkId,
            userName: testUser.fullName,
            userEmail: testUser.email,
            userPhone: "010",
            tripId: corporateTrip._id,
            bookingReference: "REF-001",
            tripTitle: corporateTrip.title,
            tripDestination: corporateTrip.destination,
            tripPrice: corporateTrip.price,
            companyId: testCompany._id,
            companyName: testCompany.name,
            numberOfPeople: 1,
            bookingDate: new Date(),
            totalPrice: 4500,
            commissionAmount: 500,
            netAmount: 4000,
            couponId: testCoupon._id
        });

        // 8. Communication (Chat, Direct Chat, Trip Chat)
        // User <-> Company Chat
        const convo = await Conversation.create({ participants: [testUser.clerkId, String(testCompany._id)], userId: testUser.clerkId, companyId: testCompany._id });
        await Message.create({ conversationId: convo._id, senderId: testUser.clerkId, senderType: "user", content: "Hello", read: false });

        // User <-> Normal User Chat
        const directConvo = await DirectConversation.create({ participants: [testUser.clerkId, testCompanyOwner.clerkId] });
        await DirectMessage.create({ conversationId: directConvo._id, senderId: testUser.clerkId, content: "Hey from Direct Chat" });

        // Corporate Trip Chat Group
        const tripChatGroup = await TripChatGroup.create({ tripId: corporateTrip._id, companyId: testCompany._id, name: "Dahab Group", participants: [testUser.clerkId] });
        await TripChatMessage.create({ conversationId: tripChatGroup._id, senderId: testUser.clerkId, content: "Excited for Dahab!" });

        // 9. Other Features (Complaints, Submissions, Leaderboards, Stories, Notifications)
        await CompanySubmission.create({ userId: testUser.clerkId, companyName: "New Travels", email: "x@x.com", phone: "010", whatsapp: "010", tripTypes: "Safari" });
        await Complaint.create({ userId: testUser.clerkId, name: "Test User", email: "test@re7lty.com", message: "My test complaint", status: "pending" });
        await ContentReport.create({ tripId: userTrip._id, reportedBy: testCompanyOwner.clerkId, reason: "spam", status: "pending" });
        
        await Leaderboard.create({
            weekNumber: 1, year: 2026, startDate: new Date(), endDate: new Date(),
            winners: [{ tripId: userTrip._id, rank: 1, score: 100, winnerName: "Test User" }]
        });

        await Story.create({ userId: testUser.clerkId, mediaUrl: "video.mp4", mediaType: "video", expiresAt: new Date() });
        
        await Notification.create({
            recipientId: testCompanyOwner.clerkId,
            actorId: testUser.clerkId,
            type: "follow",
            message: "Test User followed you!"
        });

        console.log("✅ All 22 Tables Seeded and Connected successfully.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error seeding database:", err);
        process.exit(1);
    }
};

seedData();
