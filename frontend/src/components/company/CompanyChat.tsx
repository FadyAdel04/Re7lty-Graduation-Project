import { useState, useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { chatService, Message, Conversation } from "@/services/chatService";
import { createPusherClient } from "@/lib/pusher-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, User, MessageCircle, Clock, CheckCheck, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const CompanyChat = () => {
    const { getToken } = useAuth();
    const { user: clerkUser } = useUser();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [isRefreshingConv, setIsRefreshingConv] = useState(false);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Fetch conversations
    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async (isManual = false) => {
        try {
            if (isManual) setIsRefreshingConv(true);
            else setLoading(true);
            
            const token = await getToken();
            const data = await chatService.getConversations(token || undefined, true);
            setConversations(data);
        } catch (error) {
            console.error("Error fetching conversations:", error);
        } finally {
            setLoading(false);
            setIsRefreshingConv(false);
        }
    };

    // Pusher for main conversation list (new messages in other conversations)
    useEffect(() => {
        if (!clerkUser?.id) return;

        const pusher = createPusherClient(
            import.meta.env.VITE_PUSHER_KEY,
            import.meta.env.VITE_PUSHER_CLUSTER
        );

        if (!pusher) return;

        // Channel for this company's owner to receive general chat updates
        const channel = pusher.subscribe(`user-chats-${clerkUser.id}`);
        channel.bind("update-conversation", (data: { conversation: Conversation }) => {
            setConversations((prev) => {
                const index = prev.findIndex(c => c._id === data.conversation._id);
                if (index !== -1) {
                    const newConversations = [...prev];
                    newConversations[index] = { ...newConversations[index], ...data.conversation };
                    return newConversations.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
                }
                return [data.conversation, ...prev];
            });
        });

        return () => {
            pusher.unsubscribe(`user-chats-${clerkUser.id}`);
        };
    }, [clerkUser?.id]);

    // Fetch messages when conversation selected
    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation._id);
        } else {
            setMessages([]);
        }
    }, [selectedConversation?._id]);

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

    // Pusher for selected conversation messages
    useEffect(() => {
        if (!selectedConversation?._id) return;

        const pusher = createPusherClient(
            import.meta.env.VITE_PUSHER_KEY,
            import.meta.env.VITE_PUSHER_CLUSTER
        );

        if (!pusher) return;

        const channel = pusher.subscribe(`conversation-${selectedConversation._id}`);
        channel.bind("new-message", (data: { message: Message }) => {
            setMessages((prev) => {
                if (prev.some(m => m._id === data.message._id)) return prev;
                return [...prev, data.message];
            });
            setTimeout(scrollToBottom, 50);
        });

        return () => {
            pusher.unsubscribe(`conversation-${selectedConversation._id}`);
        };
    }, [selectedConversation?._id]);

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !selectedConversation?._id) return;

        const content = newMessage.trim();
        setNewMessage("");

        try {
            const token = await getToken();
            const sentMessage = await chatService.sendMessage(selectedConversation._id, content, 'company', token || undefined);
            
            // Update local UI
            setMessages((prev) => {
                if (prev.some(m => m._id === sentMessage._id)) return prev;
                return [...prev, sentMessage];
            });
            setTimeout(scrollToBottom, 50);
        } catch (error) {
            console.error("Error sending message:", error);
            setNewMessage(content); // Restore on failure
        }
    };

    const filteredConversations = conversations.filter(conv => 
        conv.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-[650px] flex bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-xl font-cairo" dir="rtl">
            {/* Conversations List */}
            <div className="w-80 border-l border-gray-100 flex flex-col bg-gray-50/30">
                <div className="p-6 border-b border-gray-100 bg-white">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-gray-900">المحادثات</h2>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-400 hover:text-indigo-600 rounded-full"
                            onClick={() => fetchConversations(true)}
                            disabled={isRefreshingConv}
                        >
                            <RefreshCw className={cn("h-4 w-4", isRefreshingConv && "animate-spin")} />
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                            placeholder="بحث عن مسافر..." 
                            className="pr-10 h-11 rounded-xl bg-gray-50 border-transparent focus:bg-white transition-all text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {loading ? (
                            [1,2,3].map(i => (
                                <div key={i} className="p-4 animate-pulse flex gap-3">
                                    <div className="h-12 w-12 rounded-full bg-gray-200" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                                    </div>
                                </div>
                            ))
                        ) : filteredConversations.length === 0 ? (
                            <div className="text-center py-20 px-4">
                                <MessageCircle className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                                <p className="text-xs font-bold text-gray-400">لا توجد محادثات نشطة</p>
                            </div>
                        ) : (
                            filteredConversations.map((conv) => (
                                <button
                                    key={conv._id}
                                    onClick={() => setSelectedConversation(conv)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-4 rounded-2xl transition-all group",
                                        selectedConversation?._id === conv._id 
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                                            : "hover:bg-indigo-50/50 text-gray-600"
                                    )}
                                >
                                    <Avatar className="h-12 w-12 border-2 border-white/20">
                                        <AvatarImage src={conv.user?.imageUrl} />
                                        <AvatarFallback className={cn(
                                            selectedConversation?._id === conv._id ? "bg-indigo-500" : "bg-gray-100"
                                        )}>
                                            <User className="h-6 w-6" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-right overflow-hidden">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={cn(
                                                "font-black text-sm truncate",
                                                selectedConversation?._id === conv._id ? "text-white" : "text-gray-900"
                                            )}>
                                                {conv.user?.fullName || "مسافر"}
                                            </h4>
                                            <span className={cn(
                                                "text-[9px] font-bold",
                                                selectedConversation?._id === conv._id ? "text-indigo-200" : "text-gray-400"
                                            )}>
                                                {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className={cn(
                                            "text-xs truncate font-medium",
                                            selectedConversation?._id === conv._id ? "text-indigo-100" : "text-gray-500"
                                        )}>
                                            {conv.lastMessage || "بدء محادثة جديدة"}
                                        </p>
                                    </div>
                                    {conv.unreadCount > 0 && selectedConversation?._id !== conv._id && (
                                        <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedConversation ? (
                    <>
                        {/* Area Header */}
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={selectedConversation.user?.imageUrl} />
                                    <AvatarFallback><User /></AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-black text-gray-900 text-sm">{selectedConversation.user?.fullName || "مسافر"}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-[10px] font-bold text-gray-400">نشط الآن</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {selectedConversation.tripId && (
                                    <div className="hidden md:flex flex-col items-end">
                                        <span className="text-[10px] font-black text-gray-400 uppercase">بخصوص رحلة</span>
                                        <span className="text-xs font-black text-indigo-600">{selectedConversation.tripId.title}</span>
                                    </div>
                                )}
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-9 w-9 text-gray-400 hover:text-indigo-600 rounded-xl bg-gray-50"
                                    onClick={handleManualRefreshMessages}
                                    disabled={messagesLoading}
                                >
                                    <RefreshCw className={cn("h-4 w-4", messagesLoading && "animate-spin")} />
                                </Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <ScrollArea ref={scrollAreaRef} className="flex-1 p-6 bg-gray-50/50">
                            <div className="space-y-6">
                                {messagesLoading ? (
                                    <div className="flex justify-center py-10">
                                        <Loader2 className="animate-spin text-indigo-600" />
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isMe = msg.senderType === 'company';
                                        return (
                                            <div 
                                                key={msg._id || idx}
                                                className={cn(
                                                    "flex w-full mb-4",
                                                    isMe ? "justify-start" : "justify-end"
                                                )}
                                            >
                                                <div className={cn(
                                                    "max-w-[70%] flex flex-col",
                                                    isMe ? "items-start" : "items-end"
                                                )}>
                                                    <div className={cn(
                                                        "p-4 rounded-3xl text-sm font-medium shadow-sm",
                                                        isMe 
                                                            ? "bg-indigo-600 text-white rounded-tr-none" 
                                                            : "bg-white text-gray-900 border border-gray-100 rounded-tl-none"
                                                    )}>
                                                        {msg.content}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-1.5 px-1">
                                                        <span className="text-[9px] text-gray-400 font-bold">
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {isMe && <CheckCheck className="h-3 w-3 text-indigo-400" />}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="p-6 bg-white border-t border-gray-100">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                                <Input 
                                    className="flex-1 h-14 rounded-2xl bg-gray-50 border-transparent focus-visible:ring-indigo-600 text-sm font-bold"
                                    placeholder="اكتب ردك هنا..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <Button 
                                    disabled={!newMessage.trim()}
                                    className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 gap-2"
                                >
                                    <span className="font-bold">إرسال</span>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-4">
                        <div className="h-24 w-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-200">
                            <MessageCircle className="h-12 w-12" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900">اختر محادثة للبدء</h3>
                        <p className="text-gray-400 max-w-xs mx-auto text-sm font-medium">سجل المحادثات مع المسافرين سيظهر هنا للرد على استفساراتهم ومساعدتهم.</p>
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
