import { useState, useEffect } from "react";
import { Link, useFetcher } from "react-router";
import { Bell } from "lucide-react";
import { useNotificationStore, type Notification } from "~/stores/notification.store";
import { useNotifications } from "~/hooks/useNotifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Button } from "~/components/ui/button";

interface NotificationBellProps {
  userType: "model" | "customer";
  initialCount?: number;
  initialNotifications?: Notification[];
}

// Format relative time
function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export function NotificationBell({
  userType,
  initialCount = 0,
  initialNotifications = []
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fetcher = useFetcher();

  // Use the store directly for reading state
  const { notifications, isConnected, isInitialized, getUnreadCount, markAsRead } = useNotificationStore();

  // Use the hook to handle SSE connection and initialization
  const { addNotifications } = useNotifications({
    userType,
    playSound: true,
  });

  // Initialize with server-loaded notifications only if not already initialized
  useEffect(() => {
    if (!isInitialized && initialNotifications.length > 0) {
      addNotifications(initialNotifications);
    }
  }, [initialNotifications, isInitialized, addNotifications]);

  const notificationsUrl = userType === "model" ? "/model/notifications" : "/customer/notifications";
  const detailBaseUrl = userType === "model" ? "/model/dating/detail" : "/customer/book-service/detail";

  // Calculate display count from store
  const unreadCount = getUnreadCount();
  const displayCount = isInitialized ? unreadCount : initialCount;

  // Get last 5 notifications for preview
  const recentNotifications = notifications.slice(0, 5);

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read in store
    markAsRead(notification.id);

    // Persist to database via API
    fetcher.submit(
      {
        notificationId: notification.id,
        userType
      },
      {
        method: "POST",
        action: "/api/notifications/mark-read"
      }
    );

    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full hover:bg-rose-50"
        >
          <Bell className="h-6 w-6 text-gray-600 hover:text-rose-500" />
          {displayCount > 0 && (
            <span className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[14px] font-medium text-white ${displayCount > 0 ? "animate-bounce" : ""}`}>
              {displayCount > 99 ? "99+" : displayCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-70 p-0" align="end">
        <div className="flex items-center justify-between p-3">
          <h4 className="font-medium text-sm">Notifications</h4>
          {isConnected && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {recentNotifications.length > 0 ? (
            <div className="divide-y">
              {recentNotifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={notification.data?.bookingId ? `${detailBaseUrl}/${notification.data.bookingId}` : notificationsUrl}
                  className={`block p-3 hover:bg-gray-50 transition-colors ${notification.isRead ? "bg-gray-50/50" : "bg-white"
                    }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${notification.isRead ? "bg-gray-300" : "bg-rose-500"
                      }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${notification.isRead ? "text-gray-600" : "text-gray-900"
                        }`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <Bell className="h-10 w-10 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No notifications yet</p>
            </div>
          )}
        </div>
        <div className="p-2">
          <Link
            to={notificationsUrl}
            className="block w-full text-center text-sm text-rose-600 hover:text-rose-700 py-1"
            onClick={() => setIsOpen(false)}
          >
            See all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
