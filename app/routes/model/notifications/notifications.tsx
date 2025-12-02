import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useFetcher, type LoaderFunction } from "react-router";
import {
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  CreditCard,
  MapPin,
  MessageCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { requireModelSession } from "~/services/model-auth.server";
import {
  getModelNotifications,
  getModelUnreadCount,
  markAllModelNotificationsAsRead,
} from "~/services/notification.server";
import { useNotificationStore, type Notification } from "~/stores/notification.store";
import { useNotifications } from "~/hooks/useNotifications";

interface LoaderReturn {
  notifications: Notification[];
  unreadCount: number;
}

interface PageProps {
  loaderData: LoaderReturn;
}

export const loader: LoaderFunction = async ({ request }) => {
  const modelId = await requireModelSession(request);

  const notifications = await getModelNotifications(modelId);
  const unreadCount = await getModelUnreadCount(modelId);

  return {
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data as Record<string, any>,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
  };
};

export async function action({ request }: { request: Request }) {
  const modelId = await requireModelSession(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "markAllRead") {
    await markAllModelNotificationsAsRead(modelId);
  }

  return { success: true };
}

// Get icon for notification type
function getNotificationIcon(type: string, isRead: boolean) {
  switch (type) {
    case "booking_created":
      return <Calendar className={`h-5 w-5 sm:h-6 sm:w-6 ${isRead ? "text-gray-400" : "text-blue-500"}`} />;
    case "booking_confirmed":
      return <CheckCircle2 className={`h-5 w-5 sm:h-6 sm:w-6 ${isRead ? "text-gray-400" : "text-emerald-500"}`} />;
    case "booking_rejected":
    case "booking_cancelled":
      return <XCircle className={`h-5 w-5 sm:h-6 sm:w-6 ${isRead ? "text-gray-400" : "text-red-500"}`} />;
    case "booking_checkin_customer":
      return <MapPin className={`h-5 w-5 sm:h-6 sm:w-6 ${isRead ? "text-gray-400" : "text-purple-500"}`} />;
    case "booking_completed":
    case "booking_confirmed_completion":
      return <Check className={`h-5 w-5 sm:h-6 sm:w-6 ${isRead ? "text-gray-400" : "text-emerald-500"}`} />;
    case "payment_released":
      return <CreditCard className={`h-5 w-5 sm:h-6 sm:w-6 ${isRead ? "text-gray-400" : "text-green-500"}`} />;
    case "booking_disputed":
      return <MessageCircle className={`h-5 w-5 sm:h-6 sm:w-6 ${isRead ? "text-gray-400" : "text-orange-500"}`} />;
    default:
      return <Bell className={`h-5 w-5 sm:h-6 sm:w-6 ${isRead ? "text-gray-400" : "text-gray-500"}`} />;
  }
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

export default function ModelNotifications({ loaderData }: PageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const { notifications: serverNotifications } = loaderData;

  // Use the store directly for state
  const {
    notifications,
    isConnected,
    isInitialized,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  // Use the hook to handle SSE connection
  const { addNotifications } = useNotifications({
    userType: "model",
    playSound: true,
  });

  // Initialize with server-loaded notifications only if not already initialized
  useEffect(() => {
    if (!isInitialized && serverNotifications.length > 0) {
      addNotifications(serverNotifications);
    }
  }, [serverNotifications, isInitialized, addNotifications]);

  const unreadCount = getUnreadCount();

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read in store
    markAsRead(notification.id);

    // Persist to database via API
    fetcher.submit(
      {
        notificationId: notification.id,
        userType: "model"
      },
      {
        method: "POST",
        action: "/api/notifications/mark-read"
      }
    );

    // Navigate based on notification type
    if (notification.data?.bookingId) {
      navigate(`/model/dating/detail/${notification.data.bookingId}`);
    }
  };

  const handleMarkAllAsRead = () => {
    // Mark all as read in store
    markAllAsRead();
  };

  return (
    <div className="min-h-screen bg-gray-50 sm:bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b px-4 sm:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-full">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <Badge className="bg-rose-500 text-white text-xs px-2 py-0.5">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                Stay updated with your bookings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isConnected && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Live
              </span>
            )}
            {unreadCount > 0 && (
              <form method="post">
                <input type="hidden" name="intent" value="markAllRead" />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm text-rose-600 border-rose-200 hover:bg-rose-50"
                  onClick={handleMarkAllAsRead}
                >
                  Mark all read
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto">
        {notifications.length > 0 ? (
          <div className="bg-white sm:bg-transparent">
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`
                  flex items-center gap-4 px-4 sm:px-8 py-4 sm:py-5 cursor-pointer
                  transition-colors hover:bg-gray-50
                  ${!notification.isRead ? "bg-rose-50/50 sm:bg-rose-50/30" : ""}
                  ${index !== notifications.length - 1 ? "border-b border-gray-100" : ""}
                `}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Unread indicator */}
                <div className="flex-shrink-0 w-2">
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-rose-500 rounded-full" />
                  )}
                </div>

                {/* Icon */}
                <div className={`
                  flex-shrink-0 p-2.5 sm:p-3 rounded-full
                  ${notification.isRead ? "bg-gray-100" : "bg-white shadow-sm"}
                `}>
                  {getNotificationIcon(notification.type, !!notification.isRead)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className={`
                    text-sm sm:text-base font-medium truncate
                    ${notification.isRead ? "text-gray-500" : "text-gray-900"}
                  `}>
                    {notification.title}
                  </h3>
                  <p className={`
                    text-xs sm:text-sm mt-0.5 line-clamp-2
                    ${notification.isRead ? "text-gray-400" : "text-gray-600"}
                  `}>
                    {notification.message}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>

                {/* Arrow */}
                <ChevronRight className={`
                  flex-shrink-0 h-5 w-5
                  ${notification.isRead ? "text-gray-300" : "text-gray-400"}
                `} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 px-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-gray-800 font-medium text-lg mb-2">No notifications</h3>
            <p className="text-gray-500 text-sm sm:text-base">
              You'll see booking updates and messages here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
