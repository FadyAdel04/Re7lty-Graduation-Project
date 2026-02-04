import { useState, useEffect, useRef } from "react";
import { MessageCircleMore, X, Send, User, Building2, Minus, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, useUser } from "@clerk/clerk-react";
import { chatService, Message, Conversation } from "@/services/chatService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createPusherClient } from "@/lib/pusher-client";
import { cn } from "@/lib/utils";

interface ChatWidgetProps {
  companyId: string;
  companyName: string;
  companyLogo: string;
  tripId?: string;
  tripTitle?: string;
}

export const ChatWidget = ({ companyId, companyName, companyLogo, tripId, tripTitle }: ChatWidgetProps) => {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize/Fetch conversation
  useEffect(() => {
    if (isOpen && isSignedIn && companyId) {
      handleStartChat();
    }
  }, [isOpen, isSignedIn, companyId]);

  const handleStartChat = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const conversation = await chatService.startChat(companyId, tripId, token || undefined);
      setCurrentConversation(conversation);
      
      const msgs = await chatService.getMessages(conversation._id, token || undefined);
      setMessages(msgs);
    } catch (error) {
      console.error("Error starting chat:", error);
    } finally {
      setLoading(false);
    }
  };

  // Pusher Real-time subscription
  useEffect(() => {
    if (!currentConversation?._id) return;

    const pusher = createPusherClient(
      import.meta.env.VITE_PUSHER_KEY,
      import.meta.env.VITE_PUSHER_CLUSTER
    );

    if (!pusher) return;

    const channel = pusher.subscribe(`conversation-${currentConversation._id}`);
    channel.bind("new-message", (data: { message: Message }) => {
      setMessages((prev) => {
        // Avoid duplicate messages
        if (prev.some(m => m._id === data.message._id)) return prev;
        return [...prev, data.message];
      });
      
      // Auto-scroll to bottom
      setTimeout(scrollToBottom, 100);
    });

    return () => {
      pusher.unsubscribe(`conversation-${currentConversation._id}`);
    };
  }, [currentConversation?._id]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent, directContent?: string) => {
    e?.preventDefault();
    const content = directContent || newMessage.trim();
    if (!content || !currentConversation?._id) return;

    if (!directContent) setNewMessage("");

    try {
      const token = await getToken();
      const sentMessage = await chatService.sendMessage(currentConversation._id, content, 'user', token || undefined);
      
      // Update local UI immediately
      setMessages((prev) => {
        if (prev.some(m => m._id === sentMessage._id)) return prev;
        return [...prev, sentMessage];
      });
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      if (!directContent) setNewMessage(content); // Restore message on failure
    }
  };

  const handleQuickReply = (text: string) => {
    handleSendMessage(undefined, text);
  };

  const SUGGESTED_MESSAGES = [
    "ما هي تفاصيل الرحلة؟",
    "أريد معرفة المزيد من المعلومات",
    "أريد تعديل تفاصيل الحجز",
  ];

  if (!isSignedIn) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-cairo" dir="rtl">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? "64px" : "550px", // Increased height to accommodate suggestions
              width: "350px"
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={cn(
              "bg-white rounded-[2rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden mb-4 transition-all duration-300",
              isMinimized ? "h-16" : "h-[550px]"
            )}
          >
            {/* ... Header ... */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 flex items-center justify-between text-white shadow-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-white/20">
                  <AvatarImage src={companyLogo} alt={companyName} />
                  <AvatarFallback className="bg-indigo-500 text-white">
                    <Building2 className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-black text-sm leading-none mb-1">{companyName}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-indigo-100">نشط الآن</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/10 rounded-full"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/10 rounded-full"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 bg-gray-50/50">
                  <div className="space-y-4">
                    {tripTitle && (
                      <div className="text-center mb-6">
                        <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full border border-indigo-100">
                          بخصوص: {tripTitle}
                        </span>
                      </div>
                    )}

                    {loading ? (
                      <div className="flex justify-center py-10">
                        <span className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-10 space-y-4">
                        <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                          <MessageCircleMore className="h-8 w-8 text-gray-200" />
                        </div>
                        <p className="text-xs font-bold text-gray-400">ابدأ المحادثة مع الشركة الآن.</p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => (
                        <motion.div
                          key={msg._id || idx}
                          initial={{ opacity: 0, x: msg.senderType === 'user' ? 10 : -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={cn(
                            "flex flex-col max-w-[85%]",
                            msg.senderType === 'user' ? "ml-auto items-start" : "mr-auto items-end"
                          )}
                        >
                          <div className={cn(
                            "p-3 rounded-2xl text-sm font-medium shadow-sm",
                            msg.senderType === 'user' 
                              ? "bg-indigo-600 text-white rounded-br-none" 
                              : "bg-white text-gray-900 border border-gray-100 rounded-bl-none"
                          )}>
                            {msg.content}
                          </div>
                          <span className="text-[9px] text-gray-400 mt-1 font-bold">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </motion.div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                {/* Suggestions Area */}
                {messages.length < 5 && (
                  <div className="px-4 py-2 bg-gray-50/30 flex gap-2 overflow-x-auto no-scrollbar">
                    {SUGGESTED_MESSAGES.map((msg, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickReply(msg)}
                        className="whitespace-nowrap px-3 py-1.5 bg-white border border-indigo-100 text-indigo-600 text-[10px] font-bold rounded-full hover:bg-indigo-50 transition-colors shadow-sm"
                      >
                        {msg}
                      </button>
                    ))}
                  </div>
                )}

                {/* Footer Input */}
                <div className="p-4 bg-white border-t border-gray-100">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input
                      placeholder="اكتب رسالتك..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="h-12 rounded-2xl bg-gray-50 border-gray-100 focus-visible:ring-indigo-500 text-sm font-bold"
                    />
                    <Button 
                      disabled={!newMessage.trim()}
                      className="h-12 w-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          setIsMinimized(false);
        }}
        className={cn(
          "h-14 rounded-full flex items-center shadow-2xl transition-all duration-500 relative overflow-hidden group border-2 border-transparent focus:outline-none",
          isOpen 
            ? "w-14 justify-center bg-white text-indigo-600 border-indigo-100" 
            : "px-6 bg-indigo-600 text-white"
        )}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-3"
            >
              <span className="text-sm font-black whitespace-nowrap">تواصل مع الشركة</span>
              <MessageCircleMore className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
      </motion.button>
    </div>
  );
};
