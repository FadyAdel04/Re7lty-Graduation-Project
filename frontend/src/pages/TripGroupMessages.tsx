import { useState, useEffect, useRef } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Send, 
  Image as ImageIcon, 
  Mic, 
  MoreVertical, 
  CheckCheck, 
  Check,
  MessageSquare,
  Circle,
  Smile,
  Loader2,
  X,
  Calendar,
  Pin,
  ShieldCheck,
  Lock,
  Unlock,
  Users,
  ChevronRight,
  Video,
  Paperclip,
  Plus,
  Play
} from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  getTripGroups, 
  getTripGroupMessages, 
  getTripGroupParticipants,
  sendTripGroupMessage, 
  pinGroupMessage, 
  toggleGroupLock,
} from "@/lib/tripGroupApi";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { createPusherClient } from "@/lib/pusher-client";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TripCountdown } from "@/components/TripCountdown";

const TripGroupMessages = () => {
  const { user, isLoaded } = useUser();
  const { isSignedIn, getToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [groups, setGroups] = useState<any[]>([]);
  const [activeGroup, setActiveGroup] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const { setActiveConvId } = useNotificationContext();
  const [attachment, setAttachment] = useState<{ file: File; type: string; preview: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pusherRef = useRef<any>(null);

  // Initialize Pusher
  useEffect(() => {
    if (activeGroup) {
      const pusher = createPusherClient();
      if (!pusher) return;
      
      const channel = pusher.subscribe(`trip-group-${activeGroup._id}`);
      
      channel.bind('new-message', (data: { message: any }) => {
        setMessages(prev => {
          if (prev.find(m => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });
        
        // Update group last message in list
        setGroups(prev => prev.map(g => 
          g._id === activeGroup._id 
            ? { ...g, lastMessage: data.message.content || 'رسالة جديدة', lastMessageAt: data.message.createdAt } 
            : g
        ));
      });

      channel.bind('pinned-update', (data: { pinnedMessageId: string }) => {
         setActiveGroup((prev: any) => ({ ...prev, pinnedMessageId: data.pinnedMessageId }));
      });

      channel.bind('lock-update', (data: { isLocked: boolean }) => {
         setActiveGroup((prev: any) => ({ ...prev, isLocked: data.isLocked }));
      });

      channel.bind('typing', (data: { userId: string, userName: string, isTyping: boolean }) => {
         if (data.userId === user?.id) return;
         setTypingUsers(prev => {
            if (data.isTyping) {
               if (prev.includes(data.userName)) return prev;
               return [...prev, data.userName];
            } else {
               return prev.filter(name => name !== data.userName);
            }
         });
      });

      pusherRef.current = pusher;
      return () => {
        pusher.unsubscribe(`trip-group-${activeGroup._id}`);
      };
    }
  }, [activeGroup?._id]);

  // Fetch groups
  useEffect(() => {
    const fetchGroupsData = async () => {
      if (!isLoaded || !isSignedIn) return;
      setIsLoadingGroups(true);
      try {
        const token = await getToken();
        if (token) {
          const data = await getTripGroups(token);
          setGroups(data);
          
          const params = new URLSearchParams(location.search);
          const groupId = params.get('id');
          if (groupId) {
            const group = data.find((g: any) => g._id === groupId);
            if (group) setActiveGroup(group);
          }
        }
      } catch (error) {
        toast({ title: "خطأ", description: "فشل في تحميل المجموعات", variant: "destructive" });
      } finally {
        setIsLoadingGroups(false);
      }
    };
    fetchGroupsData();
  }, [isLoaded, isSignedIn]);

  // Fetch messages
  useEffect(() => {
    const fetchMessagesData = async () => {
      if (!activeGroup) return;
      setIsLoadingMessages(true);
      try {
        const token = await getToken();
        if (token) {
          const [msgs, parts] = await Promise.all([
            getTripGroupMessages(activeGroup._id, token),
            getTripGroupParticipants(activeGroup._id, token)
          ]);
          setMessages(msgs);
          setParticipants(parts);
          setActiveConvId(activeGroup._id);
          
          if (activeGroup.pinnedMessageId) {
             const pinned = msgs.find((m: any) => m._id === activeGroup.pinnedMessageId);
             setPinnedMessage(pinned);
          } else {
             setPinnedMessage(null);
          }
        }
      } catch (error) {
        toast({ title: "خطأ", description: "فشل في تحميل البيانات", variant: "destructive" });
      } finally {
        setIsLoadingMessages(false);
      }
    };
    fetchMessagesData();
    return () => setActiveConvId(null);
  }, [activeGroup?._id]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages.length]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const MAX_SIZE = 150 * 1024 * 1024; // 150MB
    if (file.size > MAX_SIZE) {
      toast({ title: "تحذير", description: "حجم الملف تجاوز 150MB. يرجى اختيار ملف أصغر.", variant: "destructive" });
      return;
    }

    let type = 'image';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'voice';
    else if (file.type === 'application/pdf') type = 'pdf';

    if (type === 'image') {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachment({ file, type, preview: reader.result as string });
      };
      reader.readAsDataURL(file);
    } else {
      setAttachment({ file, type, preview: URL.createObjectURL(file) });
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!newMessage.trim() && !attachment) || !activeGroup) return;

    const content = newMessage.trim();
    const currentAttachment = attachment;
    
    setNewMessage("");
    setAttachment(null);

    try {
      const token = await getToken();
      if (!token) return;

      if (currentAttachment) setIsUploading(true);

      // Use FormData for file uploads to avoid base64 buffer overflow
      const formData = new FormData();
      if (content) formData.append('content', content);
      if (currentAttachment) {
        formData.append('file', currentAttachment.file);
        formData.append('type', currentAttachment.type);
      }

      const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/trip-groups';
      const res = await fetch(`${API_BASE}/${activeGroup._id}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Server error ${res.status}`);
      }

      const sentMessage = await res.json();

      setMessages(prev => {
        if (prev.some(m => m._id === sentMessage._id)) return prev;
        return [...prev, sentMessage];
      });

      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      }, 100);

    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في إرسال الرسالة", variant: "destructive" });
      setNewMessage(content);
      setAttachment(currentAttachment);
    } finally {
      setIsUploading(false);
    }
  };

  const onEmojiClick = (emojiData: any) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const isAdmin = activeGroup && user && (activeGroup.companyId === user.publicMetadata?.companyId || activeGroup.companyOwnerId === user?.id);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-cairo" dir="rtl">
      <Header />
      
      <main className="container mx-auto px-0 sm:px-2 md:px-4 py-0 sm:py-4 md:py-8 h-[calc(100vh-5rem)] sm:h-[calc(100vh-5.5rem)] md:h-[calc(100vh-6rem)] min-h-0">
         <div className="bg-white backdrop-blur-xl border-y sm:border border-gray-100 rounded-none sm:rounded-2xl md:rounded-[2.5rem] shadow-xl sm:shadow-2xl h-full overflow-hidden flex flex-col md:flex-row min-h-0">
            
            {/* Sidebar */}
            <div className={cn(
              "w-full md:w-[340px] lg:w-[380px] border-r border-gray-200 bg-white flex flex-col transition-all duration-300 min-h-0 shrink-0",
              activeGroup ? "hidden md:flex" : "flex"
            )}>
               {/* Tabs */}
               <div className="px-4 sm:px-6 pt-4 sm:pt-6 grid grid-cols-2 gap-2 shrink-0">
                  <Button 
                     variant="ghost" 
                     className="rounded-xl font-bold text-gray-500 hover:bg-gray-50 h-11"
                     onClick={() => navigate('/messages')}
                  >
                     <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>الخاص</span>
                     </div>
                  </Button>
                  <Button 
                     variant="ghost" 
                     className="rounded-xl font-bold bg-indigo-50 text-indigo-700 h-11"
                     onClick={() => navigate('/trip-groups')}
                  >
                     <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>المجموعات</span>
                     </div>
                  </Button>
               </div>

               <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 shrink-0">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900">الرسائل</h2>
                  <div className="relative">
                     <Search className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                     <Input 
                        placeholder="بحث في المجموعات..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10 sm:pr-11 h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-gray-50 border-0 focus-visible:ring-indigo-600/20 text-sm sm:text-base" 
                     />
                  </div>
               </div>

