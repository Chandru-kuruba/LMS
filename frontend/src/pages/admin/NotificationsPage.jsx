import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
    Bell,
    Send,
    Users,
    User,
    Search,
    Calendar,
    Clock,
    CheckCircle,
    Plus,
    Trash2,
    Mail,
    Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminNotificationsPage() {
    const { accessToken } = useAuthStore();
    const [notifications, setNotifications] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [newNotification, setNewNotification] = useState({
        title: "",
        message: "",
        type: "announcement",
        send_email: true,
        audience: "all" // all, selected
    });

    useEffect(() => {
        fetchData();
    }, [accessToken]);

    const fetchData = async () => {
        try {
            const [notifRes, usersRes] = await Promise.all([
                axios.get(`${API}/admin/notifications`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }),
                axios.get(`${API}/admin/users?limit=500`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                })
            ]);
            setNotifications(notifRes.data.notifications || []);
            setUsers(usersRes.data.users || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("Failed to load data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendNotification = async () => {
        if (!newNotification.title.trim() || !newNotification.message.trim()) {
            toast.error("Please fill in title and message");
            return;
        }

        if (newNotification.audience === "selected" && selectedUsers.length === 0) {
            toast.error("Please select at least one user");
            return;
        }

        setIsSending(true);
        try {
            await axios.post(
                `${API}/admin/notifications/send`,
                {
                    ...newNotification,
                    user_ids: newNotification.audience === "selected" ? selectedUsers : null
                },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success("Notification sent successfully!");
            setShowCreateDialog(false);
            setNewNotification({
                title: "",
                message: "",
                type: "announcement",
                send_email: true,
                audience: "all"
            });
            setSelectedUsers([]);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to send notification");
        } finally {
            setIsSending(false);
        }
    };

    const handleDeleteNotification = async (notifId) => {
        if (!window.confirm("Delete this notification?")) return;
        
        try {
            await axios.delete(`${API}/admin/notifications/${notifId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            toast.success("Notification deleted");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const toggleUserSelection = (userId) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const selectAllUsers = () => {
        setSelectedUsers(users.map(u => u.id));
    };

    const deselectAllUsers = () => {
        setSelectedUsers([]);
    };

    const filteredUsers = users.filter(user => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            user.email?.toLowerCase().includes(query) ||
            user.first_name?.toLowerCase().includes(query) ||
            user.last_name?.toLowerCase().includes(query)
        );
    });

    const getTypeColor = (type) => {
        switch (type) {
            case "announcement": return "bg-purple-500/20 text-purple-400";
            case "promotion": return "bg-green-500/20 text-green-400";
            case "warning": return "bg-yellow-500/20 text-yellow-400";
            case "update": return "bg-blue-500/20 text-blue-400";
            default: return "bg-slate-500/20 text-slate-400";
        }
    };

    return (
        <div className="space-y-6" data-testid="admin-notifications-page">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-outfit text-2xl font-bold text-white">Notifications</h1>
                    <p className="text-slate-400">Send notifications and emails to users</p>
                </div>

                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                        <Button className="btn-primary">
                            <Plus className="w-4 h-4 mr-2" />
                            Send Notification
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-heavy border-purple-500/30 max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-white flex items-center gap-2">
                                <Bell className="w-5 h-5 text-purple-400" />
                                Create & Send Notification
                            </DialogTitle>
                        </DialogHeader>

                        <Tabs defaultValue="compose" className="mt-4">
                            <TabsList className="grid w-full grid-cols-2 glass-medium">
                                <TabsTrigger value="compose">Compose</TabsTrigger>
                                <TabsTrigger value="recipients">Recipients ({newNotification.audience === "all" ? "All Users" : selectedUsers.length})</TabsTrigger>
                            </TabsList>

                            <TabsContent value="compose" className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Notification Title *</Label>
                                    <Input
                                        value={newNotification.title}
                                        onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                                        placeholder="e.g., New Course Available!"
                                        className="input-neon"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-300">Message *</Label>
                                    <Textarea
                                        value={newNotification.message}
                                        onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                                        placeholder="Write your notification message here..."
                                        className="input-neon min-h-[120px]"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Type</Label>
                                        <Select 
                                            value={newNotification.type}
                                            onValueChange={(v) => setNewNotification({...newNotification, type: v})}
                                        >
                                            <SelectTrigger className="input-neon">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="announcement">Announcement</SelectItem>
                                                <SelectItem value="promotion">Promotion</SelectItem>
                                                <SelectItem value="update">Update</SelectItem>
                                                <SelectItem value="warning">Warning</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Audience</Label>
                                        <Select 
                                            value={newNotification.audience}
                                            onValueChange={(v) => setNewNotification({...newNotification, audience: v})}
                                        >
                                            <SelectTrigger className="input-neon">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Users</SelectItem>
                                                <SelectItem value="selected">Selected Users</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 glass-light rounded-lg">
                                    <Checkbox
                                        id="send_email"
                                        checked={newNotification.send_email}
                                        onCheckedChange={(checked) => setNewNotification({...newNotification, send_email: checked})}
                                    />
                                    <div>
                                        <Label htmlFor="send_email" className="text-white cursor-pointer">
                                            Also send email notification
                                        </Label>
                                        <p className="text-xs text-slate-500">Users will receive an email along with in-app notification</p>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="recipients" className="space-y-4 mt-4">
                                {newNotification.audience === "all" ? (
                                    <div className="text-center py-8 glass-light rounded-lg">
                                        <Users className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                                        <p className="text-white font-medium">All Users Selected</p>
                                        <p className="text-slate-400 text-sm">Notification will be sent to all {users.length} users</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <Input
                                                    placeholder="Search users..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="pl-10 input-neon"
                                                />
                                            </div>
                                            <Button variant="outline" size="sm" onClick={selectAllUsers}>Select All</Button>
                                            <Button variant="outline" size="sm" onClick={deselectAllUsers}>Clear</Button>
                                        </div>

                                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                                            {filteredUsers.map(user => (
                                                <div
                                                    key={user.id}
                                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                                        selectedUsers.includes(user.id) 
                                                            ? "bg-purple-500/20 border border-purple-500/50"
                                                            : "glass-light hover:bg-white/5"
                                                    }`}
                                                    onClick={() => toggleUserSelection(user.id)}
                                                >
                                                    <Checkbox
                                                        checked={selectedUsers.includes(user.id)}
                                                        onCheckedChange={() => toggleUserSelection(user.id)}
                                                    />
                                                    <img
                                                        src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                                                        alt={user.first_name}
                                                        className="w-8 h-8 rounded-full"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white text-sm font-medium truncate">
                                                            {user.first_name} {user.last_name}
                                                        </p>
                                                        <p className="text-slate-500 text-xs truncate">{user.email}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </TabsContent>
                        </Tabs>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                                Cancel
                            </Button>
                            <Button 
                                className="btn-primary" 
                                onClick={handleSendNotification}
                                disabled={isSending}
                            >
                                {isSending ? (
                                    <>Sending...</>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Notification
                                    </>
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-medium rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <Bell className="w-8 h-8 text-purple-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">{notifications.length}</p>
                            <p className="text-xs text-slate-400">Total Sent</p>
                        </div>
                    </div>
                </div>
                <div className="glass-medium rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-cyan-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">{users.length}</p>
                            <p className="text-xs text-slate-400">Total Users</p>
                        </div>
                    </div>
                </div>
                <div className="glass-medium rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <Mail className="w-8 h-8 text-green-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {notifications.filter(n => n.email_sent).length}
                            </p>
                            <p className="text-xs text-slate-400">Emails Sent</p>
                        </div>
                    </div>
                </div>
                <div className="glass-medium rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-yellow-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {notifications.filter(n => n.type === "announcement").length}
                            </p>
                            <p className="text-xs text-slate-400">Announcements</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification History */}
            <div className="glass-heavy rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                    <h2 className="font-semibold text-white text-lg">Notification History</h2>
                </div>

                {isLoading ? (
                    <div className="p-6 space-y-4">
                        {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No notifications sent yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {notifications.map((notif, index) => (
                            <motion.div
                                key={notif.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-4 hover:bg-white/5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-medium text-white">{notif.title}</h3>
                                            <span className={`px-2 py-0.5 rounded text-xs ${getTypeColor(notif.type)}`}>
                                                {notif.type}
                                            </span>
                                            {notif.email_sent && (
                                                <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> Email
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-400 line-clamp-2">{notif.message}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(notif.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {notif.recipient_count || "All"} recipients
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        onClick={() => handleDeleteNotification(notif.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
