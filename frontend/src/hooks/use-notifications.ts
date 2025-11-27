import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api";
import { createPusherClient } from "@/lib/pusher-client";
import type Pusher from "pusher-js";

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER;

export type NotificationItem = {
  id: string;
  recipientId: string;
  actorId: string;
  actorName: string;
  actorImage?: string;
  type: "love" | "save" | "comment" | "follow";
  message: string;
  tripId?: string;
  commentId?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
};

export function useNotifications() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const pusherRef = useRef<Pusher | null>(null);

  const syncUnreadCount = useCallback((items: NotificationItem[]) => {
    const count = items.filter((item) => !item.isRead).length;
    setUnreadCount(count);
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!isSignedIn) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const token = await getToken();
      const items = await getNotifications(30, token || undefined);
      setNotifications(items);
      syncUnreadCount(items);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  }, [getToken, isSignedIn, syncUnreadCount]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    if (!isSignedIn || !user?.id) {
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
      setIsStreaming(false);
      return;
    }

    if (!PUSHER_KEY || !PUSHER_CLUSTER) {
      setIsStreaming(false);
      return;
    }

    if (!pusherRef.current) {
      pusherRef.current = createPusherClient(PUSHER_KEY, PUSHER_CLUSTER);
    }

    const client = pusherRef.current;
    if (!client) {
      setIsStreaming(false);
      return;
    }

    const channelName = `user-${user.id}`;
    const channel = client.channel(channelName) || client.subscribe(channelName);

    const handler = (payload: NotificationItem) => {
      setNotifications((prev) => {
        const next = [payload, ...prev].slice(0, 50);
        syncUnreadCount(next);
        return next;
      });
    };

    channel.bind("notification", handler);
    setIsStreaming(true);

    return () => {
      channel.unbind("notification", handler);
      if (client.channel(channelName)) {
        client.unsubscribe(channelName);
      }
      // Only disconnect if no other channels are subscribed
      if (!Object.keys((client as any).channels.channels || {}).length) {
        client.disconnect();
        pusherRef.current = null;
        setIsStreaming(false);
      }
    };
  }, [isSignedIn, user?.id, syncUnreadCount]);

  const markAsRead = useCallback(
    async (id: string) => {
      if (!isSignedIn) return;
      try {
        const token = await getToken();
        await markNotificationRead(id, token || undefined);
        setNotifications((prev) => {
          const next = prev.map((item) =>
            item.id === id ? { ...item, isRead: true } : item
          );
          syncUnreadCount(next);
          return next;
        });
      } catch (error) {
        console.error("Failed to mark notification read:", error);
      }
    },
    [getToken, isSignedIn, syncUnreadCount]
  );

  const markAllAsRead = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      await markAllNotificationsRead(token || undefined);
      setNotifications((prev) => {
        const next = prev.map((item) => ({ ...item, isRead: true }));
        syncUnreadCount(next);
        return next;
      });
    } catch (error) {
      console.error("Failed to mark notifications read:", error);
    }
  }, [getToken, isSignedIn, syncUnreadCount]);

  return {
    notifications,
    unreadCount,
    isStreaming,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  };
}


