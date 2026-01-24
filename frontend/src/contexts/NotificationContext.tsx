import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api";
import { toast } from "sonner";
import { createPusherClient } from "@/lib/pusher-client";
import type Pusher from "pusher-js";
import { Bell, X } from "lucide-react";
import notificationSound from "@/assets/notifications.mp3";

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

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isStreaming: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
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
        // Use token if available, but don't force it to allow public access logic if ever needed,
        // though for notifications auth is usually required.
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
      console.warn("Pusher credentials missing:", { key: !!PUSHER_KEY, cluster: !!PUSHER_CLUSTER });
      setIsStreaming(false);
      return;
    }

    console.log("Initializing Pusher with key:", PUSHER_KEY);

    if (!pusherRef.current) {
      pusherRef.current = createPusherClient(PUSHER_KEY, PUSHER_CLUSTER);
    }

    const client = pusherRef.current;
    if (!client) {
      console.error("Failed to create Pusher client");
      setIsStreaming(false);
      return;
    }

    // Monitor connection state
    client.connection.bind("connected", () => {
      console.log("Pusher connected successfully");
      setIsStreaming(true);
    });
    
    client.connection.bind("failed", () => {
      console.error("Pusher connection failed");
      setIsStreaming(false);
    });

    client.connection.bind("disconnected", () => {
      console.log("Pusher disconnected");
      setIsStreaming(false);
    });

    const channelName = `user-${user.id}`;
    console.log("Subscribing to channel:", channelName);
    const channel = client.channel(channelName) || client.subscribe(channelName);

    // Simple notification sound
    const playNotificationSound = () => {
      try {
        const audio = new Audio(notificationSound);
        audio.play().catch(e => console.error("Error playing sound:", e));
      } catch (error) {
        console.error("Audio error:", error);
      }
    };

    const handler = (payload: NotificationItem) => {
      console.log("Received notification payload:", payload);
      playNotificationSound();
      
      toast.custom((t) => (
        <div className="bg-white/90 backdrop-blur-xl border border-indigo-100 rounded-[1.5rem] p-4 shadow-2xl flex items-start gap-4 animate-in slide-in-from-bottom-5 duration-500 max-w-sm w-full">
           <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 shrink-0">
              <Bell className="w-6 h-6" />
           </div>
           <div className="flex-1 pt-1">
              <h4 className="font-black text-gray-900 text-sm mb-1">إشعار جديد</h4>
              <p className="text-xs font-bold text-gray-500 leading-relaxed">{payload.message}</p>
           </div>
           <button onClick={() => toast.dismiss(t)} className="text-gray-300 hover:text-gray-500 transition-colors">
              <X className="w-4 h-4" />
           </button>
        </div>
      ), {
        duration: 5000,
        position: 'bottom-left'
      });
      
      setNotifications((prev) => {
        if (prev.some(n => n.id === payload.id)) return prev;
        const next = [payload, ...prev].slice(0, 50);
        syncUnreadCount(next);
        return next;
      });
    };

    channel.bind("notification", handler);
    // Set initial streaming state based on current connection
    setIsStreaming(client.connection.state === "connected");

    return () => {
      channel.unbind("notification", handler);
      // We don't unsubscribe here to keep the connection alive while the user is logged in
      // globally, but if the user changes or logs out, the first check in this effect handles disconnect.
      if (client.channel(channelName)) {
         client.unsubscribe(channelName);
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

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isStreaming,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return context;
}
