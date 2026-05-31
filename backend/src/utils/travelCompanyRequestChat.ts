import mongoose from "mongoose";
import { Conversation, Message } from "../models/Chat";
import { CorporateCompany } from "../models/CorporateCompany";
import { User } from "../models/User";
import { createNotification } from "./notificationDispatcher";
import { getPusher } from "../services/pusher";

export interface TravelRequestPayload {
  companyId: string;
  companyName: string;
  destination: string;
  travelDates?: { checkIn?: string; checkOut?: string };
  numberOfTravelers?: number;
  budget?: string;
  tripDetails?: Record<string, unknown>;
  message?: string;
}

function formatBudgetLabel(budget?: string) {
  if (budget === "low") return "اقتصادية";
  if (budget === "high") return "فاخرة";
  return budget || "متوسطة";
}

export function buildTravelRequestMessage(payload: TravelRequestPayload) {
  const details = payload.tripDetails || {};
  const lines = [
    "📋 **طلب رحلة جديد من المسافر**",
    "",
    `🏢 الشركة: ${payload.companyName}`,
    `📍 الوجهة: ${payload.destination}`,
    `📅 المدة: ${details.days ?? "—"} أيام`,
    `💰 الميزانية: ${formatBudgetLabel(payload.budget)}`,
    `👥 عدد المسافرين: ${payload.numberOfTravelers || 1}`,
  ];

  if (payload.travelDates?.checkIn) {
    lines.push(`🗓️ تاريخ الوصول: ${payload.travelDates.checkIn}`);
  }
  if (payload.travelDates?.checkOut) {
    lines.push(`🗓️ تاريخ المغادرة: ${payload.travelDates.checkOut}`);
  }
  if (details.startCity) {
    lines.push(`🚩 مدينة الانطلاق: ${details.startCity}`);
  }
  if (details.attractionsCount != null) {
    lines.push(`🏛️ المعالم المختارة: ${details.attractionsCount}`);
  }
  if (details.restaurantsCount != null) {
    lines.push(`🍽️ المطاعم المختارة: ${details.restaurantsCount}`);
  }
  if (details.estimatedCost != null) {
    lines.push(`💎 التكلفة التقديرية: ${Number(details.estimatedCost).toLocaleString()} ج.م`);
  }
  if (details.hotelNeeded) {
    lines.push("🏨 الإقامة: مطلوبة");
  }

  lines.push("", payload.message || "هل يمكن لشركتكم إدارة هذه الرحلة وتقديم عرض سعر للمسافر؟");
  return lines.join("\n");
}

export async function ensureCompanyConversation(userId: string, companyId: string) {
  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    throw new Error("Invalid company ID");
  }

  let conversation = await Conversation.findOne({ userId, companyId });
  if (!conversation) {
    conversation = await Conversation.create({
      userId,
      companyId,
      participants: [userId, companyId],
      lastMessageAt: new Date(),
    });
  }
  return conversation;
}

export async function sendCompanyChatMessage(
  conversationId: mongoose.Types.ObjectId | string,
  userId: string,
  senderType: "user" | "company",
  content: string
) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new Error("Conversation not found");

  const message = await Message.create({
    conversationId,
    senderId: userId,
    senderType,
    content,
    readBy: [userId],
  });

  conversation.lastMessage = content.substring(0, 200);
  conversation.lastMessageAt = new Date();
  conversation.unreadCount = (conversation.unreadCount || 0) + 1;
  await conversation.save();

  const serializedMessage = message.toObject ? message.toObject() : message;

  const pusher = getPusher();
  if (pusher) {
    pusher.trigger(`conversation-${conversationId}`, "new-message", { message: serializedMessage });
    if (senderType === "user") {
      const company = await CorporateCompany.findById(conversation.companyId);
      if (company?.ownerId) {
        pusher.trigger(`user-chats-${company.ownerId}`, "update-conversation", {
          conversation: conversation.toObject(),
          message: serializedMessage,
        });
      }
    } else {
      pusher.trigger(`user-chats-${conversation.userId}`, "update-conversation", {
        conversation: conversation.toObject(),
        message: serializedMessage,
      });
    }
  }

  return { conversation, message: serializedMessage };
}

export async function notifyTravelRequest(
  userId: string,
  company: { _id: mongoose.Types.ObjectId; name: string; ownerId?: string },
  conversationId: mongoose.Types.ObjectId,
  destination: string
) {
  const senderUser = await User.findOne({ clerkId: userId }).select("fullName");
  const senderName = senderUser?.fullName || "مسافر";

  if (company.ownerId) {
    await createNotification({
      recipientId: company.ownerId,
      actorId: userId,
      actorName: senderName,
      type: "system",
      message: `طلب رحلة جديد إلى ${destination} من ${senderName}`,
      metadata: {
        conversationId,
        action: "travel_request",
        companyId: company._id.toString(),
      },
    });
  }

  await createNotification({
    recipientId: userId,
    actorId: company.ownerId || userId,
    actorName: company.name,
    type: "system",
    message: `تم إرسال طلب رحلتك إلى ${company.name}. يمكنك متابعة الرد في الرسائل.`,
    metadata: {
      conversationId,
      action: "travel_request_sent",
      companyId: company._id.toString(),
    },
  });
}

export async function createTravelRequestWithChat(userId: string, payload: TravelRequestPayload) {
  const company = await CorporateCompany.findById(payload.companyId);
  if (!company) throw new Error("Company not found");

  const conversation = await ensureCompanyConversation(userId, payload.companyId);
  const content = buildTravelRequestMessage(payload);
  const convId = conversation._id as mongoose.Types.ObjectId;
  const { message } = await sendCompanyChatMessage(convId, userId, "user", content);
  await notifyTravelRequest(userId, {
    _id: company._id as mongoose.Types.ObjectId,
    name: company.name,
    ownerId: company.ownerId ?? undefined,
  }, convId, payload.destination);

  return { conversation, message };
}
