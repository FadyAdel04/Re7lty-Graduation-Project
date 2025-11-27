import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api";

const API_BASE = import.meta.env.VITE_API_URL || "";

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
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);

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
    return () => {
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
      }
    };
  }, [refreshNotifications]);

  useEffect(() => {
    if (!isSignedIn) return;
    let abortController = new AbortController();
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    let isCancelled = false;

    const connect = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${API_BASE}/api/notifications/stream`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
          signal: abortController.signal,
          credentials: "include",
        });
        if (!response.ok || !response.body) {
          throw new Error("Failed to connect to notification stream");
        }

        setIsStreaming(true);
        reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (!isCancelled) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let boundary = buffer.indexOf("\n\n");
          while (boundary !== -1) {
            const chunk = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            processChunk(chunk);
            boundary = buffer.indexOf("\n\n");
          }
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Notification stream error:", error);
          setIsStreaming(false);
          reconnectRef.current = setTimeout(() => {
            connect();
          }, 5000);
        }
      }
    };

    const processChunk = (chunk: string) => {
      const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
      let eventType = "message";
      let dataPayload = "";
      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataPayload += line.slice(5).trim();
        }
      }
      if (eventType === "notification" && dataPayload) {
        try {
          const parsed = JSON.parse(dataPayload);
          setNotifications((prev) => {
            const next = [parsed, ...prev].slice(0, 50);
            syncUnreadCount(next);
            return next;
          });
        } catch (error) {
          console.error("Failed to parse notification payload:", error);
        }
      }
    };

    connect();

    return () => {
      isCancelled = true;
      abortController.abort();
      reader?.cancel().catch(() => {});
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
      }
      setIsStreaming(false);
    };
  }, [getToken, isSignedIn, user?.id, syncUnreadCount]);

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