<div className="flex-1 overflow-hidden relative">
  <ScrollArea className="h-full">
    <div className="p-2 space-y-1">
      {isLoadingGroups ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-gray-500 font-bold">جاري التحميل...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 px-6">
          <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-gray-200">
            <Users className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-gray-400">لا توجد مجموعات بعد</p>
        </div>
      ) : (
        groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase())).map(group => (
          <button
            key={group._id}
            onClick={() => {
              setActiveGroup(group);
              navigate(`/trip-groups?id=${group._id}`, { replace: true });
            }}
            className={cn(
              "w-full p-3 rounded-[1.5rem] flex items-center gap-3 transition-all group relative",
              activeGroup?._id === group._id ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "hover:bg-gray-50 text-gray-900"
            )}
          >
            <Avatar className="h-12 w-12 border-2 border-white/50 shrink-0">
              <AvatarImage src={group.tripImage} className="object-cover" />
              <AvatarFallback className={cn(
                "font-black text-base",
                activeGroup?._id === group._id ? "bg-white/20 text-white" : "bg-indigo-600 text-white"
              )}>
                {group.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-right min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h4 className="font-bold text-xs truncate">{group.name}</h4>
                <span className={cn("text-[9px] font-bold whitespace-nowrap ml-1", activeGroup?._id === group._id ? "text-indigo-100" : "text-gray-400")}>
                  {group.lastMessageAt ? format(new Date(group.lastMessageAt), 'hh:mm a', { locale: ar }) : ''}
                </span>
              </div>
              <p className={cn("text-[11px] truncate font-medium", activeGroup?._id === group._id ? "text-indigo-100" : "text-gray-500")}>
                {group.lastMessage || "ابدأ الدردشة الآن..."}
              </p>
            </div>
          </button>
        ))
      )}
    </div>
  </ScrollArea>
