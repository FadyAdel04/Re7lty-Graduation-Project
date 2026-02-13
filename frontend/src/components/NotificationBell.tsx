import { Bell, Check, Loader2, Settings, Trash2, ShieldCheck, Zap, ChevronRight } from "lucide-react";
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

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isStreaming } = useNotifications();
  const navigate = useNavigate();
  const { user } = useUser();

  const handleNotificationClick = async (notification: any) => {
    await markAsRead(notification.id);
    
    // Check if it's a seat assignment notification
    if (notification.metadata?.action === 'seat_assignment' && notification.metadata?.tripSlug) {
      navigate(`/corporate-trips/${notification.metadata.tripSlug}#transportation`);
      // Force scroll to element if hash is present
      setTimeout(() => {
        const el = document.getElementById('transportation');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    // Check if it's a booking-related notification
    const isBooking = 
      notification.type === 'booking' || 
      notification.type === 'booking_status' ||
      notification.message.includes('حجز') || 
      notification.message.toLowerCase().includes('booking');

    if (isBooking && user?.id) {
       navigate(`/user/${user.id}?tab=bookings`);
       return;
    }

    if (notification.link) {
      navigate(notification.link);
    } else if (notification.tripId) {
      if (notification.metadata?.tripSlug) {
        navigate(`/corporate-trips/${notification.metadata.tripSlug}`);
      } else {
        navigate(`/trips/${notification.tripId}`);
      }
    } else if (notification.actorId) {
      navigate(`/user/${notification.actorId}`);
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
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-1">
                              <Loader2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity animate-spin" />
                              {formatTimeAgo(notification.createdAt)}
                           </span>

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


