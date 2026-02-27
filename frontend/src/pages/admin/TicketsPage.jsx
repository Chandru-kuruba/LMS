import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
    MessageSquare,
    Send,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    RefreshCw,
    Search,
    Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

export default function AdminTicketsPage() {
    const { accessToken } = useAuthStore();
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [replyContent, setReplyContent] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchTickets();
    }, [accessToken, statusFilter]);

    const fetchTickets = async () => {
        try {
            const response = await axios.get(`${API}/tickets`, {
                params: { status: statusFilter || undefined },
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setTickets(response.data.tickets || []);
        } catch (error) {
            console.error("Failed to fetch tickets:", error);
            toast.error("Failed to load tickets");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReply = async () => {
        if (!replyContent.trim() || !selectedTicket) {
            toast.error("Please enter a reply");
            return;
        }

        try {
            await axios.post(
                `${API}/tickets/${selectedTicket.id}/reply`,
                null,
                {
                    params: { content: replyContent },
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            toast.success("Reply sent!");
            setReplyContent("");
            
            // Refresh ticket
            const response = await axios.get(`${API}/tickets/${selectedTicket.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setSelectedTicket(response.data);
            fetchTickets();
        } catch (error) {
            toast.error("Failed to send reply");
        }
    };

    const handleStatusChange = async (ticketId, newStatus) => {
        try {
            await axios.put(
                `${API}/tickets/${ticketId}/status`,
                null,
                {
                    params: { status: newStatus },
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            toast.success(`Ticket marked as ${newStatus}`);
            if (selectedTicket?.id === ticketId) {
                setSelectedTicket({ ...selectedTicket, status: newStatus });
            }
            fetchTickets();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleReopenTicket = async (ticketId) => {
        try {
            await axios.post(
                `${API}/tickets/${ticketId}/reopen`,
                null,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success("Ticket reopened");
            if (selectedTicket?.id === ticketId) {
                setSelectedTicket({ ...selectedTicket, status: "open" });
            }
            fetchTickets();
        } catch (error) {
            toast.error("Failed to reopen ticket");
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "open":
                return <AlertCircle className="w-4 h-4 text-yellow-400" />;
            case "in-progress":
                return <Clock className="w-4 h-4 text-blue-400" />;
            case "closed":
                return <CheckCircle className="w-4 h-4 text-green-400" />;
            default:
                return <MessageSquare className="w-4 h-4 text-slate-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "open":
                return "bg-yellow-500/20 text-yellow-400";
            case "in-progress":
                return "bg-blue-500/20 text-blue-400";
            case "closed":
                return "bg-green-500/20 text-green-400";
            default:
                return "bg-slate-500/20 text-slate-400";
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                ticket.subject?.toLowerCase().includes(query) ||
                ticket.category?.toLowerCase().includes(query)
            );
        }
        return true;
    });

    return (
        <div className="space-y-6" data-testid="admin-tickets-page">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-outfit text-2xl font-bold text-white">Support Tickets</h1>
                    <p className="text-slate-400">Manage customer support requests</p>
                </div>

                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                            placeholder="Search tickets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 input-neon w-48"
                        />
                    </div>
                    <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                        <SelectTrigger className="w-36 input-neon">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Tickets List */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {isLoading ? (
                        [1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-xl" />
                        ))
                    ) : filteredTickets.length === 0 ? (
                        <div className="text-center py-12 glass-medium rounded-xl">
                            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">No tickets found</p>
                        </div>
                    ) : (
                        filteredTickets.map((ticket, index) => (
                            <motion.button
                                key={ticket.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => setSelectedTicket(ticket)}
                                className={`w-full text-left p-4 glass-medium rounded-xl transition-all ${
                                    selectedTicket?.id === ticket.id
                                        ? "ring-2 ring-purple-500"
                                        : "hover:bg-white/5"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {getStatusIcon(ticket.status)}
                                            <h3 className="font-semibold text-white truncate">
                                                {ticket.subject}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-slate-500 line-clamp-1">
                                            {ticket.messages?.[ticket.messages.length - 1]?.content}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                                            <span className="capitalize">{ticket.category}</span>
                                            <span>•</span>
                                            <span>{ticket.messages?.length || 0} messages</span>
                                            <span>•</span>
                                            <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(ticket.status)}`}>
                                        {ticket.status}
                                    </span>
                                </div>
                            </motion.button>
                        ))
                    )}
                </div>

                {/* Ticket Detail */}
                <div className="glass-heavy rounded-xl p-6 h-[600px] flex flex-col">
                    {selectedTicket ? (
                        <>
                            <div className="flex items-start justify-between mb-4 pb-4 border-b border-white/10">
                                <div>
                                    <h2 className="font-semibold text-white text-lg">{selectedTicket.subject}</h2>
                                    <p className="text-sm text-slate-500 capitalize">{selectedTicket.category}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedTicket.status === "closed" ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-blue-500/50 text-blue-400"
                                            onClick={() => handleReopenTicket(selectedTicket.id)}
                                        >
                                            <RefreshCw className="w-4 h-4 mr-1" />
                                            Reopen
                                        </Button>
                                    ) : (
                                        <>
                                            {selectedTicket.status === "open" && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-blue-500/50 text-blue-400"
                                                    onClick={() => handleStatusChange(selectedTicket.id, "in-progress")}
                                                >
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    In Progress
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-green-500/50 text-green-400"
                                                onClick={() => handleStatusChange(selectedTicket.id, "closed")}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                Close
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                                {selectedTicket.messages?.map((message, index) => (
                                    <div
                                        key={message.id || index}
                                        className={`p-4 rounded-lg ${
                                            message.sender_role === "admin"
                                                ? "bg-purple-500/10 ml-4"
                                                : "bg-slate-800 mr-4"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-xs font-medium ${
                                                message.sender_role === "admin" ? "text-purple-400" : "text-slate-400"
                                            }`}>
                                                {message.sender_role === "admin" ? "You (Admin)" : "User"}
                                            </span>
                                            <span className="text-xs text-slate-600">
                                                {new Date(message.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-slate-300 text-sm whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                ))}
                            </div>

                            {selectedTicket.status !== "closed" && (
                                <div className="flex gap-2 pt-4 border-t border-white/10">
                                    <Textarea
                                        placeholder="Type your reply..."
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        className="input-neon min-h-[80px]"
                                    />
                                    <Button className="btn-primary self-end" onClick={handleReply}>
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-500">
                            <div className="text-center">
                                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Select a ticket to view details</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