</div>
            </div>

            {/* Chat Window */}
            <section className={cn(
               "flex-1 flex flex-col h-full bg-white relative",
               activeGroup ? "flex" : "hidden md:flex items-center justify-center bg-[#F8FAFC]"
            )}>
               {activeGroup ? (
                  <>
                     <header className="p-4 sm:p-6 border-b border-gray-50 flex items-center justify-between gap-3 bg-white/50 backdrop-blur-md z-10 sticky top-0 shrink-0">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                           <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 rounded-xl shrink-0" onClick={() => {
                              setActiveGroup(null);
                              navigate('/trip-groups', { replace: true });
                           }}>
                              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 rotate-180" />
                           </Button>
                           <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-indigo-100 shadow-sm shrink-0">
                              <AvatarImage src={activeGroup.tripImage} className="object-cover" />
                              <AvatarFallback className="bg-indigo-600 text-white font-black text-sm sm:text-base">
                                 {activeGroup.name.charAt(0)}
                              </AvatarFallback>
                           </Avatar>
                           <div className="min-w-0 flex-1">
                              <h3 className="text-sm sm:text-base font-black text-gray-900 truncate">{activeGroup.name}</h3>
                              <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1 flex-wrap">
                                 <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <Calendar className="w-2.5 h-2.5 shrink-0" />
                                    <span>مجموعة رسمية</span>
                                 </div>
                                 {activeGroup.tripId?.startDate && (
                                    <TripCountdown startDate={activeGroup.tripId.startDate} />
                                 )}
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           {isAdmin && (
                              <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className={cn("rounded-2xl h-10 w-10", activeGroup.isLocked ? "text-rose-500 bg-rose-50" : "text-gray-400")}
                                 onClick={async () => {
                                    const token = await getToken();
                                    if (token) {
                                       const res = await toggleGroupLock(activeGroup._id, token);
                                       setActiveGroup((prev: any) => ({ ...prev, isLocked: res.isLocked }));
                                       toast({ title: res.isLocked ? "تم قفل المجموعة" : "تم فتح المجموعة" });
                                    }
                                 }}
                              >
                                 {activeGroup.isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                              </Button>
                           )}
                           <Sheet>
                              <SheetTrigger asChild>
                                 <Button variant="ghost" size="icon" className="rounded-2xl text-gray-400">
                                    <MoreVertical className="w-5 h-5" />
                                 </Button>
                              </SheetTrigger>
                              <SheetContent side="left" className="w-[300px] sm:w-[400px] font-cairo" dir="rtl">
                                 <SheetHeader>
                                    <SheetTitle className="text-right text-lg font-black">تفاصيل المجموعة</SheetTitle>
                                 </SheetHeader>
                                 <div className="py-8 space-y-10">
                                    <div className="flex flex-col items-center text-center space-y-6">
                                       <div className="relative">
                                          <Avatar className="w-32 h-32 rounded-[2rem] shadow-2xl border-4 border-indigo-50">
                                             <AvatarImage src={activeGroup.tripImage} className="object-cover" />
                                             <AvatarFallback className="bg-indigo-600 text-4xl text-white font-black">{activeGroup.name.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-2xl shadow-lg border border-indigo-50">
                                             <Users className="w-6 h-6 text-indigo-600" />
                                          </div>
                                       </div>
                                       <div>
                                          <h3 className="text-lg font-black text-gray-900 mb-1">{activeGroup.name}</h3>
                                          <p className="text-gray-500 font-bold text-sm">المجموعة الرسمية للرحلة</p>
                                       </div>
                                    </div>

                                    <div className="space-y-6 bg-gray-50/50 rounded-[2rem] p-6 border border-gray-100">
                                       <h4 className="font-black text-gray-900 flex items-center justify-between pb-2 border-b border-gray-200">
                                          <div className="flex items-center gap-2">
                                             <Users className="w-5 h-5 text-indigo-600" />
                                             <span>المشاركون</span>
                                          </div>
                                          <Badge className="bg-indigo-600 hover:bg-indigo-600 font-black px-3 rounded-full">{participants.length}</Badge>
                                       </h4>
                                       <ScrollArea className="h-[350px] pr-2">
                                          <div className="space-y-4">
                                             {participants.map((p: any) => {
                                                // Use displayName/displayImage from API (company from MongoDB for admin, user data otherwise)
                                                const displayName = p.displayName ?? p.fullName;
                                                const displayImage = p.displayImage ?? p.imageUrl;
                                                const isCompanyAdmin = !!p.isCompanyAdmin;
                                                return (
                                                <div key={p.clerkId} className="flex items-center gap-4 group">
                                                   <Avatar className="w-12 h-12 rounded-2xl border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                                                      <AvatarImage src={displayImage} />
                                                      <AvatarFallback className="bg-indigo-50 text-indigo-600 font-black">{displayName?.charAt(0)}</AvatarFallback>
                                                   </Avatar>
                                                   <div className="flex-1 text-right min-w-0">
                                                      <div className="flex items-center gap-2 justify-start flex-row-reverse">
                                                         <span className="font-black text-gray-900 truncate block">{displayName}</span>
                                                         {isCompanyAdmin && (
                                                            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-2 py-0 h-5 shrink-0">مسؤول</Badge>
                                                         )}
                                                      </div>
                                                      <p className="text-[10px] text-gray-400 font-bold">{isCompanyAdmin ? "" : `@${p.username}`}</p>
                                                   </div>
                                                </div>
                                             );})}
                                          </div>
                                       </ScrollArea>
                                    </div>

                                    <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-100">
                                       <h4 className="font-black text-sm mb-2">تعليمات المجموعة</h4>
                                       <p className="text-[10px] font-bold text-indigo-100/80 leading-relaxed">
                                          هذه هي المجموعة الرسمية للرحلة. برجاء الالتزام بالقواعد والاحترام المتبادل بين جميع المشاركين.
                                       </p>
                                    </div>
                                 </div>
                              </SheetContent>
                           </Sheet>
                        </div>
                     </header>

                     {/* Pinned Message */}
                     {pinnedMessage && (
                        <div className="bg-indigo-50/80 backdrop-blur-sm border-b border-indigo-100/50 px-6 py-3 flex items-center gap-3 animate-in slide-in-from-top duration-300">
                           <Pin className="w-4 h-4 text-indigo-600 rotate-45 shrink-0" />
                           <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600/60 mb-0.5">رسالة مثبتة</p>
                              <p className="text-sm font-bold text-indigo-900 truncate">{pinnedMessage.content}</p>
                           </div>
                        </div>
                     )}

                     <ScrollArea className="flex-1 min-h-0 p-4 sm:p-6 bg-gray-50/30">
                        <div className="space-y-6">
                           {messages.map((msg, i) => {
                              const isMe = msg.senderId === user?.id;
                              const isSystem = msg.type === 'system';
                              const showDate = i === 0 || format(new Date(messages[i-1].createdAt), 'yyyy-MM-dd') !== format(new Date(msg.createdAt), 'yyyy-MM-dd');

                              if (isSystem) {
                                 return (
                                    <div key={msg._id} className="flex justify-center my-4">
                                       <span className="bg-gray-200/50 backdrop-blur text-[10px] font-black text-gray-500 px-4 py-1.5 rounded-full border border-gray-100 uppercase tracking-widest">
                                          {msg.content}
                                       </span>
                                    </div>
                                 );
                              }

                              // Company admin: show company name & logo from group (same DB as dashboard settings)
                              const isCompanyAdminMessage = activeGroup.companyOwnerId && msg.senderId === activeGroup.companyOwnerId;
                              const displaySenderName = isCompanyAdminMessage ? (activeGroup.companyName ?? msg.senderName) : msg.senderName;
                              const displaySenderImage = isCompanyAdminMessage ? (activeGroup.companyLogo ?? msg.senderImage) : msg.senderImage;

                              return (
                                 <div key={msg._id} className="space-y-4">
                                    {showDate && (
                                       <div className="flex justify-center">
                                          <span className="bg-gray-100 text-gray-400 text-[10px] font-black px-4 py-1.5 rounded-full border border-gray-100">
                                             {format(new Date(msg.createdAt), 'd MMMM yyyy', { locale: ar })}
                                          </span>
                                       </div>
                                    )}
                                    <div className={cn("flex items-end gap-3", isMe ? "flex-row-reverse" : "flex-row")}>
                                       {!isMe && (
                                          <Avatar className="h-8 w-8 shrink-0 mb-1 border border-white shadow-sm">
                                             <AvatarImage src={displaySenderImage} />
                                             <AvatarFallback className="bg-indigo-100 text-indigo-600 font-bold text-xs">{displaySenderName?.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                       )}
                                       <div className={cn("max-w-[85%] sm:max-w-[75%] space-y-1", isMe ? "items-end text-right" : "items-start text-right")}>
                                          {!isMe && (
                                             <div className="flex items-center gap-2 flex-wrap mr-1">
                                                <span className="text-[10px] font-black text-gray-400">{displaySenderName}</span>
                                                {isCompanyAdminMessage && (
                                                   <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-2 py-0 h-5 shrink-0 gap-1">
                                                      <ShieldCheck className="w-3 h-3" />
                                                      مسؤول الرحلة
                                                   </Badge>
                                                )}
                                             </div>
                                          )}
                                          <div className={cn(
                                             "p-4 shadow-sm relative overflow-hidden",
                                             isMe 
                                                ? "bg-indigo-600 text-white rounded-t-[1.5rem] rounded-bl-[1.5rem] shadow-indigo-100" 
                                                : "bg-white text-gray-800 rounded-t-[1.5rem] rounded-br-[1.5rem] border border-gray-100"
                                          )}>
                                             {msg.type === 'image' && msg.mediaUrl && (
                                                <div className="mb-2 rounded-xl overflow-hidden border border-white/20">
                                                   <img src={msg.mediaUrl} alt="Sent image" className="w-full max-h-60 object-cover" />
                                                </div>
                                             )}
                                             {msg.type === 'video' && msg.mediaUrl && (
                                                <div className="mb-2 rounded-xl overflow-hidden border border-white/20 bg-black relative group">
                                                   <video src={msg.mediaUrl} className="w-full max-h-60" />
                                                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                                      <Button variant="ghost" size="icon" className="text-white bg-white/20 backdrop-blur-md rounded-full h-12 w-12" onClick={(e) => {
                                                         const video = e.currentTarget.parentElement?.previousElementSibling as HTMLVideoElement;
                                                         if (video.paused) video.play(); else video.pause();
                                                      }}>
                                                         <Play className="w-6 h-6 fill-current" />
                                                      </Button>
                                                   </div>
                                                </div>
                                             )}
                                             {msg.type === 'voice' && msg.mediaUrl && (
                                                <div className="mb-2 py-2">
                                                   <audio src={msg.mediaUrl} controls className="w-full h-8" />
                                                </div>
                                             )}
                                             {msg.content && (
                                                <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                             )}
                                             <div className={cn("mt-1.5 flex items-center gap-1 text-[9px] font-black opacity-60", isMe ? "justify-end" : "justify-start")}>
                                                <span>{format(new Date(msg.createdAt), 'hh:mm a', { locale: ar })}</span>
                                                {isMe && <CheckCheck className="w-3 h-3" />}
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              );
                           })}
                           <div ref={scrollRef} />
                        </div>
                     </ScrollArea>

                     <footer className="p-4 sm:p-6 bg-white border-t border-gray-100 shrink-0">
                        {attachment && (
                           <div className="mb-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-in slide-in-from-bottom duration-300 relative">
                              <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="absolute -top-2 -left-2 h-8 w-8 rounded-full bg-white shadow-md text-red-500 hover:text-red-700 hover:bg-red-50"
                                 onClick={() => setAttachment(null)}
                                 type="button"
                              >
                                 <X className="h-4 w-4" />
                              </Button>
                              <div className="flex items-center gap-4">
                                 {attachment.type === 'image' && (
                                    <img src={attachment.preview} className="h-20 w-20 object-cover rounded-xl border-2 border-white shadow-sm" alt="Preview" />
                                 )}
                                 {attachment.type === 'video' && (
                                    <div className="h-20 w-20 rounded-xl bg-black border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                                       <video src={attachment.preview} className="h-full w-full object-cover opacity-60" />
                                       <Video className="h-6 w-6 text-white absolute" />
                                    </div>
                                 )}
                                 {attachment.type === 'voice' && (
                                    <div className="h-20 w-20 rounded-xl bg-orange-100 border-2 border-white shadow-sm flex items-center justify-center">
                                       <Mic className="h-8 w-8 text-orange-600" />
                                    </div>
                                 )}
                                 <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-indigo-900 truncate">{attachment.file.name}</p>
                                    <p className="text-[10px] font-bold text-indigo-400 capitalize">{attachment.type}</p>
                                 </div>
                                 {isUploading && <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />}
                              </div>
                           </div>
                        )}
                        {activeGroup.isLocked && !isAdmin ? (
                           <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-center gap-3 text-gray-500 font-bold border-2 border-dashed">
                              <Lock className="w-5 h-5" />
                              <span>المجموعة مقفلة حالياً للمشاركين.</span>
                           </div>
                        ) : (
                           <form onSubmit={handleSendMessage} className="flex items-center gap-2 sm:gap-3">
                              <input 
                                 type="file" 
                                 ref={fileInputRef} 
                                 className="hidden" 
                                 accept="image/*,video/*,audio/*" 
                                 onChange={handleFileSelect} 
                              />
                              <div className="flex-1 relative flex items-center">
                                 <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                                    <PopoverTrigger asChild>
                                       <Button type="button" variant="ghost" size="icon" className="absolute right-1.5 sm:right-2 h-9 w-9 sm:h-10 sm:w-10 text-gray-400 hover:text-indigo-600 rounded-lg sm:rounded-xl">
                                          <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
                                       </Button>
                                    </PopoverTrigger>
                                    <PopoverContent side="top" align="start" className="p-0 border-none shadow-2xl rounded-2xl overflow-hidden mb-2 sm:mb-4 max-h-[70vh]">
                                       <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.LIGHT} lazyLoadEmojis height={320} />
                                    </PopoverContent>
                                 </Popover>
                                 <Input 
                                    placeholder="اكتب رسالتك..." 
                                    className="w-full h-12 sm:h-14 pr-11 sm:pr-14 pl-14 sm:pl-20 bg-gray-50 border-none rounded-xl sm:rounded-2xl text-sm sm:text-base focus-visible:ring-indigo-600 font-black"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                 />
                                 <div className="absolute left-1.5 sm:left-2 flex items-center gap-0.5 sm:gap-1">
                                    <Button 
                                       type="button" 
                                       variant="ghost" 
                                       size="icon" 
                                       className="h-9 w-9 sm:h-10 sm:w-10 text-gray-400 hover:text-indigo-600 rounded-lg sm:rounded-xl"
                                       onClick={() => fileInputRef.current?.click()}
                                    >
                                       <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </Button>
                                    <Button 
                                       type="button" 
                                       variant="ghost" 
                                       size="icon" 
                                       className="h-9 w-9 sm:h-10 sm:w-10 text-gray-400 hover:text-indigo-600 rounded-lg sm:rounded-xl"
                                       onClick={() => {
                                          if (fileInputRef.current) {
                                             fileInputRef.current.accept = "audio/*";
                                             fileInputRef.current.click();
                                             // Reset it later or keep it as generic attachment
                                          }
                                       }}
                                    >
                                       <Mic className="w-5 h-5" />
                                    </Button>
                                 </div>
                              </div>
                              <Button 
                                 type="submit" 
                                 disabled={!newMessage.trim() && !attachment || isUploading} 
                                 size="icon" 
                                 className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 shrink-0"
                              >
                                 {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                              </Button>
                           </form>
                        )}
                        {typingUsers.length > 0 && (
                           <p className="mt-2 text-[10px] font-black text-indigo-500 animate-pulse">
                              {typingUsers.join(', ')} {typingUsers.length > 1 ? 'يكتبون...' : 'يكتب الآن...'}
                           </p>
                        )}
                     </footer>
                  </>
               ) : (
                  <div className="text-center px-6 max-w-sm">
                     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="w-24 h-24 bg-white shadow-xl shadow-indigo-100/50 rounded-[2.5rem] flex items-center justify-center mx-auto text-indigo-600">
                           <Users className="w-12 h-12" />
                        </div>
                        <div>
                           <h3 className="text-2xl font-black text-gray-900 mb-3">اختر مجموعة للبدء</h3>
                           <p className="text-gray-500 font-medium">تواصل مع المشاركين الآخرين في الرحلة واحصل على التحديثات.</p>
                        </div>
                     </motion.div>
                  </div>
               )}
            </section>
         </div>
      </main>
    </div>
  );
};

export default TripGroupMessages;
