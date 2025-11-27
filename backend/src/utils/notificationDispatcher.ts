import { Response } from "express";
import { Notification, NotificationDocument } from "../models/Notification";

type Subscriber = {
  res: Response;
};

const subscribers = new Map<string, Set<Subscriber>>();

function sendEvent(res: Response, event: string, data: any) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function registerNotificationStream(userId: string, res: Response) {
  const subscriber: Subscriber = { res };
  if (!subscribers.has(userId)) {
    subscribers.set(userId, new Set());
  }
  subscribers.get(userId)!.add(subscriber);

  res.on("close", () => {
    subscribers.get(userId)?.delete(subscriber);
    if (subscribers.get(userId)?.size === 0) {
      subscribers.delete(userId);
    }
  });
}

export function dispatchNotification(notification: NotificationDocument) {
  const payload = formatNotificationPayload(notification);
  const targets = subscribers.get(notification.recipientId);
  if (!targets) return;
  for (const subscriber of targets) {
    sendEvent(subscriber.res, "notification", payload);
  }
}

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
  type: "love" | "save" | "comment" | "follow";
  message: string;
  tripId?: any;
  commentId?: any;
  metadata?: Record<string, any>;
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
  });

  dispatchNotification(notification);
  return notification;
}


