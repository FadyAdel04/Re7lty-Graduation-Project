import { TripChatGroup, TripChatMessage } from "../models/TripChat";
import { CorporateTrip } from "../models/CorporateTrip";
import { CorporateCompany } from "../models/CorporateCompany";
import { Notification } from "../models/Notification";
import { getPusher } from "../services/pusher";
import { User } from "../models/User";

export async function ensureTripGroupExists(tripId: string, forcedParticipantId?: string) {
    try {
        const trip = await CorporateTrip.findById(tripId);
        if (!trip) {
            console.error(`[TripChat] Trip ${tripId} not found`);
            return null;
        }

        const company = await CorporateCompany.findById(trip.companyId);
        if (!company) {
            console.error(`[TripChat] Company ${trip.companyId} not found for trip ${trip._id}`);
            return null;
        }

        const groupName = trip.title;

        let group = await TripChatGroup.findOne({ tripId: trip._id });
        let updated = false;

        if (!group) {
            console.log(`[TripChat] Creating new trip group for: ${trip.title}`);
            group = await TripChatGroup.create({
                name: groupName,
                tripId: trip._id,
                companyId: company._id,
                participants: company.ownerId ? [company.ownerId] : [],
                tripImage: trip.images && trip.images.length > 0 ? trip.images[0] : undefined
            });
            updated = true;
        }

        if (group.name !== groupName) {
            group.name = groupName;
            updated = true;
        }

        if (trip.images && trip.images.length > 0 && group.tripImage !== trip.images[0]) {
            group.tripImage = trip.images[0];
            updated = true;
        }

        if (company.ownerId && !group.participants.includes(company.ownerId)) {
            console.log(`[TripChat] Adding owner ${company.ownerId} to group ${group._id}`);
            group.participants.push(company.ownerId);
            updated = true;
        }

        if (forcedParticipantId && !group.participants.includes(forcedParticipantId)) {
            group.participants.push(forcedParticipantId);
            updated = true;
        }

        if (updated) {
            await group.save();
        }
        return group;
    } catch (error) {
        console.error("Error in ensureTripGroupExists:", error);
        return null;
    }
}

export async function handleBookingAccepted(tripId: string, userId: string) {
    try {
        const group = await ensureTripGroupExists(tripId);
        if (!group) return;

        // 2. Add user if not already in participants
        if (!group.participants.includes(userId)) {
            group.participants.push(userId);
            await group.save();

            // Fetch user name
            const user = await User.findOne({ clerkId: userId });
            const userName = user?.fullName || 'عضو جديد';

            // 3. Create system message
            const systemMsg = await TripChatMessage.create({
                conversationId: group._id,
                senderId: 'system',
                content: `انضم ${userName} إلى المجموعة.`,
                type: 'system'
            });

            // 4. Trigger Pusher
            const pusher = getPusher();
            if (pusher) {
                pusher.trigger(`trip-group-${group._id}`, 'new-message', {
                    message: systemMsg
                });
                pusher.trigger(`user-updates-${userId}`, 'added-to-group', {
                    groupId: group._id,
                    groupName: group.name
                });
            }

            // 5. Send notification
            await Notification.create({
                recipientId: userId,
                actorId: 'system',
                actorName: 'النظام',
                type: 'system',
                message: `لقد تمت إضافتك إلى مجموعة الرحلة: ${group.name}`,
                metadata: { groupId: group._id, type: 'trip_group' }
            });
        }
    } catch (error) {
        console.error("Error in handleBookingAccepted:", error);
    }
}

export async function handleBookingCancelled(tripId: string, userId: string) {
    try {
        const group = await TripChatGroup.findOne({ tripId });
        if (!group) return;

        if (group.participants.includes(userId)) {
            group.participants = group.participants.filter(id => id !== userId);
            await group.save();

            // Fetch user name
            const user = await User.findOne({ clerkId: userId });
            const userName = user?.fullName || 'أحد المشاركين';

            // Notify group
            const systemMsg = await TripChatMessage.create({
                conversationId: group._id,
                senderId: 'system',
                content: `غادر ${userName} المجموعة.`,
                type: 'system'
            });

            const pusher = getPusher();
            if (pusher) {
                pusher.trigger(`trip-group-${group._id}`, 'new-message', {
                    message: systemMsg
                });
            }
        }
    } catch (error) {
        console.error("Error in handleBookingCancelled:", error);
    }
}
