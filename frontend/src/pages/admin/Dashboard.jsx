import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import {
    DollarSign,
    Users,
    BookOpen,
    ShoppingCart,
    TrendingUp,
    Clock,
    Award,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
    const { accessToken } = useAuthStore();
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get(`${API}/admin/dashboard`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setStats(response.data);
            } catch (error) {
                console.error("Failed to fetch admin stats:", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (accessToken) fetchStats();
    }, [accessToken]);

    const statCards = [
        {
            icon: DollarSign,
            label: "Total Revenue",
            value: `₹{stats?.total_revenue?.toFixed(2) || "0.00"}`,
            trend: "+12%",
            trendUp: true,
            color: "from-green-500 to-emerald-400"
        },
        {
            icon: Users,
            label: "Total Students",
            value: stats?.total_users || 0,
            trend: "+8%",
            trendUp: true,
            color: "from-purple-600 to-purple-400"
        },
        {
            icon: BookOpen,
            label: "Total Courses",
            value: stats?.total_courses || 0,
            trend: "+2",
            trendUp: true,
            color: "from-cyan-500 to-cyan-400"
        },
        {
            icon: ShoppingCart,
            label: "Total Enrollments",
            value: stats?.total_enrollments || 0,
            trend: "+15%",
            trendUp: true,
            color: "from-pink-600 to-pink-400"
        }
    ];

    // Convert sales_by_date to chart format
    const chartData = Object.entries(stats?.sales_by_date || {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => ({
            date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            revenue: value
        }));

    return (
        <div className="space-y-6" data-testid="admin-dashboard">
            <div>
                <h1 className="font-outfit text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-slate-400">Overview of your platform metrics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-heavy rounded-xl p-5"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <span className={`flex items-center text-sm font-medium ${
                                stat.trendUp ? "text-green-400" : "text-red-400"
                            }`}>
                                {stat.trendUp ? (
                                    <ArrowUpRight className="w-4 h-4 mr-1" />
                                ) : (
                                    <ArrowDownRight className="w-4 h-4 mr-1" />
                                )}
                                {stat.trend}
                            </span>
                        </div>
                        <p className="font-outfit text-2xl font-bold text-white">
                            {isLoading ? <Skeleton className="h-8 w-24" /> : stat.value}
                        </p>
                        <p className="text-sm text-slate-500">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 glass-heavy rounded-xl p-6">
                    <h2 className="font-outfit text-lg font-semibold text-white mb-4">
                        Revenue Overview
                    </h2>
                    <div className="h-80">
                        {isLoading ? (
                            <Skeleton className="h-full w-full" />
                        ) : chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                                    <YAxis stroke="#64748B" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#1E293B",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: "8px"
                                        }}
                                        labelStyle={{ color: "#F8FAFC" }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#8B5CF6"
                                        strokeWidth={2}
                                        fill="url(#revenueGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500">
                                No sales data available
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-4">
                    <div className="glass-heavy rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Pending Withdrawals</p>
                                <p className="font-outfit text-xl font-bold text-white">
                                    {isLoading ? <Skeleton className="h-7 w-16" /> : stats?.pending_withdrawals || 0}
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500">
                            Total: ₹{stats?.pending_withdrawal_amount?.toFixed(2) || "0.00"}
                        </p>
                    </div>

                    <div className="glass-heavy rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Active Users (7d)</p>
                                <p className="font-outfit text-xl font-bold text-white">
                                    {isLoading ? <Skeleton className="h-7 w-16" /> : stats?.active_users || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-heavy rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                                <Award className="w-5 h-5 text-pink-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Commissions</p>
                                <p className="font-outfit text-xl font-bold text-white">
                                    {isLoading ? <Skeleton className="h-7 w-20" /> : `₹{stats?.total_commissions?.toFixed(2) || "0.00"}`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="glass-heavy rounded-xl p-6">
                <h2 className="font-outfit text-lg font-semibold text-white mb-4">
                    Recent Orders
                </h2>
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-lg" />
                        ))}
                    </div>
                ) : stats?.recent_orders?.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full admin-table">
                            <thead>
                                <tr className="text-left text-sm text-slate-500">
                                    <th className="pb-3 font-medium">Order ID</th>
                                    <th className="pb-3 font-medium">User</th>
                                    <th className="pb-3 font-medium">Amount</th>
                                    <th className="pb-3 font-medium">Status</th>
                                    <th className="pb-3 font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recent_orders.map((order) => (
                                    <tr key={order.id} className="rounded-lg">
                                        <td className="py-3 px-4 rounded-l-lg text-white font-mono text-sm">
                                            #{order.txn_id?.slice(-8).toUpperCase()}
                                        </td>
                                        <td className="py-3 px-4 text-slate-400">
                                            {order.user_id?.slice(0, 8)}...
                                        </td>
                                        <td className="py-3 px-4 text-green-400 font-semibold">
                                            ₹{order.total?.toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 rounded-r-lg text-slate-500 text-sm">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        No recent orders
                    </div>
                )}
            </div>
        </div>
    );
}
