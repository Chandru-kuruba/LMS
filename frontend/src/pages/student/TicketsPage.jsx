import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
    HelpCircle,
    Plus,
    MessageSquare,
    Clock,
    CheckCircle,
    AlertCircle,
    Send,
    XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TicketsPage() {
    const { accessToken } = useAuthStore();
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [newTicket, setNewTicket] = useState({
        subject: "",
        category: "",
        message: ""
    });

    useEffect(() => {
        fetchTickets();
    }, [accessToken]);

    const fetchTickets = async () => {
        try {
            const response = await axios.get(`${API}/tickets`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setTickets(response.data.tickets || []);
        } catch (error) {
            console.error("Failed to fetch tickets:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTicket = async () => {
        if (!newTicket.subject || !newTicket.category || !newTicket.message) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsCreating(true);
        try {
            await axios.post(
                `${API}/tickets`,
                newTicket,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success("Ticket created successfully!");
            setNewTicket({ subject: "", category: "", message: "" });
            fetchTickets();
        } catch (error) {
            toast.error("Failed to create ticket");
        } finally {
            setIsCreating(false);
        }
    };

    const handleReply = async () => {
        if (!replyContent.trim()) {
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

    const getStatusIcon = (status) => {
        switch (status) {
            case "open":
                return <AlertCircle className="w-4 h-4 text-yellow-400" />;
            case "closed":
                return <CheckCircle className="w-4 h-4 text-green-400" />;
            default:
                return <Clock className="w-4 h-4 text-blue-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "open":
                return "bg-yellow-500/20 text-yellow-400";
            case "closed":
                return "bg-green-500/20 text-green-400";
            default:
                return "bg-blue-500/20 text-blue-400";
        }
    };

    return (
        <div className="space-y-6" data-testid="tickets-page">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-outfit text-2xl font-bold text-white">Support Tickets</h1>
                    <p className="text-slate-400">Get help from our support team</p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="btn-primary" data-testid="create-ticket-btn">
                            <Plus className="w-4 h-4 mr-2" />
                            New Ticket
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-heavy border-white/10">
                        <DialogHeader>
                            <DialogTitle className="text-white">Create Support Ticket</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Describe your issue and we'll get back to you soon
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Subject</Label>
                                <Input
                                    placeholder="Brief description of your issue"
                                    value={newTicket.subject}
                                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                    className="input-neon"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Category</Label>
                                <Select
                                    value={newTicket.category}
                                    onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}
                                >
                                    <SelectTrigger className="input-neon">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="technical">Technical Issue</SelectItem>
                                        <SelectItem value="billing">Billing</SelectItem>
                                        <SelectItem value="course">Course Content</SelectItem>
                                        <SelectItem value="account">Account</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Message</Label>
                                <Textarea
                                    placeholder="Describe your issue in detail..."
                                    value={newTicket.message}
                                    onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                                    className="input-neon min-h-[120px]"
                                />
                            </div>
                            <Button
                                className="w-full btn-primary"
                                onClick={handleCreateTicket}
                                disabled={isCreating}
                            >
                                {isCreating ? "Creating..." : "Create Ticket"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Tickets List */}
                <div className="space-y-4">
                    {isLoading ? (
                        [1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-xl" />
                        ))
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-12 glass-medium rounded-xl">
                            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">No tickets yet</p>
                        </div>
                    ) : (
                        tickets.map((ticket) => (
                            <motion.button
                                key={ticket.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => setSelectedTicket(ticket)}
                                className={`w-full text-left p-4 glass-medium rounded-xl transition-colors ${
                                    selectedTicket?.id === ticket.id
                                        ? "ring-2 ring-purple-500"
                                        : "hover:bg-white/5"
                                }`}
                                data-testid={`ticket-${ticket.id}`}
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
                                            {ticket.messages?.[0]?.content}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                                            <span className="capitalize">{ticket.category}</span>
                                            <span>•</span>
                                            <span>{ticket.messages?.length || 0} messages</span>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                        {ticket.status}
                                    </span>
                                </div>
                            </motion.button>
                        ))
                    )}
                </div>

                {/* Ticket Detail */}
                <div className="glass-heavy rounded-xl p-6">
                    {selectedTicket ? (
                        <>
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                                <div>
                                    <h2 className="font-semibold text-white">{selectedTicket.subject}</h2>
                                    <p className="text-sm text-slate-500 capitalize">{selectedTicket.category}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                                    {selectedTicket.status}
                                </span>
                            </div>

                            <div className="space-y-4 max-h-80 overflow-y-auto mb-4">
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
                                                {message.sender_role === "admin" ? "Support" : "You"}
                                            </span>
                                            <span className="text-xs text-slate-600">
                                                {new Date(message.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-slate-300 text-sm">{message.content}</p>
                                    </div>
                                ))}
                            </div>

                            {selectedTicket.status !== "closed" && (
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Type your reply..."
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        className="input-neon"
                                        onKeyPress={(e) => e.key === "Enter" && handleReply()}
                                    />
                                    <Button className="btn-primary" onClick={handleReply}>
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-slate-500">
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
