import { useState, useEffect, useRef } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
  User as UserIcon,
  Circle,
  Smile,
  Video,
  Trash2,
  Play,
  Square,
  Loader2,
  X,
  Pause,
  Clock,
  Music,
  Users
} from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import notificationSound from "@/assets/notifications.mp3";
import { 
  getDirectConversations, 
  getDirectMessages, 
  sendDirectMessage, 
  markDirectChatRead,
  searchChatUsers,
  startDirectChat,
  getCloudinarySignature,
  toggleMessageReaction
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import Pusher from "pusher-js";
import { createPusherClient } from "@/lib/pusher-client";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationContext } from "@/contexts/NotificationContext";

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'eu';

const DirectMessages = () => {
  const { user, isLoaded } = useUser();
  const { isSignedIn, getToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { setActiveConvId } = useNotificationContext();

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingConvs, setIsLoadingConvs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string; id: string }[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<{ [key: string]: number }>({});
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const pusherRef = useRef<Pusher | null>(null);

  const playSound = () => {
    try {
        const audio = new Audio(notificationSound);
        audio.play().catch(e => console.log("Sound play ignored by browser"));
    } catch (err) {}
  };

  // Parse conversation ID from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const convId = params.get('conv');
    if (convId && conversations.length > 0) {
      const found = conversations.find(c => c._id === convId);
      if (found && activeConversation?._id !== found._id) {
        setActiveConversation(found);
      }
    }
  }, [location.search, conversations, activeConversation?._id]);

  // Initial Load
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/auth");
      return;
    }
    loadConversations();
  }, [isLoaded, isSignedIn]);

  const loadConversations = async () => {
    try {
      setIsLoadingConvs(true);
      const token = await getToken();
      if (!token) return;
      const data = await getDirectConversations(token);
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setIsLoadingConvs(false);
    }
  };

  // Load Messages when active conversation ID changes
  useEffect(() => {
    if (activeConversation?._id) {
      loadMessages(activeConversation._id);
      markAsRead(activeConversation._id);
      setActiveConvId(activeConversation._id);
    } else {
      setActiveConvId(null);
    }

    return () => setActiveConvId(null);
  }, [activeConversation?._id]);

  const loadMessages = async (convId: string) => {
    try {
      setIsLoadingMessages(true);
      const token = await getToken();
      if (!token) return;
      const data = await getDirectMessages(convId, token);
      setMessages(data);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const markAsRead = async (convId: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      await markDirectChatRead(convId, token);
      
      // Update local state for unread counts
      setConversations(prev => prev.map(c => 
        c._id === convId ? { ...c, unreadCount: 0 } : c
      ));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // Real-time with Pusher
  useEffect(() => {
    if (!isSignedIn || !user?.id) return;

    if (!pusherRef.current) {
        pusherRef.current = createPusherClient(PUSHER_KEY, PUSHER_CLUSTER);
    }
    const client = pusherRef.current;
    if (!client) return;

    // Pulse channel for updating the conversation list
    const userChannel = client.subscribe(`user-direct-chats-${user.id}`);
    userChannel.bind('update-conversation', (data: any) => {
        setConversations(prev => {
            const index = prev.findIndex(c => c._id === data.conversation._id);
            if (index !== -1) {
                const updated = [...prev];
                // Move updated conversation to top
                const item = { 
                    ...updated[index], 
                    lastMessage: data.conversation.lastMessage,
                    lastMessageAt: data.conversation.lastMessageAt,
                    unreadCount: data.conversation.unreadCounts[user.id] || 0
                };
                updated.splice(index, 1);
                return [item, ...updated];
            } else {
                // New conversation? Reload list
                loadConversations();
                playSound();
                return prev;
            }
        });
        
        // Always play sound if message is not for active chat or window is hidden
        if (data.senderId !== user.id) {
            playSound();
        }
    });

    return () => {
        client.unsubscribe(`user-direct-chats-${user.id}`);
    };
  }, [isSignedIn, user?.id]);

  // Specific conversation channel
  useEffect(() => {
    if (!activeConversation) return;

    const client = pusherRef.current;
    if (!client) return;

    const convChannel = client.subscribe(`direct-conversation-${activeConversation._id}`);
    convChannel.bind('new-message', (data: any) => {
        if (data.message.senderId !== user?.id) {
            setMessages(prev => [...prev, data.message]);
            // Automatically mark as read if it's the active conversation
            markAsRead(activeConversation._id);
            playSound();
        }
    });

    convChannel.bind('messages-read', (data: any) => {
        if (data.readerId !== user?.id) {
            setMessages(prev => prev.map(m => ({ ...m, readBy: [...(m.readBy || []), data.readerId] })));
        }
    });

    convChannel.bind('message-reaction', (data: any) => {
        setMessages(prev => prev.map(m => 
            m._id === data.messageId ? { ...m, reactions: data.reactions } : m
        ));
    });

    return () => {
        client.unsubscribe(`direct-conversation-${activeConversation._id}`);
    };
  }, [activeConversation, user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages.length]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    const content = newMessage.trim();
    setNewMessage("");

    try {
        const token = await getToken();
        if (!token) return;
        const sentMsg = await sendDirectMessage(activeConversation._id, content, token);
        setMessages(prev => [...prev, sentMsg]);
    } catch (error) {
        toast({
            title: "خطأ",
            description: "فشل إرسال الرسالة",
            variant: "destructive"
        });
    }
  };

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
    }

    try {
        setIsSearching(true);
        const token = await getToken();
        if (!token) return;
        const data = await searchChatUsers(val, token);
        setSearchResults(data);
    } catch (error) {
        console.error("Search error:", error);
    }
  };

  const uploadFileToCloudinary = async (file: File | Blob, type: 'image' | 'video' | 'voice') => {
    try {
        const token = await getToken();
        if (!token) return null;
        const sigData = await getCloudinarySignature(token);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', sigData.apiKey);
        formData.append('timestamp', sigData.timestamp.toString());
        formData.append('signature', sigData.signature);
        formData.append('folder', sigData.folder);

        // For voice we use 'video' endpoint in Cloudinary as it handles audio well
        const resourceType = type === 'image' ? 'image' : 'video';
        
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${sigData.cloudName}/${resourceType}/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return null;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !activeConversation) return;

    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      return isImage || isVideo;
    });

    if (validFiles.length < files.length) {
      toast({
        title: "تنبيه",
        description: "تم تجاهل بعض الملفات غير المدعومة (الصور والفيديو فقط)",
        variant: "destructive"
      });
    }

    const newPending = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));

    setPendingFiles(prev => [...prev, ...newPending]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingFile = (id: string) => {
    setPendingFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter(f => f.id !== id);
    });
  };

  const sendPendingFiles = async () => {
    if (pendingFiles.length === 0 || !activeConversation) return;
    
    setIsUploading(true);
    const token = await getToken();
    if (!token) {
        setIsUploading(false);
        return;
    }

    try {
      for (const item of pendingFiles) {
        const isImage = item.file.type.startsWith('image/');
        const url = await uploadFileToCloudinary(item.file, isImage ? 'image' : 'video');
        if (url) {
          const sentMsg = await sendDirectMessage(
            activeConversation._id, 
            isImage ? "أرسل صورة" : "أرسل فيديو", 
            token, 
            isImage ? 'image' : 'video', 
            url
          );
          setMessages(prev => [...prev, sentMsg]);
        }
      }
      pendingFiles.forEach(f => URL.revokeObjectURL(f.preview));
      setPendingFiles([]);
    } catch (err) {
      toast({ title: "خطأ في الإرسال", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        const chunks: BlobPart[] = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            setAudioBlob(blob);
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingDuration(0);
        
        recordingIntervalRef.current = setInterval(() => {
            setRecordingDuration(prev => prev + 1);
        }, 1000);
    } catch (error) {
        console.error('Error starting recording:', error);
        toast({
            title: "خطأ",
            description: "لا يمكن الوصول للميكروفون",
            variant: "destructive"
        });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setAudioBlob(null);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
  };

  const sendVoiceNote = async () => {
    if (!audioBlob || !activeConversation) return;

    try {
        setIsUploading(true);
        const url = await uploadFileToCloudinary(audioBlob, 'voice');
        if (!url) throw new Error('Upload failed');

        const token = await getToken();
        if (!token) return;

        const sentMsg = await sendDirectMessage(
            activeConversation._id, 
            "رسالة صوتية", 
            token, 
            'voice', 
            url
        );
        setMessages(prev => [...prev, sentMsg]);
        setAudioBlob(null);
    } catch (error) {
        toast({
            title: "خطأ",
            description: "فشل إرسال الرسالة الصوتية",
            variant: "destructive"
        });
    } finally {
        setIsUploading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    try {
        const token = await getToken();
        if (!token) return;
        await toggleMessageReaction(messageId, emoji, token);
    } catch (error) {
        console.error("Failed to toggle reaction:", error);
    }
  };

  const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

  const startNewChat = async (targetUser: any) => {
    try {
        const token = await getToken();
        if (!token) return;
        const conv = await startDirectChat(targetUser.clerkId || targetUser.id, token);
        setSearchQuery("");
        setSearchResults([]);
        setIsSearching(false);
        setIsLoadingConvs(true);
        await loadConversations();
        setActiveConversation(conv);
        navigate(`/messages?conv=${conv._id}`, { replace: true });
    } catch (error) {
        toast({
            title: "خطأ",
            description: "فشل بدء المحادثة",
            variant: "destructive"
        });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-cairo" dir="rtl">
      <Header />
      
      <main className="container mx-auto px-0 md:px-4 py-0 md:py-8 h-[calc(100vh-80px)] md:h-[calc(100vh-120px)]">
         <div className="bg-white backdrop-blur-xl border-y md:border border-gray-100 rounded-none md:rounded-[2.5rem] shadow-2xl h-full overflow-hidden flex flex-col md:flex-row">
            
            {/* Sidebar: Conversations List */}
            <div className={cn(
          "w-full md:w-[380px] border-r border-gray-200 bg-white flex flex-col transition-all duration-300",
          activeConversation ? "hidden md:flex" : "flex"
        )}>
          {/* Tabs */}
          <div className="px-6 pt-6 grid grid-cols-2 gap-2">
            <Button 
                variant="ghost" 
                className="rounded-xl font-bold bg-indigo-50 text-indigo-700 h-11"
                onClick={() => navigate('/messages')}
            >
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>الخاص</span>
                </div>
            </Button>
            <Button 
                variant="ghost" 
                className="rounded-xl font-bold text-gray-500 hover:bg-gray-50 h-11"
                onClick={() => navigate('/trip-groups')}
            >
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>المجموعات</span>
                </div>
            </Button>
          </div>

          <div className="p-6 space-y-4">
                  <h2 className="text-2xl font-black text-gray-900">الرسائل</h2>
                  <div className="relative">
                     <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                     <Input 
                        placeholder="ابحث عن مستخدمين..." 
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pr-11 h-12 rounded-2xl bg-gray-50 border-0 focus-visible:ring-indigo-600/20" 
                     />
                  </div>
               </div>

               <div className="flex-1 overflow-hidden relative">
                  {isSearching ? (
                     <ScrollArea className="h-full">
                        <div className="p-4 space-y-2">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2">نتائج البحث</p>
                           {searchResults.map(u => (
                              <button 
                                key={u.clerkId} 
                                onClick={() => startNewChat(u)}
                                className="w-full p-4 rounded-2xl flex items-center gap-4 hover:bg-indigo-50 transition-all text-right"
                              >
                                 <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                    <AvatarImage src={u.imageUrl} />
                                    <AvatarFallback>{u.fullName?.charAt(0)}</AvatarFallback>
                                 </Avatar>
                                 <div className="flex-1">
                                    <h4 className="font-bold text-gray-900">{u.fullName}</h4>
                                    <p className="text-xs text-gray-400">@{u.username}</p>
                                 </div>
                              </button>
                           ))}
                           {searchResults.length === 0 && searchQuery.length > 2 && (
                              <p className="text-center py-10 text-gray-400 text-sm">لا يوجد نتائج</p>
                           )}
                        </div>
                     </ScrollArea>
                  ) : (
                     <ScrollArea className="h-full">
                        <div className="p-2 space-y-1">
                           {conversations.map(conv => (
                              <button 
                                key={conv._id}
                                onClick={() => {
                                    setActiveConversation(conv);
                                    navigate(`/messages?conv=${conv._id}`, { replace: true });
                                }}
                                className={cn(
                                    "w-full p-4 rounded-[1.8rem] flex items-center gap-4 transition-all group relative",
                                    activeConversation?._id === conv._id ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "hover:bg-gray-50 text-gray-900"
                                )}
                              >
                                 <div className="relative">
                                    <Avatar className="h-14 w-14 border-2 border-white/50">
                                        <AvatarImage src={conv.otherParticipant?.imageUrl} />
                                        <AvatarFallback>{conv.otherParticipant?.fullName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <Circle className={cn("absolute bottom-0 left-0 w-3.5 h-3.5 fill-emerald-400 text-white stroke-[3px]", conv.otherParticipant?.online ? "block" : "hidden")} />
                                 </div>
                                 <div className="flex-1 min-w-0 text-right">
                                    <div className="flex items-center justify-between mb-1">
                                       <h4 className="font-black truncate">{conv.otherParticipant?.fullName}</h4>
                                       <span className={cn("text-[10px] font-bold", activeConversation?._id === conv._id ? "text-indigo-100" : "text-gray-400")}>
                                          {conv.lastMessageAt ? format(new Date(conv.lastMessageAt), 'hh:mm a', { locale: ar }) : ''}
                                       </span>
                                    </div>
                                    <p className={cn("text-xs truncate font-medium", activeConversation?._id === conv._id ? "text-indigo-100" : "text-gray-500")}>
                                       {conv.lastMessage || 'ابدأ المحادثة الآن...'}
                                    </p>
                                 </div>
                                 {conv.unreadCount > 0 && activeConversation?._id !== conv._id && (
                                    <Badge className="absolute left-4 bg-orange-500 text-white border-0 h-6 w-6 flex items-center justify-center rounded-full p-0 text-[10px] font-black">
                                       {conv.unreadCount}
                                    </Badge>
                                 )}
                              </button>
                           ))}
                           {conversations.length === 0 && !isLoadingConvs && (
                              <div className="text-center py-20 px-6">
                                 <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-gray-200">
                                    <MessageSquare className="w-8 h-8" />
                                 </div>
                                 <p className="text-sm font-bold text-gray-400">لا توجد محادثات نشطة</p>
                                 <p className="text-[10px] text-gray-300 mt-1">ابدأ بالبحث عن أصدقاء للتواصل معهم</p>
                              </div>
                           )}
                        </div>
                     </ScrollArea>
                  )}
               </div>
            </div>

            {/* Main Chat Window */}
            <section className={cn(
               "flex-1 flex-col h-full bg-white relative",
               activeConversation ? "flex" : "hidden md:flex"
            )}>
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <header className="p-6 border-b border-gray-50 flex items-center justify-between bg-white/50 backdrop-blur-md z-10 sticky top-0">
                           <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12 border-2 border-indigo-100 shadow-sm">
                                 <AvatarImage src={activeConversation.otherParticipant?.imageUrl} />
                                 <AvatarFallback>{activeConversation.otherParticipant?.fullName?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                 <h3 className="text-lg font-black text-gray-900">{activeConversation.otherParticipant?.fullName}</h3>
                                 <div className="flex items-center gap-1.5">
                                    <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">نشط الآن</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                onClick={() => {
                                   setActiveConversation(null);
                                   navigate('/messages', { replace: true });
                                }}
                              >
                                 <X className="w-5 h-5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="rounded-2xl text-gray-400">
                                 <MoreVertical className="w-5 h-5" />
                              </Button>
                           </div>
                        </header>

                        {/* Messages Area */}
                        <ScrollArea className="flex-1 p-6">
                           <div className="space-y-6">
                              {messages.map((msg, i) => {
                                 const isMe = msg.senderId === user?.id;
                                 const showDate = i === 0 || format(new Date(messages[i-1].createdAt), 'yyyy-MM-dd') !== format(new Date(msg.createdAt), 'yyyy-MM-dd');

                                 return (
                                    <div key={msg._id} className="space-y-4">
                                       {showDate && (
                                          <div className="flex justify-center">
                                             <span className="bg-gray-50 text-gray-400 text-[10px] font-black px-4 py-1.5 rounded-full border border-gray-100">
                                                {format(new Date(msg.createdAt), 'd MMMM yyyy', { locale: ar })}
                                             </span>
                                          </div>
                                       )}
                                       <div className={cn("flex items-end gap-3", isMe ? "flex-row-reverse" : "flex-row")}>
                                          <Avatar className="h-8 w-8 shrink-0 mb-1 border border-white shadow-sm">
                                             <AvatarImage src={isMe ? user?.imageUrl : activeConversation.otherParticipant?.imageUrl} />
                                             <AvatarFallback>{isMe ? user?.fullName?.charAt(0) : activeConversation.otherParticipant?.fullName?.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <div className={cn(
                                             "max-w-[75%] space-y-1",
                                             isMe ? "items-end text-right" : "items-start text-right"
                                          )}>
                                             <div className="relative group/msg">
                                               <div className={cn(
                                                  "p-4 shadow-sm relative",
                                                  isMe 
                                                     ? "bg-indigo-600 text-white rounded-t-[1.5rem] rounded-bl-[1.5rem] shadow-indigo-100" 
                                                     : "bg-gray-100 text-gray-800 rounded-t-[1.5rem] rounded-br-[1.5rem]",
                                                  (msg.type === 'image' || msg.type === 'video') && "p-1 overflow-hidden"
                                               )}>
                                                  {msg.type === 'image' && (
                                                     <img 
                                                        src={msg.mediaUrl} 
                                                        alt="Sent image" 
                                                        className="rounded-[1.2rem] max-w-[200px] h-auto object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                        onClick={() => setSelectedImage(msg.mediaUrl)}
                                                     />
                                                  )}
                                                  {msg.type === 'video' && (
                                                     <video 
                                                        src={msg.mediaUrl} 
                                                        controls 
                                                        className="rounded-[1.2rem] max-w-full"
                                                     />
                                                  )}
                                                  {msg.type === 'voice' && (
                                                     <div className="flex items-center gap-4 py-3 px-2 min-w-[240px]">
                                                        <button 
                                                          onClick={() => {
                                                            const audio = audioRefs.current[msg._id];
                                                            if (currentlyPlaying === msg._id) {
                                                              audio.pause();
                                                              setCurrentlyPlaying(null);
                                                            } else {
                                                              Object.values(audioRefs.current).forEach(a => { if (a) a.pause(); });
                                                              audio.play();
                                                              setCurrentlyPlaying(msg._id);
                                                            }
                                                          }}
                                                          className={cn(
                                                            "w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all shadow-sm",
                                                            isMe ? "bg-white/20 hover:bg-white/30 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                                          )}
                                                        >
                                                           {currentlyPlaying === msg._id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                                                        </button>
                                                        
                                                        <div className="flex-1 space-y-2 pt-1">
                                                           <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden relative">
                                                              <div 
                                                                className={cn("h-full absolute left-0 top-0 transition-all duration-100", isMe ? "bg-white" : "bg-indigo-600")}
                                                                style={{ width: `${audioProgress[msg._id] || 0}%` }}
                                                              />
                                                           </div>
                                                           <div className="flex justify-between items-center text-[10px] font-black opacity-60">
                                                              <div className="flex items-center gap-1">
                                                                 <Music className="w-3 h-3" />
                                                                 <span>{currentlyPlaying === msg._id ? "جاري التشغيل..." : "رسالة صوتية"}</span>
                                                              </div>
                                                           </div>
                                                        </div>

                                                        <audio 
                                                          ref={el => { if (el) audioRefs.current[msg._id] = el; }}
                                                          src={msg.mediaUrl} 
                                                          className="hidden" 
                                                          onTimeUpdate={(e) => {
                                                            const audio = e.currentTarget;
                                                            setAudioProgress(prev => ({
                                                              ...prev,
                                                              [msg._id]: (audio.currentTime / audio.duration) * 100
                                                            }));
                                                          }}
                                                          onEnded={() => {
                                                            setCurrentlyPlaying(null);
                                                            setAudioProgress(prev => ({ ...prev, [msg._id]: 0 }));
                                                          }}
                                                        />
                                                     </div>
                                                  )}
                                                  {msg.type === 'text' && (
                                                     <p className="text-[15px] font-medium leading-[1.7] tracking-wide font-cairo">{msg.content}</p>
                                                  )}
                                               </div>

                                               {/* Existing Reactions - Outside bubble */}
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
                                                       className="bg-white border border-gray-100 rounded-full px-1.5 py-0.5 shadow-sm flex items-center gap-1 hover:bg-gray-50 transition-colors"
                                                     >
                                                       <span className="text-xs">{emoji}</span>
                                                       {count > 1 && <span className="text-[9px] font-black text-indigo-500">{count}</span>}
                                                     </button>
                                                   ))}
                                                 </div>
                                               )}

                                               {/* Reaction Picker on Hover */}
                                               <div className={cn(
                                                 "absolute -top-11 opacity-0 group-hover/msg:opacity-100 transition-opacity z-30 flex items-center gap-1 bg-white/90 backdrop-blur-md border border-gray-100 p-1 rounded-full shadow-xl",
                                                 isMe ? "right-0" : "left-0"
                                               )}>
                                                 {REACTION_EMOJIS.map(emoji => {
                                                   const hasReacted = msg.reactions?.some((r: any) => r.userId === user?.id && r.emoji === emoji);
                                                   return (
                                                     <button
                                                       key={emoji}
                                                       onClick={() => handleToggleReaction(msg._id, emoji)}
                                                       className={cn(
                                                         "w-7 h-7 flex items-center justify-center rounded-full hover:bg-indigo-50 transition-all hover:scale-125",
                                                         hasReacted && "bg-indigo-50"
                                                       )}
                                                     >
                                                       <span className="text-sm">{emoji}</span>
                                                     </button>
                                                   );
                                                 })}
                                               </div>
                                             </div>

                                             <div className={cn("flex items-center gap-1.5 px-1 mt-2", isMe ? "justify-end" : "justify-start")}>
                                                <span className="text-[9px] font-black text-gray-400">{format(new Date(msg.createdAt), 'hh:mm a')}</span>
                                                {isMe && (
                                                   msg.readBy?.includes(activeConversation.otherParticipant?.clerkId) 
                                                      ? <CheckCheck className="w-3 h-3 text-indigo-500" />
                                                      : <Check className="w-3 h-3 text-gray-300" />
                                                )}
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 );
                              })}
                              <div ref={scrollRef} className="h-0" />
                           </div>
                        </ScrollArea>

                        <footer className="p-6 bg-white border-t border-gray-50">
                           {/* Pending Files Preview */}
                           {pendingFiles.length > 0 && (
                              <div className="flex flex-wrap gap-3 mb-4 p-4 bg-gray-50/50 rounded-3xl border border-gray-100 overflow-x-auto custom-scrollbar">
                                 {pendingFiles.map(file => (
                                    <div key={file.id} className="relative group w-24 h-24 shrink-0">
                                       <img src={file.preview} alt="Preview" className="w-full h-full object-cover rounded-2xl border-2 border-white shadow-md group-hover:brightness-75 transition-all" />
                                       <button 
                                         onClick={() => removePendingFile(file.id)}
                                         className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors z-10"
                                       >
                                          <X className="w-4 h-4" />
                                       </button>
                                       <div className="absolute inset-0 rounded-2xl bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                          <Clock className="w-6 h-6 text-white" />
                                       </div>
                                    </div>
                                 ))}
                                 {isUploading && (
                                    <div className="w-24 h-24 flex flex-col items-center justify-center gap-2 bg-indigo-50 rounded-2xl border-2 border-indigo-100 animate-pulse text-indigo-600 shrink-0">
                                       <Loader2 className="w-8 h-8 animate-spin" />
                                       <span className="text-[9px] font-black uppercase tracking-widest">جاري الرفع...</span>
                                    </div>
                                 )}
                              </div>
                           )}
                           {isRecording ? (
                              <div className="bg-orange-50 p-4 rounded-[2rem] flex items-center justify-between border border-orange-100 animate-pulse">
                                 <div className="flex items-center gap-4">
                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                                    <span className="text-orange-600 font-bold tracking-widest">{formatDuration(recordingDuration)}</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <Button onClick={cancelRecording} variant="ghost" className="text-gray-400 hover:text-red-500 rounded-full px-4">
                                       <Trash2 className="w-5 h-5 ml-2" /> إلغاء
                                    </Button>
                                    <Button onClick={stopRecording} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 shadow-lg shadow-orange-100">
                                       <Square className="w-4 h-4 ml-2" /> إيقاف
                                    </Button>
                                 </div>
                              </div>
                           ) : audioBlob ? (
                              <div className="bg-indigo-50 p-4 rounded-[2rem] flex items-center justify-between border border-indigo-100">
                                  <div className="flex items-center gap-3">
                                     <button 
                                       onClick={() => {
                                          if (audioBlob) {
                                             const url = URL.createObjectURL(audioBlob);
                                             const audio = new Audio(url);
                                             audio.play();
                                             audio.onended = () => URL.revokeObjectURL(url);
                                          }
                                       }}
                                       className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm hover:scale-105 transition-transform"
                                     >
                                        <Play className="w-5 h-5 ml-0.5" />
                                     </button>
                                     <div>
                                        <p className="text-indigo-600 font-black text-xs">رسالة صوتية جاهزة</p>
                                        <p className="text-indigo-400 text-[10px] font-bold">يمكنك سماعها قبل الإرسال</p>
                                     </div>
                                  </div>
                                 <div className="flex items-center gap-2">
                                    <Button onClick={() => setAudioBlob(null)} variant="ghost" className="text-gray-400 rounded-full">
                                       <X className="w-5 h-5" />
                                    </Button>
                                     <Button disabled={isUploading} onClick={sendVoiceNote} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 shadow-lg shadow-indigo-100">
                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "إرسال"}
                                     </Button>
                                 </div>
                              </div>
                           ) : (
                              <form 
                                 onSubmit={pendingFiles.length > 0 ? (e) => { e.preventDefault(); sendPendingFiles(); } : handleSendMessage} 
                                 className="bg-gray-50 p-2 rounded-[2rem] flex items-center gap-2 border border-gray-100 focus-within:border-indigo-600/30 transition-all"
                              >
                                 <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={handleFileUpload}
                                 />
                                 <Button 
                                    type="button" 
                                    disabled={isUploading}
                                    onClick={startRecording}
                                    variant="ghost" 
                                    size="icon" 
                                    className="rounded-full text-indigo-600 hover:bg-white shrink-0"
                                 >
                                    <Mic className="w-5 h-5" />
                                 </Button>
                                 <Button 
                                    type="button" 
                                    disabled={isUploading}
                                    onClick={() => fileInputRef.current?.click()}
                                    variant="ghost" 
                                    size="icon" 
                                    className="rounded-full text-indigo-600 hover:bg-white shrink-0"
                                 >
                                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                                 </Button>
                                 <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                                    <PopoverTrigger asChild>
                                       <Button type="button" variant="ghost" size="icon" className="rounded-full text-indigo-600 hover:bg-white shrink-0">
                                          <Smile className="w-5 h-5" />
                                       </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden" align="start" side="top">
                                       <EmojiPicker 
                                          onEmojiClick={(emojiData) => {
                                             setNewMessage(prev => prev + emojiData.emoji);
                                             setShowEmojiPicker(false);
                                          }}
                                          theme={Theme.LIGHT}
                                          searchPlaceholder="ابحث عن إيموجي..."
                                          width={350}
                                          height={400}
                                       />
                                    </PopoverContent>
                                 </Popover>
                                 <Input 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="اكتب رسالتك هنا..." 
                                    disabled={isUploading}
                                    className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-[15px] font-medium h-12 placeholder:text-gray-400 font-cairo"
                                 />
                                  <Button 
                                    disabled={isUploading || (!newMessage.trim() && pendingFiles.length === 0)} 
                                    size="icon" 
                                    className="rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 shrink-0 h-12 w-12"
                                  >
                                     {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                  </Button>
                              </form>
                           )}
                        </footer>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                        <div className="w-32 h-32 bg-indigo-50 rounded-[3rem] flex items-center justify-center mb-8 relative">
                           <MessageSquare className="w-16 h-16 text-indigo-600" />
                           <div className="absolute -top-4 -right-4 w-12 h-12 bg-orange-500 rounded-full border-4 border-white animate-bounce" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-4">مرحباً بك في عالم تواصل رحلتى!</h2>
                        <p className="text-gray-400 max-w-md mx-auto leading-relaxed font-bold">
                           اختر محادثة من القائمة الجانبية أو ابحث عن رحالة جديد لبدء تبادل الخبرات ومشاركة المغامرات.
                        </p>
                    </div>
                )}
            </section>
            
            {/* WhatsApp-like Image Lightbox */}
            <AnimatePresence>
               {selectedImage && (
                  <motion.div 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     onClick={() => setSelectedImage(null)}
                     className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
                  >
                     <motion.button 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all shadow-2xl"
                        onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                     >
                        <X className="w-6 h-6" />
                     </motion.button>

                     <motion.img 
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        src={selectedImage} 
                        alt="Prevew" 
                        className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                        onClick={(e) => e.stopPropagation()}
                     />

                     <motion.div 
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: 0.2 }}
                       className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex items-center gap-4"
                     >
                     </motion.div>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>
      </main>

      <Footer />
    </div>
  );
};

export default DirectMessages;
