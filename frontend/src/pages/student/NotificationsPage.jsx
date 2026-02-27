import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
    Bell,
    Check,
    CheckCheck,
    Trash2,
    AlertCircle,
    Gift,
    BookOpen,
    DollarSign,
    MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function NotificationsPage() {
    const { accessToken } = useAuthStore();
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, [accessToken]);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get(`${API}/notifications`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setNotifications(response.data.notifications || []);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            toast.error("Failed to load notifications");
        } finally {
            setIsLoading(false);
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
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.post(`${API}/notifications/read-all`, null, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            toast.success("All notifications marked as read");
        } catch (error) {
            toast.error("Failed to mark all as read");
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await axios.delete(`${API}/notifications/${notificationId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setNotifications(notifications.filter(n => n.id !== notificationId));
            toast.success("Notification deleted");
        } catch (error) {
            toast.error("Failed to delete notification");
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case "enrollment":
                return <BookOpen className="w-5 h-5 text-green-400" />;
            case "payment":
                return <DollarSign className="w-5 h-5 text-cyan-400" />;
            case "referral":
                return <Gift className="w-5 h-5 text-purple-400" />;
            case "ticket":
                return <MessageSquare className="w-5 h-5 text-blue-400" />;
            case "warning":
                return <AlertCircle className="w-5 h-5 text-yellow-400" />;
            default:
                return <Bell className="w-5 h-5 text-purple-400" />;
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="space-y-6" data-testid="notifications-page">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-outfit text-2xl font-bold text-white">Notifications</h1>
                    <p className="text-slate-400">
                        {unreadCount > 0 
                            ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                            : "You're all caught up!"
                        }
                    </p>
                </div>

                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                        onClick={markAllAsRead}
                        data-testid="mark-all-read-btn"
                    >
                        <CheckCheck className="w-4 h-4 mr-2" />
                        Mark all as read
                    </Button>
                )}
            </div>

            <div className="glass-heavy rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="p-6 space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-lg" />
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="font-semibold text-white text-lg mb-2">No notifications</h3>
                        <p className="text-slate-400">
                            When you get notifications, they'll show up here
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {notifications.map((notification, index) => (
                            <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`p-5 hover:bg-white/5 transition-colors ${
                                    !notification.is_read ? "bg-purple-500/5" : ""
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="font-semibold text-white">
                                                    {notification.title}
                                                </h3>
                                                <p className="text-slate-400 mt-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-sm text-slate-500 mt-2">
                                                    {new Date(notification.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!notification.is_read && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                                                        onClick={() => markAsRead(notification.id)}
                                                        title="Mark as read"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                    onClick={() => deleteNotification(notification.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    {!notification.is_read && (
                                        <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-2" />
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
