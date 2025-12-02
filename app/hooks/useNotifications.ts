import { useEffect, useCallback, useRef } from "react";
import { useNotificationStore, type Notification } from "~/stores/notification.store";

// Re-export the Notification type for convenience
export type { Notification } from "~/stores/notification.store";

interface UseNotificationsOptions {
  userType: "model" | "customer";
  onNewNotification?: (notification: Notification) => void;
  playSound?: boolean;
}

// Notification sound URL
const NOTIFICATION_SOUND_URL = "/sound/messeger.mp3";

export function useNotifications({
  userType,
  onNewNotification,
  playSound = true,
}: UseNotificationsOptions) {
  const {
    notifications,
    isConnected,
    isInitialized,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    setNotifications,
    setConnected,
    getUnreadCount,
  } = useNotificationStore();

  const eventSourceRef = useRef<EventSource | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isConnectedRef = useRef(false);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== "undefined" && playSound) {
      audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
      audioRef.current.volume = 0.5;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, [playSound]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (audioRef.current && playSound) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        // Auto-play might be blocked by browser
        console.log("Could not play notification sound:", err);
      });
    }
  }, [playSound]);

  // Connect to SSE - only once per user type
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Prevent multiple connections
    if (isConnectedRef.current) return;

    const sseUrl =
      userType === "model"
        ? "/api/notifications/model-sse"
        : "/api/notifications/customer-sse";

    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;
    isConnectedRef.current = true;

    eventSource.onopen = () => {
      setConnected(true);
      console.log("SSE connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Ignore heartbeat and connected messages
        if (data.type === "heartbeat" || data.type === "connected") {
          return;
        }

        // This is a real notification
        const notification: Notification = {
          id: data.id,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data,
          isRead: false,
          createdAt: data.createdAt || new Date().toISOString(),
        };

        addNotification(notification);

        // Play sound
        playNotificationSound();

        // Callback
        if (onNewNotification) {
          onNewNotification(notification);
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      setConnected(false);

      // Reconnect after a delay
      setTimeout(() => {
        if (eventSourceRef.current === eventSource) {
          eventSource.close();
          isConnectedRef.current = false;
          // The useEffect will reconnect
        }
      }, 5000);
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      isConnectedRef.current = false;
      setConnected(false);
    };
  }, [userType, onNewNotification, playNotificationSound, addNotification, setConnected]);

  // Add notifications from server (for initial load)
  const addNotifications = useCallback((newNotifications: Notification[]) => {
    setNotifications(newNotifications);
  }, [setNotifications]);

  const unreadCount = getUnreadCount();

  return {
    notifications,
    unreadCount,
    isConnected,
    isInitialized,
    markAsRead,
    markAllAsRead,
    clearAll,
    addNotifications,
  };
}
