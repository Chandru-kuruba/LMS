import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import {
    BookOpen,
    Play,
    Award,
    Clock,
    TrendingUp,
    Star,
    ChevronRight,
    Zap,
    Users,
    DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function StudentDashboard() {
    const { user, accessToken } = useAuthStore();
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [referralStats, setReferralStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [coursesRes, referralsRes] = await Promise.all([
                    axios.get(`${API}/enrolled-courses`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    }),
                    axios.get(`${API}/referrals/stats`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    })
                ]);
                setEnrolledCourses(coursesRes.data.courses || []);
                setReferralStats(referralsRes.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (accessToken) fetchData();
    }, [accessToken]);

    const stats = [
        {
            icon: BookOpen,
            label: "Enrolled Courses",
            value: enrolledCourses.length,
            color: "from-purple-600 to-purple-400"
        },
        {
            icon: Play,
            label: "In Progress",
            value: enrolledCourses.filter(c => c.enrollment?.progress_percentage > 0 && !c.enrollment?.is_completed).length,
            color: "from-cyan-500 to-cyan-400"
        },
        {
            icon: Award,
            label: "Completed",
            value: enrolledCourses.filter(c => c.enrollment?.is_completed).length,
            color: "from-green-500 to-green-400"
        },
        {
            icon: Star,
            label: "Points",
            value: user?.points || 0,
            color: "from-yellow-500 to-orange-400"
        }
    ];

    return (
        <div className="space-y-8" data-testid="student-dashboard">
            {/* Welcome Section */}
            <div className="glass-heavy rounded-2xl p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <img
                            src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                            alt="Avatar"
                            className="w-16 h-16 rounded-2xl border-2 border-purple-500"
                        />
                        <div>
                            <h1 className="font-outfit text-2xl lg:text-3xl font-bold text-white">
                                Welcome back, {user?.first_name}!
                            </h1>
                            <p className="text-slate-400">
                                Continue your learning journey
                            </p>
                        </div>
                    </div>
                    <Link to="/courses">
                        <Button className="btn-primary">
                            Browse Courses
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-medium rounded-xl p-5"
                    >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                            <stat.icon className="w-6 h-6 text-white" />
                        </div>
                        <p className="font-outfit text-2xl font-bold text-white stat-number">
                            {isLoading ? <Skeleton className="h-8 w-16" /> : stat.value}
                        </p>
                        <p className="text-sm text-slate-500">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Continue Learning */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="font-outfit text-xl font-bold text-white">
                            Continue Learning
                        </h2>
                        <Link to="/my-courses" className="text-purple-400 hover:text-purple-300 text-sm">
                            View All
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="glass-medium rounded-xl p-4">
                                    <div className="flex gap-4">
                                        <Skeleton className="w-32 h-24 rounded-lg" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-5 w-3/4" />
                                            <Skeleton className="h-4 w-1/2" />
                                            <Skeleton className="h-2 w-full" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : enrolledCourses.length === 0 ? (
                        <div className="glass-medium rounded-xl p-8 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                                <BookOpen className="w-8 h-8 text-slate-600" />
                            </div>
                            <h3 className="font-semibold text-white mb-2">No courses yet</h3>
                            <p className="text-slate-500 mb-4">Start your learning journey today!</p>
                            <Link to="/courses">
                                <Button className="btn-secondary">Browse Courses</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {enrolledCourses.slice(0, 3).map((course) => (
                                <Link
                                    key={course.id}
                                    to={`/learn/${course.id}`}
                                    className="block glass-medium rounded-xl p-4 hover:bg-slate-800/50 transition-colors group"
                                    data-testid={`continue-course-${course.id}`}
                                >
                                    <div className="flex gap-4">
                                        <img
                                            src={course.thumbnail_url || "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400"}
                                            alt={course.title}
                                            className="w-32 h-24 object-cover rounded-lg"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 rounded text-xs bg-purple-600/20 text-purple-400">
                                                    {course.category}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
                                                {course.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Progress
                                                    value={course.enrollment?.progress_percentage || 0}
                                                    className="flex-1 h-2"
                                                />
                                                <span className="text-sm text-slate-500">
                                                    {Math.round(course.enrollment?.progress_percentage || 0)}%
                                                </span>
                                            </div>
                                            {course.enrollment?.is_completed && (
                                                <span className="inline-flex items-center gap-1 mt-2 text-sm text-green-400">
                                                    <Award className="w-4 h-4" />
                                                    Completed
                                                </span>
                                            )}
                                        </div>
                                        <div className="hidden sm:flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                                                <Play className="w-5 h-5 text-purple-400 group-hover:text-white transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Referral Stats */}
                <div className="space-y-6">
                    <h2 className="font-outfit text-xl font-bold text-white">
                        Referral Earnings
                    </h2>

                    <div className="glass-heavy rounded-xl p-6 neon-border-cyan">
                        {isLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        ) : (
                            <>
                                <div className="text-center mb-6">
                                    <p className="text-slate-400 text-sm mb-1">Total Earnings</p>
                                    <p className="font-outfit text-4xl font-bold gradient-text">
                                        ${referralStats?.total_earnings?.toFixed(2) || "0.00"}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="glass-light rounded-lg p-3 text-center">
                                        <p className="text-lg font-bold text-yellow-400">
                                            ${referralStats?.pending_earnings?.toFixed(2) || "0.00"}
                                        </p>
                                        <p className="text-xs text-slate-500">Pending</p>
                                    </div>
                                    <div className="glass-light rounded-lg p-3 text-center">
                                        <p className="text-lg font-bold text-green-400">
                                            ${referralStats?.available_earnings?.toFixed(2) || "0.00"}
                                        </p>
                                        <p className="text-xs text-slate-500">Available</p>
                                    </div>
                                </div>

                                <div className="referral-code-box rounded-lg p-4 text-center mb-4">
                                    <p className="text-xs text-slate-500 mb-1">Your Referral Code</p>
                                    <p className="font-mono text-xl font-bold text-white">
                                        {referralStats?.referral_code || user?.referral_code}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Referred Users</span>
                                    <span className="text-white font-semibold flex items-center gap-1">
                                        <Users className="w-4 h-4 text-purple-400" />
                                        {referralStats?.referred_users_count || 0}
                                    </span>
                                </div>

                                <Link to="/referrals" className="block mt-4">
                                    <Button className="w-full btn-secondary">
                                        View Details
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="glass-medium rounded-xl p-4">
                        <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <Link
                                to="/tickets"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-blue-400" />
                                </div>
                                <span className="text-slate-300">Support Tickets</span>
                            </Link>
                            <Link
                                to="/orders"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-green-400" />
                                </div>
                                <span className="text-slate-300">Order History</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
