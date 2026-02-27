import { useState, useEffect } from "react";
import axios from "axios";
import { Bell, X, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function NotificationDropdown() {
    const { accessToken } = useAuthStore();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (accessToken) {
            fetchNotifications();
        }
    }, [accessToken, isOpen]);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get(`${API}/notifications`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const notifs = response.data.notifications || [];
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.is_read).length);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await axios.post(`${API}/notifications/${notificationId}/read`, null, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setNotifications(notifications.map(n =>
                n.id === notificationId ? { ...n, is_read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const deleteNotification = async (notificationId, e) => {
        e.stopPropagation();
        try {
            await axios.delete(`${API}/notifications/${notificationId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const notif = notifications.find(n => n.id === notificationId);
            setNotifications(notifications.filter(n => n.id !== notificationId));
            if (notif && !notif.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Failed to delete notification:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.post(`${API}/notifications/read-all`, null, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case "enrollment":
                return <Check className="w-4 h-4 text-green-400" />;
            case "payment":
                return <Check className="w-4 h-4 text-cyan-400" />;
            case "warning":
                return <AlertCircle className="w-4 h-4 text-yellow-400" />;
            default:
                return <Bell className="w-4 h-4 text-purple-400" />;
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-slate-400 hover:text-white hover:bg-white/5"
                    data-testid="notifications-btn"
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full text-xs text-white flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 glass-heavy border-white/10" align="end">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h3 className="font-semibold text-white">Notifications</h3>
                    {notifications.length > 0 && unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-xs text-purple-400 hover:text-purple-300"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <p className="text-slate-400 text-sm">No notifications</p>
                        </div>
                    ) : (
                        notifications.slice(0, 10).map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => !notification.is_read && markAsRead(notification.id)}
                                className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer relative group ${
                                    !notification.is_read ? "bg-purple-500/5" : ""
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white text-sm truncate">
                                            {notification.title}
                                        </p>
                                        <p className="text-slate-400 text-xs line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-slate-500 text-xs mt-1">
                                            {new Date(notification.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => deleteNotification(notification.id, e)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                                        title="Delete notification"
                                    >
                                        <X className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                                {!notification.is_read && (
                                    <div className="absolute top-4 right-4 w-2 h-2 bg-purple-500 rounded-full" />
                                )}
                            </div>
                        ))
                    )}
                </div>

                {notifications.length > 10 && (
                    <div className="p-3 text-center border-t border-white/10">
                        <a href="/notifications" className="text-sm text-purple-400 hover:text-purple-300">
                            View all notifications
                        </a>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
