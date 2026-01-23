import { useNotificationContext as useContextHook } from "@/contexts/NotificationContext";
export type { NotificationItem } from "@/contexts/NotificationContext";

export function useNotifications() {
  return useContextHook();
}
