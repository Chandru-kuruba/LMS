import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
    Users,
    Search,
    MoreVertical,
    Ban,
    Trash2,
    Eye,
    DollarSign,
    TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminUsersPage() {
    const { accessToken } = useAuthStore();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchUsers();
    }, [accessToken, search, roleFilter, page]);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API}/admin/users`, {
                params: {
                    search: search || undefined,
                    role: roleFilter || undefined,
                    page,
                    limit: 20
                },
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setUsers(response.data.users || []);
            setTotalPages(response.data.pages || 1);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBanUser = async (userId, isBanned) => {
        try {
            await axios.put(
                `${API}/admin/users/${userId}`,
                null,
                {
                    params: { is_banned: !isBanned },
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            toast.success(isBanned ? "User unbanned" : "User banned");
            fetchUsers();
        } catch (error) {
            toast.error("Failed to update user");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm("Are you sure you want to delete this user?")) return;
        
        try {
            await axios.delete(`${API}/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            toast.success("User deleted");
            fetchUsers();
        } catch (error) {
            toast.error("Failed to delete user");
        }
    };

    return (
        <div className="space-y-6" data-testid="admin-users-page">
            <div>
                <h1 className="font-outfit text-2xl font-bold text-white">User Management</h1>
                <p className="text-slate-400">Manage all platform users</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-12 input-neon"
                    />
                </div>
                <Select value={roleFilter || "all"} onValueChange={(v) => setRoleFilter(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-40 input-neon">
                        <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Users Table */}
            <div className="glass-heavy rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="p-6 space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-lg" />
                        ))}
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No users found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-800/50">
                                <tr className="text-left text-sm text-slate-400">
                                    <th className="p-4 font-medium">User</th>
                                    <th className="p-4 font-medium">Email</th>
                                    <th className="p-4 font-medium">Role</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Wallet</th>
                                    <th className="p-4 font-medium">Joined</th>
                                    <th className="p-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, index) => (
                                    <motion.tr
                                        key={user.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="border-t border-white/5 hover:bg-white/5 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                                                    alt={user.first_name}
                                                    className="w-10 h-10 rounded-full"
                                                />
                                                <div>
                                                    <p className="font-medium text-white">
                                                        {user.first_name} {user.last_name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{user.id.slice(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-400">{user.email}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                user.role === "admin"
                                                    ? "bg-purple-500/20 text-purple-400"
                                                    : "bg-slate-700 text-slate-300"
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {user.is_banned ? (
                                                <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">
                                                    Banned
                                                </span>
                                            ) : user.is_verified ? (
                                                <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                                                    Unverified
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-slate-400">
                                            ₹{user.wallet_balance?.toFixed(2) || "0.00"}
                                        </td>
                                        <td className="p-4 text-slate-500 text-sm">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-slate-400">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="glass-heavy border-white/10">
                                                    <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                                                        <Link to={`/admin/users/${user.id}/performance`}>
                                                            <TrendingUp className="w-4 h-4 mr-2" />
                                                            View Performance
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-slate-300 hover:text-white"
                                                        onClick={() => handleBanUser(user.id, user.is_banned)}
                                                    >
                                                        <Ban className="w-4 h-4 mr-2" />
                                                        {user.is_banned ? "Unban" : "Ban"} User
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-400 hover:text-red-300"
                                                        onClick={() => handleDeleteUser(user.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete User
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 p-4 border-t border-white/5">
                        {[...Array(totalPages)].map((_, i) => (
                            <Button
                                key={i}
                                variant={page === i + 1 ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPage(i + 1)}
                                className={page === i + 1 ? "bg-purple-600" : "border-slate-700 text-slate-400"}
                            >
                                {i + 1}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
