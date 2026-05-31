import { useState, useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { chatService, Conversation, Message } from "@/services/chatService";
import { createPusherClient } from "@/lib/pusher-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, Loader2, MessageSquare, Send, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const CompanyMessages = () => {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      navigate("/auth");
      return;
    }
    loadConversations();
  }, [isSignedIn]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const convId = params.get("conv");
    if (convId && conversations.length > 0) {
      const found = conversations.find((c) => c._id === convId);
      if (found) setActiveConversation(found);
    }
  }, [location.search, conversations]);

  useEffect(() => {
    if (!activeConversation?._id) return;
    loadMessages(activeConversation._id);
    markRead(activeConversation._id);
  }, [activeConversation?._id]);

  useEffect(() => {
    if (!user?.id) return;
    const pusher = createPusherClient(
      import.meta.env.VITE_PUSHER_KEY,
      import.meta.env.VITE_PUSHER_CLUSTER
    );
    if (!pusher) return;

    const userChannel = pusher.subscribe(`user-chats-${user.id}`);
    userChannel.bind("update-conversation", () => {
      loadConversations();
    });

    return () => {
      pusher.unsubscribe(`user-chats-${user.id}`);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!activeConversation?._id) return;
    const pusher = createPusherClient(
      import.meta.env.VITE_PUSHER_KEY,
      import.meta.env.VITE_PUSHER_CLUSTER
    );
    if (!pusher) return;

    const channel = pusher.subscribe(`conversation-${activeConversation._id}`);
    channel.bind("new-message", (data: { message: Message }) => {
      if (data.message.senderId !== user?.id) {
        setMessages((prev) =>
          prev.some((m) => m._id === data.message._id) ? prev : [...prev, data.message]
        );
      }
    });

    return () => {
      pusher.unsubscribe(`conversation-${activeConversation._id}`);
    };
  }, [activeConversation?._id, user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function loadConversations() {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const data = await chatService.getConversations(token, false);
      setConversations(data);
    } catch {
      toast({ title: "خطأ", description: "تعذر تحميل المحادثات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(convId: string) {
    try {
      setMessagesLoading(true);
      const token = await getToken();
      if (!token) return;
      const data = await chatService.getMessages(convId, token);
      setMessages(data);
    } catch {
      toast({ title: "خطأ", description: "تعذر تحميل الرسائل", variant: "destructive" });
    } finally {
      setMessagesLoading(false);
    }
  }

  async function markRead(convId: string) {
    try {
      const token = await getToken();
      if (!token) return;
      await chatService.markAsRead(convId, token);
      setConversations((prev) =>
        prev.map((c) => (c._id === convId ? { ...c, unreadCount: 0 } : c))
      );
    } catch {
      /* ignore */
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const token = await getToken();
      if (!token) return;
      const sent = await chatService.sendMessage(
        activeConversation._id,
        content,
        "user",
        token
      );
      setMessages((prev) => [...prev, sent]);
    } catch {
      setNewMessage(content);
      toast({ title: "خطأ", description: "فشل إرسال الرسالة", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  const companyName = (conv: Conversation) =>
    typeof conv.companyId === "object" ? conv.companyId?.name : "شركة سياحية";

  const companyLogo = (conv: Conversation) =>
    typeof conv.companyId === "object" ? conv.companyId?.logo : "";

  return (
    <div className="min-h-screen flex flex-col bg-background font-cairo" dir="rtl">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-600" />
            رسائل شركات السياحة
          </h1>
          <p className="text-sm text-muted-foreground font-bold mt-1">
            تواصل مع الشركات بخصوص طلبات رحلاتك المخصصة
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-220px)] min-h-[480px] bg-card border border-border rounded-3xl overflow-hidden shadow-lg">
          {/* Conversation list */}
          <div className="md:col-span-1 border-l border-border flex flex-col bg-muted/20">
            <div className="p-4 border-b border-border font-black text-sm">المحادثات</div>
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm font-bold">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  لا توجد محادثات بعد. أرسل طلب رحلة لشركة سياحية لبدء المحادثة.
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv._id}
                    type="button"
                    onClick={() => {
                      setActiveConversation(conv);
                      navigate(`/company-messages?conv=${conv._id}`, { replace: true });
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 text-right hover:bg-muted/60 transition-colors border-b border-border/50",
                      activeConversation?._id === conv._id && "bg-indigo-50 dark:bg-indigo-950/30"
                    )}
                  >
                    <Avatar className="w-11 h-11 shrink-0">
                      <AvatarImage src={companyLogo(conv)} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700">
                        <Building2 className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-sm truncate">{companyName(conv)}</span>
                        {conv.unreadCount > 0 && (
                          <Badge className="bg-indigo-600 text-white text-[10px] shrink-0">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.lastMessage || "بدء المحادثة"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Chat panel */}
          <div className="md:col-span-2 flex flex-col">
            {!activeConversation ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground font-bold text-sm">
                اختر محادثة للبدء
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-border flex items-center gap-3 bg-card">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={companyLogo(activeConversation)} />
                    <AvatarFallback>
                      <Building2 className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-black">{companyName(activeConversation)}</p>
                    <p className="text-xs text-muted-foreground">شركة سياحية</p>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  {messagesLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const isMine = msg.senderType === "user";
                        return (
                          <div
                            key={msg._id}
                            className={cn("flex", isMine ? "justify-start" : "justify-end")}
                          >
                            <div
                              className={cn(
                                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-medium whitespace-pre-wrap",
                                isMine
                                  ? "bg-indigo-600 text-white rounded-br-md"
                                  : "bg-muted text-foreground rounded-bl-md"
                              )}
                            >
                              {msg.content}
                              <div
                                className={cn(
                                  "flex items-center gap-1 mt-1 text-[10px] opacity-70",
                                  isMine ? "justify-start" : "justify-end"
                                )}
                              >
                                {format(new Date(msg.createdAt), "HH:mm", { locale: ar })}
                                {isMine && <CheckCheck className="w-3 h-3" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={scrollRef} />
                    </div>
                  )}
                </ScrollArea>

                <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="اكتب رسالتك..."
                    className="flex-1 rounded-xl font-bold"
                    disabled={sending}
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CompanyMessages;
