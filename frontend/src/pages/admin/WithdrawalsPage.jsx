import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { DollarSign, Check, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminWithdrawalsPage() {
    const { accessToken } = useAuthStore();
    const [withdrawals, setWithdrawals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");

    useEffect(() => {
        fetchWithdrawals();
    }, [accessToken, statusFilter]);

    const fetchWithdrawals = async () => {
        try {
            const response = await axios.get(`${API}/admin/withdrawals`, {
                params: { status: statusFilter || undefined },
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setWithdrawals(response.data.withdrawals || []);
        } catch (error) {
            console.error("Failed to fetch withdrawals:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (withdrawalId, newStatus) => {
        try {
            await axios.put(
                `${API}/admin/withdrawals/${withdrawalId}`,
                null,
                {
                    params: { status: newStatus },
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            toast.success(`Withdrawal ${newStatus}`);
            fetchWithdrawals();
        } catch (error) {
            toast.error("Failed to update withdrawal");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "approved":
                return "bg-green-500/20 text-green-400";
            case "rejected":
                return "bg-red-500/20 text-red-400";
            default:
                return "bg-yellow-500/20 text-yellow-400";
        }
    };

    return (
        <div className="space-y-6" data-testid="admin-withdrawals-page">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-outfit text-2xl font-bold text-white">Withdrawal Requests</h1>
                    <p className="text-slate-400">Manage affiliate withdrawal requests</p>
                </div>

                <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-40 input-neon">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Withdrawals List */}
            <div className="glass-heavy rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="p-6 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-lg" />
                        ))}
                    </div>
                ) : withdrawals.length === 0 ? (
                    <div className="p-12 text-center">
                        <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No withdrawal requests</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-800/50">
                                <tr className="text-left text-sm text-slate-400">
                                    <th className="p-4 font-medium">User</th>
                                    <th className="p-4 font-medium">Amount</th>
                                    <th className="p-4 font-medium">Bank Details</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Requested</th>
                                    <th className="p-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {withdrawals.map((withdrawal, index) => (
                                    <motion.tr
                                        key={withdrawal.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="border-t border-white/5 hover:bg-white/5"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={withdrawal.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${withdrawal.user_id}`}
                                                    alt="User"
                                                    className="w-10 h-10 rounded-full"
                                                />
                                                <div>
                                                    <p className="font-medium text-white">
                                                        {withdrawal.user?.first_name} {withdrawal.user?.last_name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{withdrawal.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-semibold text-green-400">
                                                ${withdrawal.amount?.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-400 max-w-xs truncate">
                                            {withdrawal.bank_details}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                                                {withdrawal.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500 text-sm">
                                            {new Date(withdrawal.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            {withdrawal.status === "pending" && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-500"
                                                        onClick={() => handleUpdateStatus(withdrawal.id, "approved")}
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleUpdateStatus(withdrawal.id, "rejected")}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
