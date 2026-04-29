import { Bell, Check, Loader2, ShieldCheck, Zap, ChevronRight, Heart, Bookmark, MessageCircle, UserPlus, Tag, MapPin, Bus, CreditCard, LayoutDashboard, ExternalLink, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications } from "@/hooks/use-notifications";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/clerk-react";

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} يوم${days > 1 ? "اً" : ""} مضت`;
  if (hours > 0) return `${hours} ساعة مضت`;
  if (minutes > 0) return `${minutes} دقيقة مضت`;
  return "الآن";
}

// Returns a label + icon + colour describing where the notification will navigate
function getDestinationMeta(notification: any) {
  const { type, metadata, tripId, actorId, message, link } = notification;

  if (link) return { label: "رابط مباشر", Icon: ExternalLink, color: "text-gray-500 bg-gray-100" };

  if (metadata?.action === 'seat_assignment')
    return { label: "مقعدك في الرحلة", Icon: Bus, color: "text-indigo-600 bg-indigo-50" };

  if (type === 'message' && metadata?.conversationId)
    return { label: "الرسائل", Icon: MessageCircle, color: "text-orange-600 bg-orange-50" };

  if (metadata?.type === 'trip_group' && metadata?.groupId)
    return { label: "مجموعة الرحلة", Icon: MessageCircle, color: "text-purple-600 bg-purple-50" };

  if (type === 'follow')
    return { label: "صفحة المتابع", Icon: UserPlus, color: "text-emerald-600 bg-emerald-50" };

  if (type === 'love')
    return { label: "صفحة الرحلة", Icon: Heart, color: "text-rose-600 bg-rose-50" };

  if (type === 'save')
    return { label: "صفحة الرحلة", Icon: Bookmark, color: "text-blue-600 bg-blue-50" };

  if (type === 'comment' || type === 'tag')
    return { label: "تعليقات الرحلة", Icon: MessageCircle, color: "text-violet-600 bg-violet-50" };

  if (type === 'system') {
    if (metadata?.bookingId && metadata?.tripId)
      return { label: "لوحة تحكم الشركة", Icon: LayoutDashboard, color: "text-slate-600 bg-slate-100" };
    if (metadata?.bookingId)
      return { label: "حجوزاتي", Icon: CreditCard, color: "text-emerald-700 bg-emerald-50" };
    if (metadata?.tripId)
      return { label: "اكتشف الرحلات", Icon: Compass, color: "text-gray-600 bg-gray-100" };
    return { label: "اكتشف", Icon: Compass, color: "text-gray-600 bg-gray-100" };
  }

  if (tripId)
    return { label: "صفحة الرحلة", Icon: MapPin, color: "text-orange-600 bg-orange-50" };

  return { label: "ملف المستخدم", Icon: UserPlus, color: "text-gray-500 bg-gray-100" };
}

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isStreaming } = useNotifications();
  const navigate = useNavigate();
  const { user } = useUser();

  const handleNotificationClick = async (notification: any) => {
    await markAsRead(notification.id);

    const { type, metadata, tripId, actorId, message, link } = notification;

    // ── 1. Direct link override ─────────────────────────────────────────
    if (link) {
      navigate(link);
      return;
    }

    // ── 2. Seat assignment → corporate trip transportation section ───────
    if (metadata?.action === 'seat_assignment' && metadata?.tripSlug) {
      navigate(`/corporate-trips/${metadata.tripSlug}#transportation`);
      setTimeout(() => {
        const el = document.getElementById('transportation');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
      return;
    }

    // ── 3. Direct messages ───────────────────────────────────────────────
    if (type === 'message' && metadata?.conversationId) {
      navigate(`/messages?conv=${metadata.conversationId}`);
      return;
    }

    // ── 4. Trip group chat ───────────────────────────────────────────────
    if (metadata?.type === 'trip_group' && metadata?.groupId) {
      navigate(`/trip-groups?id=${metadata.groupId}`);
      return;
    }

    // ── 5. Follow notification → follower's profile ──────────────────────
    if (type === 'follow' && actorId) {
      navigate(`/user/${actorId}`);
      return;
    }

    // ── 6. Love / Save → trip detail page ────────────────────────────────
    if ((type === 'love' || type === 'save') && tripId) {
      if (metadata?.tripSlug) {
        navigate(`/corporate-trips/${metadata.tripSlug}`);
      } else {
        navigate(`/trips/${tripId}`);
      }
      return;
    }

    // ── 7. Comment / Reply / Tag in a trip → trip detail comments section
    if ((type === 'comment' || type === 'tag') && tripId) {
      if (metadata?.tripSlug) {
        navigate(`/corporate-trips/${metadata.tripSlug}#comments`);
      } else {
        navigate(`/trips/${tripId}#comments`);
      }
      setTimeout(() => {
        const el = document.getElementById('comments');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
      return;
    }

    // ── 8. Booking notifications (Requests, Status Updates, Payments) ────
    // Differentiate between Company Owner (Dashboard) and Traveler (Profile)
    if (metadata?.bookingId) {
      const role = (user?.publicMetadata as any)?.role;
      if (role === 'company_owner' || role === 'admin') {
        navigate(`/company/dashboard?tab=bookings`);
      } else {
        navigate(`/user/${user?.id}?tab=bookings`);
      }
      return;
    }

    // ── 10. System: trip deleted / deactivated by admin → if has tripId navigate to discover
    if (type === 'system' && metadata?.tripId && !metadata?.bookingId) {
      // Trip was removed, navigate to discover instead
      navigate('/discover');
      return;
    }

    // ── 11. System: reporter was notified of action taken → no specific page, go to discover
    if (type === 'system' && !metadata?.tripId && !metadata?.bookingId) {
      navigate('/discover');
      return;
    }

    // ── 12. Generic trip fallback
    if (tripId) {
      if (metadata?.tripSlug) {
        navigate(`/corporate-trips/${metadata.tripSlug}`);
      } else {
        navigate(`/trips/${tripId}`);
      }
      return;
    }

    // ── 13. Final fallback → actor's profile
    if (actorId) {
      navigate(`/user/${actorId}`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative w-11 h-11 rounded-2xl bg-white/50 backdrop-blur-md border border-white/50 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group">
          <Bell className="h-5 w-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -left-1 flex h-5 min-w-[20px] rounded-full bg-rose-500 text-white text-[10px] font-black px-1.5 items-center justify-center border-2 border-white shadow-lg shadow-rose-200 animate-in zoom-in duration-300">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[calc(100vw-32px)] sm:w-[420px] p-0 border-0 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-indigo-900/10 overflow-hidden" align="end" sideOffset={10}>
        <div className="flex flex-col h-[520px] max-h-[80vh]">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-100/50 bg-white/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <Bell className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-gray-900 font-cairo">الإشعارات</h3>
                    <div className="flex items-center gap-1.5">
                       {isStreaming ? (
                          <div className="flex items-center gap-1.5">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[10px] font-bold text-gray-400">متصل الآن</span>
                          </div>
                       ) : (
                          <div className="flex items-center gap-1.5">
                             <Loader2 className="w-3 h-3 text-orange-500 animate-spin" />
                             <span className="text-[10px] font-bold text-gray-400">تحديث تلقائي...</span>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition-all gap-2"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <Check className="h-3.5 w-3.5" />
                تحديد الكل كمقروء
              </Button>
            </div>
          </div>

          {/* List */}
          <ScrollArea className="flex-1 px-4">
            <div className="py-4 space-y-2">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                  <div className="w-20 h-20 rounded-[2rem] bg-gray-50 flex items-center justify-center mb-6">
                     <Zap className="w-10 h-10 text-gray-200" />
                  </div>
                  <h4 className="text-lg font-black text-gray-900 mb-1">صندوق الإشعارات فارغ</h4>
                  <p className="text-sm font-bold text-gray-400 leading-relaxed">ستظهر هنا إشعارات الرحلات، الإعجابات، وتفاعل الأصدقاء.</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {notifications.map((notification, idx) => (
                    <motion.button
                      layout
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "w-full p-4 rounded-3xl flex items-start gap-4 text-right transition-all group relative",
                        notification.isRead 
                          ? "hover:bg-gray-50/50" 
                          : "bg-indigo-50/30 hover:bg-indigo-50/60"
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-12 w-12 rounded-[1.25rem] border-2 border-white shadow-md">
                          {notification.actorImage ? (
                            <AvatarImage src={notification.actorImage} className="object-cover" />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black">
                            {notification.actorName?.charAt(0) || "م"}
                          </AvatarFallback>
                        </Avatar>
                        {!notification.isRead && (
                          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-indigo-600 border-2 border-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pt-1">
                        <p className={cn(
                          "text-sm leading-relaxed mb-1.5",
                          notification.isRead ? "text-gray-600 font-bold" : "text-gray-900 font-black"
                        )}>
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                           <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                              {formatTimeAgo(notification.createdAt)}
                           </span>
                           {(() => {
                             const { label, Icon, color } = getDestinationMeta(notification);
                             return (
                               <span className={cn("inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200", color)}>
                                 <Icon className="w-2.5 h-2.5" />
                                 {label}
                               </span>
                             );
                           })()}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center self-center opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                         <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <ChevronRight className="w-4 h-4" />
                         </div>
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </ScrollArea>

          {/* Footer Info */}
          {!isStreaming && (
            <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-center gap-3">
               <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">يتم المزامنة بوضع الأمان</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;


