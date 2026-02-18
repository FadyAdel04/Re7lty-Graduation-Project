import { Notification, NotificationDocument } from "../models/Notification";
import { getPusher } from "../services/pusher";

export function formatNotificationPayload(notification: NotificationDocument) {
  const plain = typeof notification.toObject === "function"
    ? notification.toObject()
    : notification;
  return {
    id: String(plain._id),
    recipientId: plain.recipientId,
    actorId: plain.actorId,
    actorName: plain.actorName,
    actorImage: plain.actorImage,
    type: plain.type,
    message: plain.message,
    tripId: plain.tripId ? String(plain.tripId) : undefined,
    commentId: plain.commentId ? String(plain.commentId) : undefined,
    metadata: plain.metadata,
    isRead: plain.isRead,
    createdAt: plain.createdAt,
  };
}

type NotificationInput = {
  recipientId?: string | null;
  actorId: string;
  actorName: string;
  actorImage?: string | null;
  type: "love" | "save" | "comment" | "follow" | "system" | "tag" | "message";
  message: string;
  tripId?: any;
  commentId?: any;
  metadata?: Record<string, any>;
  isRead?: boolean;
  link?: string;
};

export async function createNotification(input: NotificationInput) {
  const {
    recipientId,
    actorId,
    actorName,
    actorImage,
    type,
    message,
    tripId,
    commentId,
    metadata,
    isRead,
    link,
  } = input;

  if (!recipientId) return null;
  if (recipientId === actorId) return null;

  const notification = await Notification.create({
    recipientId,
    actorId,
    actorName,
    actorImage,
    type,
    message,
    tripId,
    commentId,
    metadata,
    isRead,
    link,
  });

  const pusher = getPusher();
  if (pusher) {
    const payload = formatNotificationPayload(notification);
    try {
      await pusher.trigger(`user-${recipientId}`, "notification", payload);
    } catch (error) {
      console.error("Failed to dispatch Pusher notification:", error);
    }
  }

  return notification;
}

