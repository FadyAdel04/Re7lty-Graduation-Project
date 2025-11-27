import { Bell, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications } from "@/hooks/use-notifications";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

  const handleNotificationClick = async (notification: any) => {
    await markAsRead(notification.id);
    if (notification.tripId) {
      navigate(`/trips/${notification.tripId}`);
    } else if (notification.actorId) {
      navigate(`/user/${notification.actorId}`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -left-1 h-5 min-w-[20px] rounded-full bg-destructive text-white text-xs font-bold px-1 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <p className="font-semibold">الإشعارات</p>
            <p className="text-xs text-muted-foreground">
              {isStreaming ? "متصل الآن" : "وضع غير متصل – يتم التحديث عند إعادة التحميل"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <Check className="h-4 w-4" />
            تعيين كمقروء
          </Button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              لا توجد إشعارات حالياً
            </div>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full px-4 py-3 flex items-center gap-3 text-right hover:bg-muted/50 transition-colors ${
                  notification.isRead ? "opacity-70" : ""
                }`}
              >
                <Avatar className="h-10 w-10">
                  {notification.actorImage ? (
                    <AvatarImage src={notification.actorImage} />
                  ) : null}
                  <AvatarFallback>
                    {notification.actorName?.charAt(0) || "م"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium leading-snug break-words">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(notification.createdAt)}
                  </p>
                </div>
                {!notification.isRead && (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
              </button>
            ))
          )}
        </div>
        {!isStreaming && (
          <div className="flex items-center justify-center gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            سيتم مزامنة الإشعارات عند التحديث اليدوي
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;


