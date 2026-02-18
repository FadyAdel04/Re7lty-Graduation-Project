import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api";
import { toast } from "sonner";
import { createPusherClient } from "@/lib/pusher-client";
import type Pusher from "pusher-js";
import { Bell, X, ShieldCheck, MessageSquare } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import notificationSound from "@/assets/notifications.mp3";

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'eu';

export type NotificationItem = {
  id: string;
  recipientId: string;
  actorId: string;
  actorName: string;
  actorImage?: string;
  type: "love" | "save" | "comment" | "follow" | "message";
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
  setActiveConvId: (id: string | null) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

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

      // Check for unread system warnings on initial load/refresh
      // We only want to show the latest one to avoid spamming
      const latestWarning = items.find(n => n.type === 'system' && !n.isRead);
      if (latestWarning) {
         // We use a small timeout to let the UI settle or to avoid conflict with other initial toasts
         setTimeout(() => {
            toast.custom((t) => (
              <div className="bg-white/90 backdrop-blur-xl border border-red-100 rounded-[1.5rem] p-4 shadow-2xl flex items-start gap-4 animate-in slide-in-from-bottom-5 duration-500 max-w-sm w-full" dir="rtl">
                 <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-100 shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                 </div>
                 <div className="flex-1 pt-1">
                    <h4 className="font-black text-gray-900 text-sm mb-1">تنبيه النظام</h4>
                    <p className="text-xs font-bold text-gray-500 leading-relaxed">{latestWarning.message}</p>
                 </div>
                 <button onClick={() => toast.dismiss(t)} className="text-gray-300 hover:text-gray-500 transition-colors">
                    <X className="w-4 h-4" />
                 </button>
              </div>
            ), {
              duration: 6000, // Slightly longer for warnings
              position: 'bottom-right'
            });
         }, 1000);
      }

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
    const directChannelName = `user-direct-chats-${user.id}`;
    
    console.log("Subscribing to channels:", { channelName, directChannelName });
    
    const channel = client.channel(channelName) || client.subscribe(channelName);
    const directChannel = client.channel(directChannelName) || client.subscribe(directChannelName);

    // Simple notification sound
    const playNotificationSound = () => {
      try {
        const audio = new Audio(notificationSound);
        audio.play().catch(e => console.error("Error playing sound:", e));
      } catch (error) {
        console.error("Audio error:", error);
      }
    };

    const showNotificationToast = (payload: NotificationItem) => {
      // Play sound only for real-time (optional, but good for context) - maybe passed as arg?
      // actually, just keeping the sound separate or included is fine. The user asked for "toast message".
      
      toast.custom((t) => (
        <div className="bg-white/90 backdrop-blur-xl border border-indigo-100 rounded-[1.5rem] p-4 shadow-2xl flex items-start gap-4 animate-in slide-in-from-bottom-5 duration-500 max-w-sm w-full" dir="rtl">
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
        position: 'bottom-right'
      });
    };

    const handler = (payload: NotificationItem) => {
      console.log("Received notification payload:", payload);
      playNotificationSound();
      showNotificationToast(payload);
      
      setNotifications((prev) => {
        if (prev.some(n => n.id === payload.id)) return prev;
        const next = [payload, ...prev].slice(0, 50);
        syncUnreadCount(next);
        return next;
      });
    };

    channel.bind("notification", handler);

    const directMsgHandler = (data: any) => {
        // Skip if sender is me
        if (data.senderId === user.id) return;

        // Skip sound/toast ONLY if we are already in this specific conversation
        if (location.pathname === '/messages' && activeConvId === data.conversation._id) return;

        playNotificationSound();
        
        const newNotif: NotificationItem = {
          id: data.message._id,
          recipientId: user.id,
          actorId: data.senderId,
          actorName: data.conversation.otherParticipant?.fullName || 'مستخدم',
          actorImage: data.conversation.otherParticipant?.imageUrl,
          type: "message",
          message: data.conversation.lastMessage || 'أرسل رسالة جديدة',
          createdAt: new Date().toISOString(),
          isRead: false,
          metadata: { conversationId: data.conversation._id }
        };

        setNotifications((prev) => {
          if (prev.some(n => n.id === newNotif.id)) return prev;
          const next = [newNotif, ...prev].slice(0, 50);
          syncUnreadCount(next);
          return next;
        });

        toast.custom((t) => (
          <div 
            onClick={() => {
                navigate(`/messages?conv=${data.conversation._id}`);
                toast.dismiss(t);
            }}
            className="bg-white/95 backdrop-blur-xl border border-orange-100 rounded-[1.5rem] p-4 shadow-2xl flex items-start gap-4 animate-in slide-in-from-bottom-5 duration-500 max-w-sm w-full cursor-pointer hover:bg-orange-50/50 transition-all" 
            dir="rtl"
          >
             <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-100 shrink-0">
                <MessageSquare className="w-6 h-6" />
             </div>
             <div className="flex-1 pt-1">
                <h4 className="font-black text-gray-900 text-sm mb-1">رسالة جديدة</h4>
                <p className="text-[10px] font-black text-orange-400 mb-1 leading-none">
                    {data.conversation.otherParticipant?.fullName || 'مستخدم'}
                </p>
                <p className="text-xs font-bold text-gray-500 leading-relaxed truncate">{data.conversation.lastMessage}</p>
             </div>
             <button onClick={(e) => { e.stopPropagation(); toast.dismiss(t); }} className="text-gray-300 hover:text-gray-500 transition-colors">
                <X className="w-4 h-4" />
             </button>
          </div>
        ), {
          duration: 5000,
          position: 'bottom-right'
        });
    };

    directChannel.bind("update-conversation", directMsgHandler);

    // Set initial streaming state based on current connection
    setIsStreaming(client.connection.state === "connected");

    return () => {
      channel.unbind("notification", handler);
      directChannel.unbind("update-conversation", directMsgHandler);
      
      if (client.channel(channelName)) {
         client.unsubscribe(channelName);
      }
      if (client.channel(directChannelName)) {
         client.unsubscribe(directChannelName);
      }
    };
  }, [isSignedIn, user?.id, syncUnreadCount, location.pathname, navigate]);

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
        setActiveConvId,
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
