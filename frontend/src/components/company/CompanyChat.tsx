import { useState, useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { chatService, Message, Conversation } from "@/services/chatService";
import { createPusherClient } from "@/lib/pusher-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  MessageSquare, 
  Search, 
  Send, 
  User, 
  MessageCircle, 
  Clock, 
  CheckCheck, 
  RefreshCw,
  Pin,
  Lock,
  ShieldCheck,
  Calendar,
  Image as ImageIcon,
  Video,
  Mic,
  Paperclip,
  Smile,
  X,
  Plus,
  Play,
  Check,
  ArrowRight,
  FileText,
  ExternalLink
} from "lucide-react";
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { 
    getTripGroups, 
    getTripGroupMessages, 
    sendTripGroupMessage,
    getTripGroupParticipants,
    markTripGroupRead,
    toggleGroupMessageReaction
} from "@/lib/tripGroupApi";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { TripCountdown } from "@/components/TripCountdown";

interface CompanyChatProps {
    onUnreadChange?: (total: number) => void;
}

export const CompanyChat = ({ onUnreadChange }: CompanyChatProps) => {
    const { getToken } = useAuth();
    const { toast } = useToast();
    const { user: clerkUser } = useUser();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [isRefreshingConv, setIsRefreshingConv] = useState(false);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeSubTab, setActiveSubTab] = useState<'direct' | 'groups'>('direct');
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [groupMessages, setGroupMessages] = useState<any[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [participants, setParticipants] = useState<any[]>([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [attachment, setAttachment] = useState<{ file: File, type: 'image' | 'video' | 'voice' | 'text' | 'pdf', preview: string } | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch conversations
    useEffect(() => {
        const loadAll = async () => {
            await Promise.all([
                fetchConversations(),
                fetchGroups()
            ]);
        };
        loadAll();
    }, []);

    // Auto-switch to groups if direct is empty
    useEffect(() => {
        if (!loading && !loadingGroups && conversations.length === 0 && groups.length > 0 && activeSubTab === 'direct') {
            setActiveSubTab('groups');
        }
    }, [loading, loadingGroups, conversations.length, groups.length]);

    const fetchConversations = async (isManual = false) => {
        try {
            if (isManual) {
                setIsRefreshingConv(true);
                // If manual refresh, fetch the active tab specifically
                if (activeSubTab === 'direct') {
                    const token = await getToken();
                    const data = await chatService.getConversations(token || undefined, true);
                    setConversations(data);
                } else {
                    await fetchGroups();
                }
            } else {
                setLoading(true);
                const token = await getToken();
                const data = await chatService.getConversations(token || undefined, true);
                setConversations(data);
            }
        } catch (error) {
            console.error("Error fetching conversations:", error);
        } finally {
            setLoading(false);
            setIsRefreshingConv(false);
        }
    };

    const fetchGroups = async () => {
        try {
            setLoadingGroups(true);
            const token = await getToken();
            if (token) {
                const data = await getTripGroups(token);
                setGroups(data);
            }
        } catch (error) {
            console.error("Error fetching groups:", error);
        } finally {
            setLoadingGroups(false);
        }
    };

    // Pusher for main conversation list (new messages in other conversations) – real-time for company
    useEffect(() => {
        if (!clerkUser?.id) return;

        const pusher = createPusherClient(
            import.meta.env.VITE_PUSHER_KEY,
            import.meta.env.VITE_PUSHER_CLUSTER
        );

        if (!pusher) return;

        const channel = pusher.subscribe(`user-chats-${clerkUser.id}`);
        channel.bind("update-conversation", (data: { conversation: Conversation & { unreadCount?: number } }) => {
            setConversations((prev) => {
                const index = prev.findIndex(c => c._id === data.conversation._id);
                const merged = { ...data.conversation, unreadCount: data.conversation.unreadCount ?? (index >= 0 ? prev[index].unreadCount : 0) };
                if (index !== -1) {
                    const newConversations = [...prev];
                    newConversations[index] = { ...newConversations[index], ...merged };
                    return newConversations.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
                }
                return [merged, ...prev];
            });
        });

        return () => {
            pusher.unsubscribe(`user-chats-${clerkUser.id}`);
        };
    }, [clerkUser?.id]);

    // Real-time: subscribe to all trip groups to update list + unread when new message arrives
    useEffect(() => {
        if (!clerkUser?.id || groups.length === 0) return;
        const pusher = createPusherClient();
        if (!pusher) return;

        const unsubs: (() => void)[] = [];
        groups.forEach((g: any) => {
            const ch = pusher.subscribe(`trip-group-${g._id}`);
            ch.bind("new-message", (data: { message: any }) => {
                setGroups((prev) => {
                    const list = prev.map((gr: any) => {
                        if (gr._id !== g._id) return gr;
                        const isSelected = selectedGroup?._id === g._id;
                        return {
                            ...gr,
                            lastMessage: data.message.content || gr.lastMessage,
                            lastMessageAt: data.message.createdAt || gr.lastMessageAt,
                            unreadCount: isSelected ? (gr.unreadCount || 0) : (gr.unreadCount || 0) + 1
                        };
                    });
                    return list.sort((a: any, b: any) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
                });
            });
            unsubs.push(() => {
                ch.unbind("new-message");
                pusher.unsubscribe(`trip-group-${g._id}`);
            });
        });
        return () => unsubs.forEach(fn => fn());
    }, [clerkUser?.id, groups.map((g: any) => g._id).join(','), selectedGroup?._id]);

    // Total unread (conversations + groups) and notify parent for dashboard badge
    const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0) + groups.reduce((s, g) => s + (g.unreadCount || 0), 0);
    useEffect(() => {
        onUnreadChange?.(totalUnread);
    }, [totalUnread, onUnreadChange]);

    // Fetch messages when conversation/group selected; mark trip group as read when opening
    useEffect(() => {
        if (activeSubTab === 'direct' && selectedConversation) {
            fetchMessages(selectedConversation._id);
        } else if (activeSubTab === 'groups' && selectedGroup) {
            fetchGroupMessages(selectedGroup._id);
            fetchGroupParticipants(selectedGroup._id);
            getToken().then((token) => {
                if (token) {
                    markTripGroupRead(selectedGroup._id, token).then(() => {
                        setGroups((prev) => prev.map((g: any) => g._id === selectedGroup._id ? { ...g, unreadCount: 0 } : g));
                    }).catch(() => {});
                }
            });
        } else if (activeSubTab === 'direct' && selectedConversation) {
            getToken().then((token) => {
                if (token) chatService.markAsRead(selectedConversation._id, token).then(() => {
                    setConversations((prev) => prev.map((c: any) => c._id === selectedConversation._id ? { ...c, unreadCount: 0 } : c));
                }).catch(() => {});
            });
        } else {
            setMessages([]);
            setGroupMessages([]);
            setParticipants([]);
        }
    }, [selectedConversation?._id, selectedGroup?._id, activeSubTab]);

    const fetchGroupParticipants = async (groupId: string) => {
        try {
            setLoadingParticipants(true);
            const token = await getToken();
            if (token) {
                const parts = await getTripGroupParticipants(groupId, token);
                setParticipants(parts);
            }
        } catch (error) {
            console.error("Error fetching participants:", error);
        } finally {
            setLoadingParticipants(false);
        }
    };

    const fetchGroupMessages = async (groupId: string) => {
        try {
            setMessagesLoading(true);
            const token = await getToken();
            if (token) {
                const msgs = await getTripGroupMessages(groupId, token);
                setGroupMessages(Array.isArray(msgs) ? msgs : []);
                setTimeout(scrollToBottom, 50);
            } else {
                setGroupMessages([]);
            }
        } catch (error: any) {
            console.error("Error fetching group messages:", error);
            setGroupMessages([]);
            toast({
                title: "خطأ في تحميل الرسائل",
                description: error?.message || "تعذر تحميل الرسائل. تحقق من الاتصال وحاول مرة أخرى.",
                variant: "destructive",
            });
        } finally {
            setMessagesLoading(false);
        }
    };

    const fetchMessages = async (convId: string) => {
        try {
            setMessagesLoading(true);
            const token = await getToken();
            const msgs = await chatService.getMessages(convId, token || undefined);
            setMessages(msgs);
            setTimeout(scrollToBottom, 50);
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setMessagesLoading(false);
        }
    };

    const handleManualRefreshMessages = () => {
        if (selectedConversation) {
            fetchMessages(selectedConversation._id);
        }
    };

    // Pusher for selected conversation/group messages
    useEffect(() => {
        const id = activeSubTab === 'direct' ? selectedConversation?._id : selectedGroup?._id;
        if (!id) return;

        const pusher = createPusherClient();
        if (!pusher) return;

        const channelName = activeSubTab === 'direct' ? `conversation-${id}` : `trip-group-${id}`;
        const channel = pusher.subscribe(channelName);
        
        channel.bind("new-message", (data: { message: any }) => {
            if (activeSubTab === 'direct') {
                setMessages((prev) => {
                    if (prev.some(m => m._id === data.message._id)) return prev;
                    return [...prev, data.message];
                });
                // Auto mark as read if active
                getToken().then(t => { if(t) chatService.markAsRead(id, t); });
            } else {
                setGroupMessages((prev) => {
                    if (prev.some(m => m._id === data.message._id)) return prev;
                    return [...prev, data.message];
                });
                // Auto mark as read if active
                getToken().then(t => { if(t) markTripGroupRead(id, t); });
            }
            setTimeout(scrollToBottom, 50);
        });

        channel.bind("message-reaction", (data: { messageId: string, reactions: any[] }) => {
            if (activeSubTab === 'direct') {
                setMessages((prev) => prev.map(m => m._id === data.messageId ? { ...m, reactions: data.reactions } : m));
            } else {
                setGroupMessages((prev) => prev.map(m => m._id === data.messageId ? { ...m, reactions: data.reactions } : m));
            }
        });

        channel.bind("messages-read", (data: { readerId: string }) => {
            if (activeSubTab === 'direct') {
                setMessages((prev) => prev.map(m => {
                    if (m.senderId === clerkUser?.id && !m.readBy?.includes(data.readerId)) {
                        return { ...m, readBy: [...(m.readBy || []), data.readerId] };
                    }
                    return m;
                }));
            } else {
                setGroupMessages((prev) => prev.map(m => {
                    if (m.senderId === clerkUser?.id && !m.readBy?.includes(data.readerId)) {
                        return { ...m, readBy: [...(m.readBy || []), data.readerId] };
                    }
                    return m;
                }));
            }
        });

        return () => {
            pusher.unsubscribe(channelName);
        };
    }, [selectedConversation?._id, selectedGroup?._id, activeSubTab]);

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Reset input so same file can be re-selected
        e.target.value = '';

        const MAX_SIZE = 150 * 1024 * 1024; // 150MB safety limit
        if (file.size > MAX_SIZE) {
            alert('حجم الملف كبير جداً. الحد الأقصى 150MB.');
            return;
        }

        const type = file.type.startsWith('image/') ? 'image' : 
                     file.type.startsWith('video/') ? 'video' : 
                     file.type.startsWith('audio/') ? 'voice' : 
                     file.type === 'application/pdf' ? 'pdf' : 'text';
        
        // For images, create a preview data URL; for others, use object URL
        if (type === 'image') {
            const reader = new FileReader();
            reader.onload = (event) => {
                setAttachment({ file, type, preview: event.target?.result as string });
            };
            reader.readAsDataURL(file);
        } else {
            setAttachment({ file, type, preview: URL.createObjectURL(file) });
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const id = activeSubTab === 'direct' ? selectedConversation?._id : selectedGroup?._id;
        if ((!newMessage.trim() && !attachment) || !id) return;

        const content = newMessage.trim();
        const currentAttachment = attachment;

        setNewMessage("");
        setAttachment(null);
        setIsUploading(true);

        try {
            const token = await getToken();
            if (activeSubTab === 'direct') {
                // Direct messages: send as JSON (text only for now)
                const sentMessage = await chatService.sendMessage(id, content, 'company', token || undefined);
                setMessages((prev) => {
                    if (prev.some(m => m._id === sentMessage._id)) return prev;
                    return [...prev, sentMessage];
                });
            } else {
                // Trip group messages: FormData for files, JSON for text-only
                if (currentAttachment) {
                    const formData = new FormData();
                    if (content) formData.append('content', content);
                    formData.append('file', currentAttachment.file);
                    formData.append('type', currentAttachment.type);

                    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/trip-groups/${id}/messages`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        body: formData
                    });
                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.message || errData.error || `Server error ${res.status}`);
                    }
                    const sentMessage = await res.json();
                    setGroupMessages((prev) => (prev.some(m => m._id === sentMessage._id) ? prev : [...prev, sentMessage]));
                } else {
                    const sentMessage = await sendTripGroupMessage(id, { content, type: 'text' }, token || '');
                    setGroupMessages((prev) => (prev.some(m => m._id === sentMessage._id) ? prev : [...prev, sentMessage]));
                }
            }
            setTimeout(scrollToBottom, 50);
        } catch (error: any) {
            console.error("Error sending message:", error);
            setNewMessage(content);
            setAttachment(currentAttachment);
            toast({
                title: "خطأ في الإرسال",
                description: error?.message || "حدث خطأ أثناء إرسال الرسالة. تحقق من الاتصال وحاول مرة أخرى.",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleToggleReaction = async (messageId: string, emoji: string) => {
        try {
            const token = await getToken();
            if (!token) return;
            if (activeSubTab === 'direct') {
                await chatService.toggleReaction(messageId, emoji, token || undefined);
            } else {
                await toggleGroupMessageReaction(messageId, emoji, token || "");
            }
        } catch (error) {
            console.error("Error toggling reaction:", error);
        }
    };

    const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

    const filteredConversations = conversations.filter(conv => 
        conv.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredGroups = groups.filter(group => 
        group.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    );

return (
    <div className="h-[750px] md:h-[650px] flex flex-col md:flex-row bg-card rounded-2xl md:rounded-[2rem] overflow-hidden border border-border shadow-xl font-cairo" dir="rtl">
        {/* Sidebar: hidden when a chat is selected (full-width chat); shown when no selection */}
        <div className={cn(
            "w-full md:w-80 border-b md:border-b-0 md:border-l border-border flex flex-col bg-muted/30 shrink-0",
            "transition-all duration-300",
            (selectedConversation || selectedGroup) ? "hidden" : "flex"
        )}>
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-border bg-card space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg md:text-xl font-black text-foreground">الرسائل</h2>
                    <div className="flex items-center gap-1">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                            onClick={() => fetchConversations(true)}
                            disabled={isRefreshingConv}
                        >
                            <RefreshCw className={cn("h-4 w-4", isRefreshingConv && "animate-spin")} />
                        </Button>
                    </div>
                </div>

                {/* Sub-Tabs Selector */}
                <div className="grid grid-cols-2 gap-2 bg-muted/80 p-1 rounded-xl">
                    <button 
                        onClick={() => {
                            setActiveSubTab('direct');
                            setSelectedGroup(null);
                        }}
                        className={cn(
                            "flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black transition-all",
                            activeSubTab === 'direct' 
                                ? "bg-card shadow-sm text-indigo-600" 
                                : "text-gray-400 hover:bg-card/50 hover:text-muted-foreground"
                        )}
                    >
                        <User className="w-3.5 h-3.5" />
                        <span>استفسارات</span>
                    </button>
                    <button 
                        onClick={() => {
                            setActiveSubTab('groups');
                            setSelectedConversation(null);
                            if (groups.length === 0) fetchGroups();
                        }}
                        className={cn(
                            "flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black transition-all",
                            activeSubTab === 'groups' 
                                ? "bg-card shadow-sm text-indigo-600" 
                                : "text-gray-400 hover:bg-card/50 hover:text-muted-foreground"
                        )}
                    >
                        <Users className="w-3.5 h-3.5" />
                        <span>المجموعات</span>
                    </button>
                </div>

                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                        placeholder={activeSubTab === 'direct' ? 'بحث عن مسافر...' : 'بحث في المجموعات...'}
                        className="pr-10 h-11 rounded-xl bg-muted border-transparent focus:bg-card focus:border-indigo-200 transition-all text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {activeSubTab === 'direct' ? (
                        loading ? (
                            // Loading Skeletons
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="p-4 animate-pulse flex gap-3">
                                    <div className="h-12 w-12 rounded-full bg-gray-200" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                                        <div className="h-3 bg-muted rounded w-3/4" />
                                    </div>
                                </div>
                            ))
                        ) : filteredConversations.length === 0 ? (
                            <div className="text-center py-16 px-4">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MessageCircle className="h-8 w-8 text-gray-300" />
                                </div>
                                <p className="text-sm font-bold text-gray-400">لا توجد محادثات نشطة</p>
                                <p className="text-xs text-gray-300 mt-1">سيظهر هنا المسافرون الذين يتواصلون معك</p>
                            </div>
                        ) : (
                            filteredConversations.map((conv) => (
                                <button
                                    key={conv._id}
                                    onClick={() => setSelectedConversation(conv)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all group",
                                        selectedConversation?._id === conv._id 
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                                            : "hover:bg-indigo-50 text-muted-foreground"
                                    )}
                                >
                                    <Avatar className="h-12 w-12 border-2 border-white/20 shrink-0">
                                        <AvatarImage src={conv.user?.imageUrl} />
                                        <AvatarFallback className={cn(
                                            "font-black",
                                            selectedConversation?._id === conv._id ? "bg-indigo-500" : "bg-gray-200"
                                        )}>
                                            {conv.user?.fullName?.charAt(0) || <User className="h-5 w-5" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-right overflow-hidden">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={cn(
                                                "font-black text-sm truncate",
                                                selectedConversation?._id === conv._id ? "text-white" : "text-foreground"
                                            )}>
                                                {conv.user?.fullName || 'مسافر'}
                                            </h4>
                                            <span className={cn(
                                                "text-[10px] font-bold whitespace-nowrap mr-1",
                                                selectedConversation?._id === conv._id ? "text-indigo-200" : "text-gray-400"
                                            )}>
                                                {conv.lastMessageAt ? format(new Date(conv.lastMessageAt), 'HH:mm') : ''}
                                            </span>
                                        </div>
                                        <p className={cn(
                                            "text-xs truncate font-medium",
                                            selectedConversation?._id === conv._id ? "text-indigo-100" : "text-muted-foreground"
                                        )}>
                                            {conv.lastMessage || 'بدء محادثة جديدة'}
                                        </p>
                                    </div>
                                    {conv.unreadCount > 0 && selectedConversation?._id !== conv._id && (
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shrink-0">
                                            {conv.unreadCount}
                                        </span>
                                    )}
                                </button>
                            ))
                        )
                    ) : (
                        loadingGroups ? (
                            // Loading Skeletons
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="p-4 animate-pulse flex gap-3">
                                    <div className="h-12 w-12 rounded-2xl bg-gray-200" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                                        <div className="h-3 bg-muted rounded w-3/4" />
                                    </div>
                                </div>
                            ))
                        ) : filteredGroups.length === 0 ? (
                            <div className="text-center py-16 px-4">
                                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Users className="h-8 w-8 text-gray-300" />
                                </div>
                                <p className="text-sm font-bold text-gray-400">لا توجد مجموعات رحلات</p>
                                <p className="text-xs text-gray-300 mt-1">سيظهر هنا مجموعات الرحلات النشطة</p>
                            </div>
                        ) : (
                            filteredGroups.map((group) => (
                                <button
                                    key={group._id}
                                    onClick={() => setSelectedGroup(group)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all group",
                                        selectedGroup?._id === group._id 
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                                            : "hover:bg-indigo-50 text-muted-foreground"
                                    )}
                                >
                                    <Avatar className="h-12 w-12 border-2 border-white/20 rounded-xl shrink-0">
                                        <AvatarImage src={group.tripImage} className="object-cover" />
                                        <AvatarFallback className={cn(
                                            "rounded-xl font-black",
                                            selectedGroup?._id === group._id ? "bg-indigo-500" : "bg-gray-200"
                                        )}>
                                            {group.name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-right overflow-hidden">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={cn(
                                                "font-black text-sm truncate",
                                                selectedGroup?._id === group._id ? "text-white" : "text-foreground"
                                            )}>
                                                {group.name}
                                            </h4>
                                            <span className={cn(
                                                "text-[10px] font-bold whitespace-nowrap mr-1",
                                                selectedGroup?._id === group._id ? "text-indigo-200" : "text-gray-400"
                                            )}>
                                                {group.lastMessageAt ? format(new Date(group.lastMessageAt), 'HH:mm') : ''}
                                            </span>
                                        </div>
                                        <p className={cn(
                                            "text-xs truncate font-medium",
                                            selectedGroup?._id === group._id ? "text-indigo-100" : "text-muted-foreground"
                                        )}>
                                            {group.lastMessage || 'مجموعة الرحلة'}
                                        </p>
                                    </div>
                                    {(group.unreadCount || 0) > 0 && selectedGroup?._id !== group._id && (
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shrink-0">
                                            {group.unreadCount}
                                        </span>
                                    )}
                                </button>
                            ))
                        )
                    )}
                </div>
            </ScrollArea>
        </div>

        {/* Chat Area - full width when a chat is selected */}
        <div className={cn(
            "flex-1 flex flex-col bg-card min-w-0",
            (!selectedConversation && !selectedGroup) ? "hidden md:flex md:items-center md:justify-center" : "flex"
        )}>
            {(activeSubTab === 'direct' ? selectedConversation : selectedGroup) ? (
                <>
                    {/* Chat Header - back button closes chat and shows sidebar again */}
                    <div className="p-4 border-b border-border flex items-center justify-between bg-card shrink-0">
                        <button 
                            onClick={() => {
                                setSelectedConversation(null);
                                setSelectedGroup(null);
                            }}
                            className="flex items-center gap-2 p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-indigo-600"
                            title="إغلاق المحادثة والعودة للقائمة"
                        >
                            <ArrowRight className="h-5 w-5" />
                            <span className="text-xs font-bold hidden sm:inline">رجوع</span>
                        </button>

                        <div className="flex items-center gap-3 flex-1">
                            {activeSubTab === 'direct' ? (
                                <>
                                    <Avatar className="h-10 w-10 shrink-0 border-2 border-border">
                                        <AvatarImage src={selectedConversation?.user?.imageUrl} />
                                        <AvatarFallback className="bg-indigo-100 text-indigo-600 font-black">
                                            {selectedConversation?.user?.fullName?.charAt(0) || <User className="h-5 w-5" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-foreground text-sm truncate">
                                            {selectedConversation?.user?.fullName || 'مسافر'}
                                        </h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="text-[10px] font-bold text-gray-400">نشط الآن</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Avatar className="h-10 w-10 rounded-xl shrink-0 border-2 border-border">
                                        <AvatarImage src={selectedGroup?.tripImage} className="object-cover" />
                                        <AvatarFallback className="bg-indigo-600 text-white font-black text-sm rounded-xl">
                                            {selectedGroup?.name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-foreground text-sm truncate">{selectedGroup?.name}</h3>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600">
                                                <Calendar className="w-3 h-3" />
                                                <span>مجموعة الرحلة</span>
                                            </div>
                                            {selectedGroup?.tripId?.startDate && (
                                                <TripCountdown startDate={selectedGroup.tripId.startDate} />
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {selectedConversation && selectedConversation.tripId && (
                                <div className="hidden md:flex flex-col items-end">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">بخصوص رحلة</span>
                                    <span className="text-xs font-black text-indigo-600 truncate max-w-[150px]">
                                        {selectedConversation.tripId.title}
                                    </span>
                                </div>
                            )}
                            
                            {activeSubTab === 'groups' && selectedGroup && (
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-9 w-9 text-indigo-600 hover:text-indigo-700 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-all"
                                        >
                                            <Users className="h-4 w-4" />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent className="w-full sm:w-[420px] p-0 border-none overflow-hidden flex flex-col">
                                        <div className="h-full flex flex-col bg-card">
                                            {/* Header */}
                                            <div className="p-6 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white relative flex-shrink-0">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-16 w-16 border-4 border-white/20 rounded-2xl shadow-lg shrink-0">
                                                        <AvatarImage src={selectedGroup.tripImage} className="object-cover" />
                                                        <AvatarFallback className="bg-card/20 text-white font-black text-2xl">
                                                            {selectedGroup.name?.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-lg font-black truncate">{selectedGroup.name}</h3>
                                                        <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mt-1">
                                                            مجموعة الرحلة الرسمية
                                                        </p>
                                                    </div>
                                                </div>
                                                <SheetClose className="absolute left-4 top-4 rounded-full bg-card/10 p-2 hover:bg-card/20 transition-colors">
                                                    <X className="h-4 w-4" />
                                                </SheetClose>
                                            </div>

                                            {/* Participants Header */}
                                            <div className="px-6 py-4 border-b border-border flex-shrink-0">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-black text-foreground flex items-center gap-2">
                                                        <Users className="w-5 h-5 text-indigo-600" />
                                                        المشاركون
                                                    </h4>
                                                    <Badge className="bg-indigo-600 text-white font-black px-2.5 py-0.5 rounded-full">
                                                        {participants.length}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Participants List */}
                                            <div className="flex-1 overflow-hidden">
                                                <ScrollArea className="h-full px-6 py-4">
                                                    <div className="space-y-3">
                                                        {loadingParticipants ? (
                                                            [...Array(4)].map((_, i) => (
                                                                <div key={i} className="flex items-center gap-3 animate-pulse">
                                                                    <div className="h-12 w-12 rounded-xl bg-muted flex-shrink-0" />
                                                                    <div className="flex-1 space-y-2">
                                                                        <div className="h-3 bg-muted rounded w-2/3" />
                                                                        <div className="h-2 bg-muted rounded w-1/2" />
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : participants.length === 0 ? (
                                                            <div className="text-center py-8">
                                                                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
                                                                    <Users className="w-8 h-8 text-gray-300" />
                                                                </div>
                                                                <p className="text-sm font-bold text-gray-400">لا يوجد مشاركون</p>
                                                                <p className="text-xs text-gray-300 mt-1">لم ينضم أي مشارك بعد</p>
                                                            </div>
                                                        ) : (
                                                            participants.map((p) => (
                                                                <div key={p.clerkId} className="flex items-center gap-3 group hover:bg-muted p-2 rounded-xl transition-colors">
                                                                    <Avatar className="h-12 w-12 rounded-xl border-2 border-border flex-shrink-0">
                                                                        <AvatarImage src={p.imageUrl} className="object-cover" />
                                                                        <AvatarFallback className="bg-indigo-100 text-indigo-600 font-black">
                                                                            {p.fullName?.charAt(0)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <span className="font-black text-foreground text-sm truncate">
                                                                                {p.fullName}
                                                                            </span>
                                                                            {p.clerkId === selectedGroup.companyId && (
                                                                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-1.5 py-0.5 rounded-full border-0">
                                                                                    مسؤول
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-xs text-gray-400 font-bold mt-0.5 truncate">
                                                                            @{p.username || 'user'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </ScrollArea>
                                            </div>

                                            {/* Footer */}
                                            <div className="p-6 flex-shrink-0 border-t border-border bg-muted/50">
                                                <div className="bg-card rounded-xl p-3 border border-indigo-100 shadow-sm">
                                                    <p className="text-xs font-medium text-indigo-700 leading-relaxed text-center">
                                                        تظهر هذه القائمة جميع المشتركين المنضمين لمجموعة المحادثة حالياً.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            )}

                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 text-gray-400 hover:text-indigo-600 rounded-xl bg-muted hover:bg-indigo-50 transition-all"
                                onClick={handleManualRefreshMessages}
                                disabled={messagesLoading}
                            >
                                <RefreshCw className={cn("h-4 w-4", messagesLoading && "animate-spin")} />
                            </Button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 md:p-6 bg-muted/50">
                        <div className="space-y-4">
                            {messagesLoading ? (
                                <div className="flex justify-center py-10">
                                    <div className="flex items-center gap-2 text-indigo-600">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span className="text-sm font-bold">جاري التحميل...</span>
                                    </div>
                                </div>
                            ) : (
                                activeSubTab === 'direct' ? (
                                    messages.length === 0 ? (
                                        <div className="text-center py-16">
                                            <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                                <MessageCircle className="h-8 w-8 text-gray-300" />
                                            </div>
                                            <p className="text-sm font-bold text-gray-400">لا توجد رسائل بعد</p>
                                            <p className="text-xs text-gray-300 mt-1">ابدأ المحادثة الآن</p>
                                        </div>
                                    ) : (
                                        messages.map((msg, idx) => {
                                            const isMe = msg.senderType === 'company';
                                            return (
                                                <div 
                                                    key={msg._id || idx}
                                                    className={cn(
                                                        "flex w-full",
                                                        isMe ? "justify-start" : "justify-end"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "max-w-[85%] md:max-w-[70%] flex flex-col",
                                                        isMe ? "items-start" : "items-end"
                                                    )}>
                                                        <div className="relative group/msg">
                                                            <div className={cn(
                                                                "p-3 md:p-4 rounded-2xl text-sm font-medium shadow-sm overflow-hidden",
                                                                isMe 
                                                                    ? "bg-indigo-600 text-white rounded-tr-none" 
                                                                    : "bg-card text-foreground border border-border rounded-tl-none"
                                                            )}>
                                                                {msg.type === 'image' && (
                                                                    msg.mediaUrl && !String(msg.mediaUrl).startsWith('__') ? (
                                                                    <img 
                                                                        src={msg.mediaUrl} 
                                                                        alt="attachment" 
                                                                        className="rounded-xl mb-2 max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                                                        onClick={() => window.open(msg.mediaUrl, '_blank')}
                                                                        referrerPolicy="no-referrer"
                                                                    />
                                                                    ) : (
                                                                    <div className="rounded-xl mb-2 p-6 bg-muted flex items-center justify-center gap-2 text-muted-foreground">
                                                                        <ImageIcon className="h-8 w-8" />
                                                                        <span className="text-xs font-bold">صورة</span>
                                                                    </div>
                                                                    )
                                                                )}
                                                                {msg.type === 'pdf' && msg.mediaUrl && !String(msg.mediaUrl).startsWith('__') && (
                                                                    <div 
                                                                        className={cn(
                                                                            "flex items-center gap-3 p-3 rounded-xl border mb-2 cursor-pointer transition-all",
                                                                            isMe ? "bg-card/10 border-white/20 hover:bg-card/20" : "bg-muted border-border hover:bg-muted"
                                                                        )}
                                                                        onClick={() => window.open(msg.mediaUrl, '_blank')}
                                                                    >
                                                                        <div className={cn(
                                                                            "h-10 w-10 md:h-12 md:w-12 rounded-lg flex items-center justify-center shrink-0",
                                                                            isMe ? "bg-card/20 text-white" : "bg-indigo-100 text-indigo-600"
                                                                        )}>
                                                                            <FileText className="h-5 w-5 md:h-6 md:w-6" />
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className={cn(
                                                                                "text-xs md:text-sm font-black truncate",
                                                                                isMe ? "text-white" : "text-foreground"
                                                                            )}>
                                                                                ملف PDF (عرض التفاصيل)
                                                                            </p>
                                                                            <p className={cn(
                                                                                "text-[10px] md:text-[11px] font-bold opacity-60",
                                                                                isMe ? "text-white" : "text-muted-foreground"
                                                                            )}>
                                                                                انقر للفتح أو التحميل
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {msg.type === 'video' && (
                                                                    msg.mediaUrl && !String(msg.mediaUrl).startsWith('__') ? (
                                                                    <video 
                                                                        src={msg.mediaUrl} 
                                                                        controls 
                                                                        className="rounded-xl mb-2 max-w-full h-auto"
                                                                        controlsList="nodownload"
                                                                    />
                                                                    ) : (
                                                                    <div className="rounded-xl mb-2 p-6 bg-muted flex items-center justify-center gap-2 text-muted-foreground">
                                                                        <Video className="h-8 w-8" />
                                                                        <span className="text-xs font-bold">فيديو</span>
                                                                    </div>
                                                                    )
                                                                )}
                                                                {msg.type === 'voice' && (
                                                                    msg.mediaUrl && !String(msg.mediaUrl).startsWith('__') ? (
                                                                    <audio 
                                                                        src={msg.mediaUrl} 
                                                                        controls 
                                                                        className="mb-2 w-full"
                                                                        controlsList="nodownload"
                                                                    />
                                                                    ) : (
                                                                    <div className="rounded-xl mb-2 p-4 bg-muted flex items-center justify-center gap-2 text-muted-foreground">
                                                                        <Mic className="h-6 w-6" />
                                                                        <span className="text-xs font-bold">تسجيل صوتي</span>
                                                                    </div>
                                                                    )
                                                                )}
                                                                {msg.content && (
                                                                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                                                )}
                                                            </div>

                                                            {/* Reactions */}
                                                            {msg.reactions && msg.reactions.length > 0 && (
                                                                <div className={cn(
                                                                    "absolute -bottom-3 flex flex-wrap gap-1 z-20",
                                                                    isMe ? "right-2" : "left-2"
                                                                )}>
                                                                    {Object.entries(
                                                                        msg.reactions.reduce((acc: any, r: any) => {
                                                                            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                                                            return acc;
                                                                        }, {})
                                                                    ).map(([emoji, count]: any) => (
                                                                        <button 
                                                                            key={emoji}
                                                                            onClick={() => handleToggleReaction(msg._id, emoji)}
                                                                            className="bg-card border border-border rounded-full px-2 py-1 shadow-sm flex items-center gap-1 hover:bg-muted transition-colors"
                                                                        >
                                                                            <span className="text-xs">{emoji}</span>
                                                                            {count > 1 && (
                                                                                <span className="text-[9px] font-black text-indigo-600">
                                                                                    {count}
                                                                                </span>
                                                                            )}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}

{/* Reaction Picker */}
<div
  className={cn(
    "absolute -top-14 scale-95 opacity-0 group-hover/msg:opacity-100 group-hover/msg:scale-100 transition-all duration-300 z-[9999]",
    isMe ? "left-0" : "right-0" /* Adjust positioning to be predictable */
  )}
>
  <div className="flex items-center gap-1.5 bg-card/95 backdrop-blur-sm rounded-full shadow-2xl border border-border px-2 py-1.5">
    {REACTION_EMOJIS.map((emoji) => (
      <button
        key={emoji}
        onClick={() => handleToggleReaction(msg._id, emoji)}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-indigo-50 transition-all hover:scale-125 active:scale-95"
      >
        <span className="text-xl leading-none">{emoji}</span>
      </button>
    ))}
  </div>
</div>

                                                        </div>

                                                        {/* Message Footer */}
                                                        <div className="flex items-center gap-1.5 mt-1.5 px-1">
                                                            <span className="text-[9px] text-gray-400 font-bold">
                                                                {msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : ''}
                                                            </span>
                                                            {isMe && (
                                                                msg.read || (msg.readBy && msg.readBy.length > 1)
                                                                    ? <CheckCheck className="h-3 w-3 text-emerald-400" />
                                                                    : <Check className="h-3 w-3 text-gray-300" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )
                                ) : (
                                    groupMessages.length === 0 ? (
                                        <div className="text-center py-16">
                                            <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                                <MessageCircle className="h-8 w-8 text-gray-300" />
                                            </div>
                                            <p className="text-sm font-bold text-gray-400">لا توجد رسائل في المجموعة</p>
                                            <p className="text-xs text-gray-300 mt-1">كن أول من يرسل رسالة</p>
                                        </div>
                                    ) : (
                                        groupMessages.map((msg, idx) => {
                                            const isMe = msg.senderId === clerkUser?.id;
                                            const isSystem = msg.type === 'system';
                                            
                                            if (isSystem) {
                                                return (
                                                    <div key={msg._id || idx} className="flex justify-center">
                                                        <span className="px-4 py-1.5 bg-gray-200/80 text-[10px] font-bold text-muted-foreground rounded-full">
                                                            {msg.content}
                                                        </span>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div 
                                                    key={msg._id || idx}
                                                    className={cn(
                                                        "flex w-full",
                                                        isMe ? "justify-start" : "justify-end"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "max-w-[85%] md:max-w-[70%] flex flex-col",
                                                        isMe ? "items-start" : "items-end"
                                                    )}>
                                                        {!isMe && (
                                                            <span className="text-[10px] font-black text-gray-400 mb-1 mr-1">
                                                                {msg.senderName}
                                                            </span>
                                                        )}
                                                        <div className="relative group/msg">
                                                            <div className={cn(
                                                                "p-3 md:p-4 rounded-2xl text-sm font-medium shadow-sm overflow-hidden",
                                                                isMe 
                                                                    ? "bg-indigo-600 text-white rounded-tr-none" 
                                                                    : "bg-card text-foreground border border-border rounded-tl-none",
                                                                msg.isAnnouncement && "ring-2 ring-amber-400 ring-offset-2"
                                                            )}>
                                                                {msg.type === 'image' && (
                                                                    msg.mediaUrl && !String(msg.mediaUrl).startsWith('__') ? (
                                                                    <img 
                                                                        src={msg.mediaUrl} 
                                                                        alt="attachment" 
                                                                        className="rounded-xl mb-2 max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                                                        onClick={() => window.open(msg.mediaUrl, '_blank')}
                                                                        referrerPolicy="no-referrer"
                                                                    />
                                                                    ) : (
                                                                    <div className="rounded-xl mb-2 p-6 bg-muted flex items-center justify-center gap-2 text-muted-foreground">
                                                                        <ImageIcon className="h-8 w-8" />
                                                                        <span className="text-xs font-bold">صورة</span>
                                                                    </div>
                                                                    )
                                                                )}
                                                                {msg.type === 'pdf' && msg.mediaUrl && !String(msg.mediaUrl).startsWith('__') && (
                                                                    <div 
                                                                        className={cn(
                                                                            "flex items-center gap-3 p-3 rounded-xl border mb-2 cursor-pointer transition-all",
                                                                            isMe ? "bg-card/10 border-white/20 hover:bg-card/20" : "bg-muted border-border hover:bg-muted"
                                                                        )}
                                                                        onClick={() => window.open(msg.mediaUrl, '_blank')}
                                                                    >
                                                                        <div className={cn(
                                                                            "h-10 w-10 md:h-12 md:w-12 rounded-lg flex items-center justify-center shrink-0",
                                                                            isMe ? "bg-card/20 text-white" : "bg-indigo-100 text-indigo-600"
                                                                        )}>
                                                                            <FileText className="h-5 w-5 md:h-6 md:w-6" />
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className={cn(
                                                                                "text-xs md:text-sm font-black truncate",
                                                                                isMe ? "text-white" : "text-foreground"
                                                                            )}>
                                                                                ملف PDF (عرض التفاصيل)
                                                                            </p>
                                                                            <p className={cn(
                                                                                "text-[10px] md:text-[11px] font-bold opacity-60",
                                                                                isMe ? "text-white" : "text-muted-foreground"
                                                                            )}>
                                                                                انقر للفتح أو التحميل
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {msg.type === 'video' && (
                                                                    msg.mediaUrl && !String(msg.mediaUrl).startsWith('__') ? (
                                                                    <video 
                                                                        src={msg.mediaUrl} 
                                                                        controls 
                                                                        className="rounded-xl mb-2 max-w-full h-auto"
                                                                        controlsList="nodownload"
                                                                    />
                                                                    ) : (
                                                                    <div className="rounded-xl mb-2 p-6 bg-muted flex items-center justify-center gap-2 text-muted-foreground">
                                                                        <Video className="h-8 w-8" />
                                                                        <span className="text-xs font-bold">فيديو</span>
                                                                    </div>
                                                                    )
                                                                )}
                                                                {msg.type === 'voice' && (
                                                                    msg.mediaUrl && !String(msg.mediaUrl).startsWith('__') ? (
                                                                    <audio 
                                                                        src={msg.mediaUrl} 
                                                                        controls 
                                                                        className="mb-2 w-full"
                                                                        controlsList="nodownload"
                                                                    />
                                                                    ) : (
                                                                    <div className="rounded-xl mb-2 p-4 bg-muted flex items-center justify-center gap-2 text-muted-foreground">
                                                                        <Mic className="h-6 w-6" />
                                                                        <span className="text-xs font-bold">تسجيل صوتي</span>
                                                                    </div>
                                                                    )
                                                                )}
                                                                {msg.content && (
                                                                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                                                )}
                                                            </div>

                                                            {/* Group Reactions */}
                                                            {msg.reactions && msg.reactions.length > 0 && (
                                                                <div className={cn(
                                                                    "absolute -bottom-3 flex flex-wrap gap-1 z-20",
                                                                    isMe ? "right-2" : "left-2"
                                                                )}>
                                                                    {Object.entries(
                                                                        msg.reactions.reduce((acc: any, r: any) => {
                                                                            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                                                            return acc;
                                                                        }, {})
                                                                    ).map(([emoji, count]: any) => (
                                                                        <button 
                                                                            key={emoji}
                                                                            onClick={() => handleToggleReaction(msg._id, emoji)}
                                                                            className="bg-card border border-border rounded-full px-2 py-1 shadow-sm flex items-center gap-1 hover:bg-muted transition-colors"
                                                                        >
                                                                            <span className="text-xs">{emoji}</span>
                                                                            {count > 1 && (
                                                                                <span className="text-[9px] font-black text-indigo-600">
                                                                                    {count}
                                                                                </span>
                                                                            )}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Group Reaction Picker */}
                                                            <div className={cn(
                                                                "absolute -top-14 scale-95 opacity-0 group-hover/msg:opacity-100 group-hover/msg:scale-100 transition-all duration-300 z-[9999]",
                                                                isMe ? "left-0" : "right-0"
                                                            )}>
                                                                <div className="flex items-center gap-1.5 bg-card/95 backdrop-blur-sm rounded-full shadow-2xl border border-border px-2 py-1.5">
                                                                    {REACTION_EMOJIS.map(emoji => (
                                                                        <button
                                                                            key={emoji}
                                                                            onClick={() => handleToggleReaction(msg._id, emoji)}
                                                                            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-indigo-50 transition-all hover:scale-125 active:scale-95"
                                                                        >
                                                                            <span className="text-xl leading-none">{emoji}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Message Footer */}
                                                        <div className="flex items-center gap-1.5 mt-1.5 px-1">
                                                            <span className="text-[9px] text-gray-400 font-bold">
                                                                {msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : ''}
                                                            </span>
                                                            {isMe && (
                                                                msg.readBy && msg.readBy.length > 1
                                                                    ? <CheckCheck className="h-3 w-3 text-emerald-400" />
                                                                    : <Check className="h-3 w-3 text-gray-300" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )
                                )
                            )}
                        </div>
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="p-4 md:p-6 bg-card border-t border-border">
                        {/* Attachment Preview */}
                        {attachment && (
                            <div className="mb-4 flex items-center gap-3 p-3 bg-muted rounded-xl border border-border animate-in fade-in slide-in-from-bottom-2">
                                {attachment.type === 'image' ? (
                                    <img 
                                        src={attachment.preview} 
                                        className="h-16 w-16 object-cover rounded-lg shadow-sm" 
                                        alt="preview" 
                                    />
                                ) : (
                                    <div className="h-16 w-16 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                        {attachment.type === 'video' ? (
                                            <Video className="h-8 w-8" />
                                        ) : attachment.type === 'pdf' ? (
                                            <FileText className="h-8 w-8" />
                                        ) : (
                                            <Mic className="h-8 w-8" />
                                        )}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-foreground truncate">{attachment.file.name}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">
                                        {attachment.type === 'image' ? 'صورة' : attachment.type === 'video' ? 'فيديو' : attachment.type === 'pdf' ? 'ملف PDF' : 'تسجيل صوتي'}
                                    </p>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-600 shrink-0 transition-colors"
                                    onClick={() => setAttachment(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}

                        {/* Message Input Form */}
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-3">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleFileSelect}
                                accept="image/*,video/*,audio/*,application/pdf"
                            />
                            
                            <div className="flex items-center gap-1 shrink-0">
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-10 w-10 md:h-12 md:w-12 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    <Plus className="h-4 w-4 md:h-5 md:w-5" />
                                </Button>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-10 w-10 md:h-12 md:w-12 rounded-xl text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-all"
                                            disabled={isUploading}
                                        >
                                            <Smile className="h-4 w-4 md:h-5 md:w-5" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent side="top" align="start" className="p-0 border-none bg-transparent shadow-none w-[300px] md:w-[350px]">
                                        <EmojiPicker 
                                            onEmojiClick={(emoji) => setNewMessage(prev => prev + emoji.emoji)}
                                            theme={Theme.LIGHT}
                                            width="100%"
                                            height={400}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <Input 
                                className="flex-1 h-10 md:h-14 rounded-xl bg-muted border-transparent focus-visible:ring-indigo-600 text-sm font-bold"
                                placeholder="اكتب رسالتك هنا..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                disabled={isUploading}
                            />
                            
                            <Button 
                                type="submit"
                                disabled={(!newMessage.trim() && !attachment) || isUploading}
                                className="h-10 md:h-14 px-4 md:px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 gap-2 shrink-0 transition-all"
                            >
                                {isUploading ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <span className="font-bold text-sm md:text-base">إرسال</span>
                                        <Send className="h-3 w-3 md:h-4 md:w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </>
            ) : (
                // Empty State
                <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-20 text-center">
                    <div className="h-20 w-20 md:h-24 md:w-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-200 mb-4">
                        <MessageCircle className="h-10 w-10 md:h-12 md:w-12" />
                    </div>
                    <h3 className="text-lg md:text-xl font-black text-foreground mb-2">اختر محادثة للبدء</h3>
                    <p className="text-gray-400 max-w-xs mx-auto text-sm font-medium">
                        سجل المحادثات مع المسافرين سيظهر هنا للرد على استفساراتهم ومساعدتهم.
                    </p>
                </div>
            )}
        </div>
    </div>
);
};

const Loader2 = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={cn("animate-spin", className)}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);
