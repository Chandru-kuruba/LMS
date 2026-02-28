import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
    Users,
    Wallet,
    Copy,
    Share2,
    DollarSign,
    TrendingUp,
    Clock,
    CheckCircle,
    ExternalLink,
    ArrowDownToLine,
    XCircle,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ReferralsPage() {
    const { user, accessToken } = useAuthStore();
    const [stats, setStats] = useState(null);
    const [withdrawals, setWithdrawals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [bankDetails, setBankDetails] = useState("");

    useEffect(() => {
        fetchReferralStats();
        fetchWithdrawals();
    }, [accessToken]);

    const fetchReferralStats = async () => {
        try {
            const response = await axios.get(`${API}/referrals/stats`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setStats(response.data);
        } catch (error) {
            console.error("Failed to fetch referral stats:", error);
            toast.error("Failed to load referral data");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchWithdrawals = async () => {
        try {
            const response = await axios.get(`${API}/referrals/withdrawals`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setWithdrawals(response.data.withdrawals || []);
        } catch (error) {
            console.error("Failed to fetch withdrawals:", error);
        }
    };

    const handleWithdrawRequest = async () => {
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount < 500) {
            toast.error("Minimum withdrawal amount is ₹500");
            return;
        }
        if (amount > (stats?.wallet_balance || 0)) {
            toast.error("Insufficient wallet balance");
            return;
        }
        if (!bankDetails.trim()) {
            toast.error("Please provide bank/payment details");
            return;
        }

        setIsWithdrawing(true);
        try {
            await axios.post(
                `${API}/referrals/withdraw`,
                { amount, bank_details: bankDetails },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success("Withdrawal request submitted!");
            setShowWithdrawDialog(false);
            setWithdrawAmount("");
            setBankDetails("");
            fetchReferralStats();
            fetchWithdrawals();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to submit withdrawal request");
        } finally {
            setIsWithdrawing(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    const shareReferralLink = () => {
        const link = stats?.referral_link || `${window.location.origin}/register?ref=${user?.referral_code}`;
        if (navigator.share) {
            navigator.share({
                title: "Join LUMINA",
                text: "Sign up using my referral link and start learning!",
                url: link
            });
        } else {
            copyToClipboard(link);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
                </div>
            </div>
        );
    }

    const referralLink = stats?.referral_link || `${window.location.origin}/register?ref=${user?.referral_code}`;

    return (
        <div className="space-y-8" data-testid="referrals-page">
            {/* Header */}
            <div>
                <h1 className="font-outfit text-2xl font-bold text-white">Referral Program</h1>
                <p className="text-slate-400">Earn 20% lifetime commission on all purchases by your referrals</p>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-heavy rounded-xl p-6 neon-border-purple"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Wallet Balance</p>
                            <p className="font-outfit text-2xl font-bold text-white">
                                ₹{stats?.wallet_balance?.toFixed(2) || "0.00"}
                            </p>
                        </div>
                    </div>
                    {(stats?.wallet_balance || 0) >= 10 && (
                        <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
                            <DialogTrigger asChild>
                                <Button className="w-full btn-primary mt-2" data-testid="withdraw-btn">
                                    <ArrowDownToLine className="w-4 h-4 mr-2" />
                                    Withdraw
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="glass-heavy border-purple-500/30">
                                <DialogHeader>
                                    <DialogTitle className="text-white">Request Withdrawal</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Amount (INR)</Label>
                                        <Input
                                            type="number"
                                            min="500"
                                            max={stats?.wallet_balance || 0}
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                            placeholder="Minimum ₹500"
                                            className="input-neon"
                                        />
                                        <p className="text-xs text-slate-500">
                                            Available: ₹{stats?.wallet_balance?.toFixed(2) || "0.00"}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Bank/Payment Details</Label>
                                        <Textarea
                                            value={bankDetails}
                                            onChange={(e) => setBankDetails(e.target.value)}
                                            placeholder="Enter your bank account details or UPI ID for receiving payment"
                                            className="input-neon min-h-[100px]"
                                        />
                                    </div>
                                    <Button
                                        className="w-full btn-primary"
                                        onClick={handleWithdrawRequest}
                                        disabled={isWithdrawing}
                                    >
                                        {isWithdrawing ? "Submitting..." : "Submit Request"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-heavy rounded-xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Total Earnings</p>
                            <p className="font-outfit text-2xl font-bold text-white">
                                ${stats?.total_earnings?.toFixed(2) || "0.00"}
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
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-cyan-600/20 flex items-center justify-center">
                            <Users className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Referred Users</p>
                            <p className="font-outfit text-2xl font-bold text-white">
                                {stats?.referred_users_count || 0}
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
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-yellow-600/20 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Commission Rate</p>
                            <p className="font-outfit text-2xl font-bold text-white">20%</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Referral Link Section */}
            <div className="glass-heavy rounded-2xl p-6">
                <h2 className="font-outfit text-xl font-bold text-white mb-4">Your Referral Link</h2>
                <p className="text-slate-400 mb-4">Share this link with friends. They sign up, buy courses, and you earn 20% forever!</p>
                
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Input
                            value={referralLink}
                            readOnly
                            className="input-neon pr-12 font-mono text-sm"
                        />
                        <button
                            onClick={() => copyToClipboard(referralLink)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                            <Copy className="w-5 h-5" />
                        </button>
                    </div>
                    <Button className="btn-primary" onClick={shareReferralLink}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Link
                    </Button>
                </div>

                <div className="mt-4 p-4 glass-light rounded-xl">
                    <p className="text-sm text-slate-400">Your Referral Code</p>
                    <div className="flex items-center gap-4 mt-2">
                        <p className="font-mono text-2xl font-bold text-purple-400">{user?.referral_code}</p>
                        <button
                            onClick={() => copyToClipboard(user?.referral_code)}
                            className="text-slate-400 hover:text-white"
                        >
                            <Copy className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* How It Works */}
            <div className="glass-medium rounded-2xl p-6">
                <h2 className="font-outfit text-xl font-bold text-white mb-6">How It Works</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-600/20 flex items-center justify-center">
                            <Share2 className="w-8 h-8 text-purple-400" />
                        </div>
                        <h3 className="font-semibold text-white mb-2">1. Share Your Link</h3>
                        <p className="text-sm text-slate-400">Share your unique referral link with friends, family, or on social media</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-600/20 flex items-center justify-center">
                            <Users className="w-8 h-8 text-cyan-400" />
                        </div>
                        <h3 className="font-semibold text-white mb-2">2. They Sign Up</h3>
                        <p className="text-sm text-slate-400">When someone signs up using your link, they're linked to you permanently</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-600/20 flex items-center justify-center">
                            <DollarSign className="w-8 h-8 text-green-400" />
                        </div>
                        <h3 className="font-semibold text-white mb-2">3. Earn Forever</h3>
                        <p className="text-sm text-slate-400">Earn 20% commission on ALL their future purchases - lifetime!</p>
                    </div>
                </div>
            </div>

            {/* Earnings History */}
            <div className="glass-heavy rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                    <h2 className="font-outfit text-xl font-bold text-white">Earnings History</h2>
                </div>
                
                {stats?.earnings_history?.length === 0 ? (
                    <div className="p-12 text-center">
                        <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No earnings yet. Start sharing your referral link!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-800/50">
                                <tr className="text-left text-sm text-slate-400">
                                    <th className="p-4 font-medium">Date</th>
                                    <th className="p-4 font-medium">Buyer</th>
                                    <th className="p-4 font-medium">Course</th>
                                    <th className="p-4 font-medium">Course Price</th>
                                    <th className="p-4 font-medium">Commission (20%)</th>
                                    <th className="p-4 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.earnings_history?.map((earning, index) => (
                                    <motion.tr
                                        key={earning.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="border-t border-white/5 hover:bg-white/5"
                                    >
                                        <td className="p-4 text-slate-400">
                                            {new Date(earning.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-slate-300">
                                            {earning.buyer?.first_name} {earning.buyer?.last_name}
                                        </td>
                                        <td className="p-4 text-white">{earning.course_title}</td>
                                        <td className="p-4 text-slate-400">₹{earning.course_price?.toFixed(2)}</td>
                                        <td className="p-4 text-green-400 font-semibold">
                                            +₹{earning.commission_amount?.toFixed(2)}
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 flex items-center gap-1 w-fit">
                                                <CheckCircle className="w-3 h-3" />
                                                Available
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Referred Users */}
            {stats?.referred_users?.length > 0 && (
                <div className="glass-medium rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="font-outfit text-xl font-bold text-white">Your Referred Users</h2>
                    </div>
                    <div className="divide-y divide-white/5">
                        {stats.referred_users.map((referredUser, index) => (
                            <div key={referredUser.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${referredUser.id}`}
                                        alt={referredUser.first_name}
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div>
                                        <p className="text-white font-medium">
                                            {referredUser.first_name} {referredUser.last_name}
                                        </p>
                                        <p className="text-sm text-slate-500">{referredUser.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-400">Joined</p>
                                    <p className="text-slate-300">
                                        {new Date(referredUser.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Withdrawal History */}
            {withdrawals.length > 0 && (
                <div className="glass-heavy rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="font-outfit text-xl font-bold text-white">Withdrawal History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-800/50">
                                <tr className="text-left text-sm text-slate-400">
                                    <th className="p-4 font-medium">Date</th>
                                    <th className="p-4 font-medium">Amount</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Processed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {withdrawals.map((w, index) => (
                                    <tr key={w.id} className="border-t border-white/5">
                                        <td className="p-4 text-slate-300">
                                            {new Date(w.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-white font-medium">
                                            ₹{w.amount?.toFixed(2)}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${
                                                w.status === "approved" 
                                                    ? "bg-green-500/20 text-green-400"
                                                    : w.status === "rejected"
                                                    ? "bg-red-500/20 text-red-400"
                                                    : "bg-yellow-500/20 text-yellow-400"
                                            }`}>
                                                {w.status === "approved" && <CheckCircle className="w-3 h-3" />}
                                                {w.status === "rejected" && <XCircle className="w-3 h-3" />}
                                                {w.status === "pending" && <Clock className="w-3 h-3" />}
                                                {w.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500">
                                            {w.processed_at 
                                                ? new Date(w.processed_at).toLocaleDateString()
                                                : "-"
                                            }
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
