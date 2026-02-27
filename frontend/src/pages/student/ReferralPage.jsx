import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
    Share2,
    Copy,
    DollarSign,
    Users,
    Clock,
    CheckCircle,
    ArrowUpRight,
    Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ReferralPage() {
    const { user, accessToken } = useAuthStore();
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [bankDetails, setBankDetails] = useState("");
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get(`${API}/referrals/stats`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setStats(response.data);
            } catch (error) {
                console.error("Failed to fetch referral stats:", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (accessToken) fetchStats();
    }, [accessToken]);

    const copyReferralCode = () => {
        navigator.clipboard.writeText(stats?.referral_code || user?.referral_code);
        toast.success("Referral code copied!");
    };

    const copyReferralLink = () => {
        const link = `${window.location.origin}/register?ref=${stats?.referral_code || user?.referral_code}`;
        navigator.clipboard.writeText(link);
        toast.success("Referral link copied!");
    };

    const handleWithdraw = async () => {
        if (!withdrawAmount || parseFloat(withdrawAmount) < 10) {
            toast.error("Minimum withdrawal amount is $10");
            return;
        }
        if (!bankDetails.trim()) {
            toast.error("Please enter bank details");
            return;
        }

        setIsWithdrawing(true);
        try {
            await axios.post(
                `${API}/referrals/withdraw`,
                {
                    amount: parseFloat(withdrawAmount),
                    bank_details: bankDetails
                },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success("Withdrawal request submitted!");
            // Refresh stats
            const response = await axios.get(`${API}/referrals/stats`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setStats(response.data);
            setWithdrawAmount("");
            setBankDetails("");
        } catch (error) {
            toast.error(error.response?.data?.detail || "Withdrawal failed");
        } finally {
            setIsWithdrawing(false);
        }
    };

    return (
        <div className="space-y-6" data-testid="referral-page">
            <div>
                <h1 className="font-outfit text-2xl font-bold text-white">Referral Dashboard</h1>
                <p className="text-slate-400">Earn 20% commission on every referral</p>
            </div>

            {/* Referral Code Card */}
            <div className="glass-heavy rounded-xl p-6 neon-border-cyan">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h2 className="font-outfit text-xl font-semibold text-white mb-2">
                            Your Referral Code
                        </h2>
                        <p className="text-slate-400 mb-4">
                            Share your code and earn 20% on every purchase
                        </p>
                        <div className="referral-code-box rounded-lg p-4 inline-block">
                            <p className="font-mono text-3xl font-bold gradient-text">
                                {isLoading ? <Skeleton className="h-9 w-32" /> : stats?.referral_code}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            className="btn-secondary"
                            onClick={copyReferralCode}
                            data-testid="copy-code-btn"
                        >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Code
                        </Button>
                        <Button
                            className="btn-primary"
                            onClick={copyReferralLink}
                            data-testid="copy-link-btn"
                        >
                            <Share2 className="w-4 h-4 mr-2" />
                            Copy Link
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        icon: DollarSign,
                        label: "Total Earnings",
                        value: `$${stats?.total_earnings?.toFixed(2) || "0.00"}`,
                        color: "from-green-500 to-emerald-400"
                    },
                    {
                        icon: Clock,
                        label: "Pending",
                        value: `$${stats?.pending_earnings?.toFixed(2) || "0.00"}`,
                        color: "from-yellow-500 to-orange-400"
                    },
                    {
                        icon: Wallet,
                        label: "Available",
                        value: `$${stats?.available_earnings?.toFixed(2) || "0.00"}`,
                        color: "from-purple-600 to-purple-400"
                    },
                    {
                        icon: Users,
                        label: "Referred Users",
                        value: stats?.referred_users_count || 0,
                        color: "from-cyan-500 to-cyan-400"
                    }
                ].map((stat, index) => (
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
                        <p className="font-outfit text-2xl font-bold text-white">
                            {isLoading ? <Skeleton className="h-8 w-20" /> : stat.value}
                        </p>
                        <p className="text-sm text-slate-500">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Withdraw Section */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="glass-medium rounded-xl p-6">
                    <h3 className="font-outfit text-lg font-semibold text-white mb-4">
                        Request Withdrawal
                    </h3>
                    <p className="text-slate-400 mb-4">
                        Minimum withdrawal: $10. Available balance: 
                        <span className="text-green-400 font-semibold ml-1">
                            ${stats?.available_earnings?.toFixed(2) || "0.00"}
                        </span>
                    </p>
                    <div className="space-y-4">
                        <div>
                            <Input
                                type="number"
                                placeholder="Amount to withdraw"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="input-neon"
                                min="10"
                                max={stats?.available_earnings || 0}
                                data-testid="withdraw-amount-input"
                            />
                        </div>
                        <div>
                            <Input
                                type="text"
                                placeholder="Bank account details"
                                value={bankDetails}
                                onChange={(e) => setBankDetails(e.target.value)}
                                className="input-neon"
                                data-testid="bank-details-input"
                            />
                        </div>
                        <Button
                            className="w-full btn-primary"
                            onClick={handleWithdraw}
                            disabled={isWithdrawing || !stats?.available_earnings}
                            data-testid="withdraw-btn"
                        >
                            {isWithdrawing ? "Processing..." : "Request Withdrawal"}
                        </Button>
                    </div>
                </div>

                <div className="glass-medium rounded-xl p-6">
                    <h3 className="font-outfit text-lg font-semibold text-white mb-4">
                        How It Works
                    </h3>
                    <div className="space-y-4">
                        {[
                            { step: 1, text: "Share your unique referral code with friends" },
                            { step: 2, text: "They sign up and make a purchase" },
                            { step: 3, text: "You earn 20% of their purchase amount" },
                            { step: 4, text: "Commission available after 30 days" }
                        ].map((item) => (
                            <div key={item.step} className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-purple-400 font-semibold text-sm">{item.step}</span>
                                </div>
                                <p className="text-slate-400">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Commission History */}
            <div className="glass-medium rounded-xl p-6">
                <h3 className="font-outfit text-lg font-semibold text-white mb-4">
                    Commission History
                </h3>
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-lg" />
                        ))}
                    </div>
                ) : stats?.commissions?.length === 0 ? (
                    <div className="text-center py-8">
                        <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-500">No commissions yet. Start sharing your referral code!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {stats?.commissions?.map((commission) => (
                            <div
                                key={commission.id}
                                className="flex items-center justify-between p-4 glass-light rounded-lg"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        commission.status === "available" ? "bg-green-500/20" :
                                        commission.status === "pending" ? "bg-yellow-500/20" :
                                        "bg-slate-700"
                                    }`}>
                                        {commission.status === "available" ? (
                                            <CheckCircle className="w-5 h-5 text-green-400" />
                                        ) : commission.status === "pending" ? (
                                            <Clock className="w-5 h-5 text-yellow-400" />
                                        ) : (
                                            <ArrowUpRight className="w-5 h-5 text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">
                                            ${commission.commission?.toFixed(2)} commission
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            From ${commission.amount?.toFixed(2)} purchase
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    commission.status === "available" ? "bg-green-500/20 text-green-400" :
                                    commission.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                                    "bg-slate-700 text-slate-400"
                                }`}>
                                    {commission.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
