import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
    ArrowLeft,
    User,
    Mail,
    Calendar,
    DollarSign,
    BookOpen,
    ShoppingCart,
    Users,
    TrendingUp,
    Award,
    Wallet,
    Ban,
    CheckCircle,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminUserPerformancePage() {
    const { userId } = useParams();
    const { accessToken } = useAuthStore();
    const [userData, setUserData] = useState(null);
    const [performance, setPerformance] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUserData();
    }, [userId, accessToken]);

    const fetchUserData = async () => {
        try {
            const [userRes, perfRes] = await Promise.all([
                axios.get(`${API}/admin/users/${userId}`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }),
                axios.get(`${API}/admin/users/${userId}/performance`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                })
            ]);
            setUserData(userRes.data);
            // Handle nested performance structure from API
            const perfData = perfRes.data;
            setPerformance({
                total_purchases: perfData.performance?.total_purchases || 0,
                total_spent: perfData.performance?.total_spent || 0,
                courses_enrolled: perfData.performance?.courses_enrolled || 0,
                course_progress: perfData.performance?.course_progress || [],
                referral_earnings: perfData.performance?.referral_stats?.earnings_history || [],
                total_referral_earnings: perfData.performance?.referral_stats?.total_earnings || 0,
                referred_users_count: perfData.performance?.referral_stats?.users_referred || 0,
                wallet_balance: perfData.performance?.wallet_balance || 0
            });
        } catch (error) {
            console.error("Failed to fetch user data:", error);
            toast.error("Failed to load user data");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
                <Skeleton className="h-96 rounded-xl" />
            </div>
        );
    }

    if (!userData || !performance) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-slate-400">User not found</p>
                <Link to="/admin/users">
                    <Button className="mt-4">Back to Users</Button>
                </Link>
            </div>
        );
    }

    const { user } = userData;
    const { 
        total_purchases, 
        total_spent, 
        courses_enrolled, 
        course_progress,
        referral_earnings,
        total_referral_earnings,
        referred_users_count
    } = performance;

    return (
        <div className="space-y-6" data-testid="admin-user-performance-page">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/admin/users">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div className="flex items-center gap-4">
                    <img
                        src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                        alt={user.first_name}
                        className="w-16 h-16 rounded-xl border-2 border-purple-500"
                    />
                    <div>
                        <h1 className="font-outfit text-2xl font-bold text-white">
                            {user.first_name} {user.last_name}
                        </h1>
                        <div className="flex items-center gap-3 text-slate-400">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                                user.role === "admin" ? "bg-purple-500/20 text-purple-400" : "bg-slate-700 text-slate-300"
                            }`}>
                                {user.role}
                            </span>
                            {user.is_banned ? (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">Banned</span>
                            ) : user.is_verified ? (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">Active</span>
                            ) : (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400">Unverified</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-heavy rounded-xl p-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Wallet Balance</p>
                            <p className="font-outfit text-2xl font-bold text-white">
                                ₹{user.wallet_balance?.toFixed(2) || "0.00"}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-heavy rounded-xl p-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Total Spent</p>
                            <p className="font-outfit text-2xl font-bold text-white">
                                ₹{total_spent?.toFixed(2) || "0.00"}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-heavy rounded-xl p-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-cyan-600/20 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Courses Enrolled</p>
                            <p className="font-outfit text-2xl font-bold text-white">
                                {courses_enrolled || 0}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-heavy rounded-xl p-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-yellow-600/20 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Referral Earnings</p>
                            <p className="font-outfit text-2xl font-bold text-white">
                                ${total_referral_earnings?.toFixed(2) || "0.00"}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Additional Stats */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="glass-medium rounded-xl p-6">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-purple-400" />
                        Purchase Stats
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Total Orders</span>
                            <span className="text-white font-medium">{total_purchases || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Total Spent</span>
                            <span className="text-green-400 font-medium">${total_spent?.toFixed(2) || "0.00"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Avg. Order Value</span>
                            <span className="text-white font-medium">
                                ${total_purchases > 0 ? (total_spent / total_purchases).toFixed(2) : "0.00"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="glass-medium rounded-xl p-6">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-cyan-400" />
                        Referral Stats
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Referred Users</span>
                            <span className="text-white font-medium">{referred_users_count || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Total Earnings</span>
                            <span className="text-green-400 font-medium">${total_referral_earnings?.toFixed(2) || "0.00"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Referral Code</span>
                            <span className="text-purple-400 font-mono font-medium">{user.referral_code}</span>
                        </div>
                    </div>
                </div>

                <div className="glass-medium rounded-xl p-6">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-400" />
                        Account Stats
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Points</span>
                            <span className="text-white font-medium">{user.points || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Badges</span>
                            <span className="text-white font-medium">{user.badges?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Joined</span>
                            <span className="text-white font-medium">
                                {new Date(user.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Progress */}
            {course_progress?.length > 0 && (
                <div className="glass-heavy rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="font-semibold text-white text-lg">Course Progress</h2>
                    </div>
                    <div className="divide-y divide-white/5">
                        {course_progress.map((course, index) => (
                            <div key={course.course_id || index} className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium text-white">{course.course_title}</h3>
                                    <span className="text-sm text-slate-400">
                                        {course.progress?.toFixed(0) || 0}%
                                    </span>
                                </div>
                                <Progress value={course.progress || 0} className="h-2" />
                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                    <span>Enrolled: {new Date(course.enrolled_at).toLocaleDateString()}</span>
                                    {course.is_completed && (
                                        <span className="flex items-center gap-1 text-green-400">
                                            <CheckCircle className="w-3 h-3" />
                                            Completed
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Referral Earnings History */}
            {referral_earnings?.length > 0 && (
                <div className="glass-heavy rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="font-semibold text-white text-lg">Referral Earnings History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-800/50">
                                <tr className="text-left text-sm text-slate-400">
                                    <th className="p-4 font-medium">Date</th>
                                    <th className="p-4 font-medium">Buyer</th>
                                    <th className="p-4 font-medium">Course</th>
                                    <th className="p-4 font-medium">Commission</th>
                                </tr>
                            </thead>
                            <tbody>
                                {referral_earnings.map((earning, index) => (
                                    <tr key={earning.id || index} className="border-t border-white/5">
                                        <td className="p-4 text-slate-400">
                                            {new Date(earning.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-slate-300">{earning.buyer_email || "N/A"}</td>
                                        <td className="p-4 text-white">{earning.course_title}</td>
                                        <td className="p-4 text-green-400 font-medium">
                                            +₹{earning.commission_amount?.toFixed(2) || "0.00"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
