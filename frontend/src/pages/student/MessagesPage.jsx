import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
    MessageSquare, Users, Search, Send, UserPlus, Check, X, 
    Clock, Loader2, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MessagesPage() {
    const { accessToken, user } = useAuthStore();
    const [activeTab, setActiveTab] = useState("messages");
    const [conversations, setConversations] = useState([]);
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, [accessToken]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchData = async () => {
        try {
            const [convRes, friendsRes, requestsRes] = await Promise.all([
                axios.get(`${API}/messages/conversations`, { headers: { Authorization: `Bearer ${accessToken}` } }),
                axios.get(`${API}/friends`, { headers: { Authorization: `Bearer ${accessToken}` } }),
                axios.get(`${API}/friends/requests`, { headers: { Authorization: `Bearer ${accessToken}` } })
            ]);
            setConversations(convRes.data.conversations || []);
            setFriends(friendsRes.data.friends || []);
            setFriendRequests(requestsRes.data.requests || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const searchUsers = async (query) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const res = await axios.get(`${API}/friends/search?query=${encodeURIComponent(query)}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setSearchResults(res.data.users || []);
        } catch (error) {
            console.error("Search failed:", error);
        }
    };

    const sendFriendRequest = async (userId) => {
        try {
            await axios.post(`${API}/friends/request/${userId}`, null, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            toast.success("Friend request sent!");
            searchUsers(searchQuery);
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to send request");
        }
    };

    const acceptFriendRequest = async (friendshipId) => {
        try {
            await axios.post(`${API}/friends/accept/${friendshipId}`, null, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            toast.success("Friend request accepted!");
            fetchData();
        } catch (error) {
            toast.error("Failed to accept request");
        }
    };

    const rejectFriendRequest = async (friendshipId) => {
        try {
            await axios.post(`${API}/friends/reject/${friendshipId}`, null, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            toast.success("Friend request rejected");
            fetchData();
        } catch (error) {
            toast.error("Failed to reject request");
        }
    };

    const loadMessages = async (friend) => {
        setSelectedConversation(friend);
        try {
            const res = await axios.get(`${API}/messages/${friend.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setMessages(res.data.messages || []);
        } catch (error) {
            console.error("Failed to load messages:", error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        setIsSending(true);
        try {
            await axios.post(`${API}/messages`, {
                recipient_id: selectedConversation.id,
                content: newMessage
            }, { headers: { Authorization: `Bearer ${accessToken}` } });
            
            setMessages([...messages, {
                id: Date.now().toString(),
                sender_id: user.id,
                recipient_id: selectedConversation.id,
                content: newMessage,
                created_at: new Date().toISOString()
            }]);
            setNewMessage("");
        } catch (error) {
            toast.error("Failed to send message");
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-200px)] flex flex-col">
            <div className="flex items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-white">Messages</h1>
                <div className="flex gap-2">
                    <Button 
                        variant={activeTab === "messages" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveTab("messages")}
                    >
                        <MessageSquare className="w-4 h-4 mr-2" /> Messages
                    </Button>
                    <Button 
                        variant={activeTab === "friends" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveTab("friends")}
                    >
                        <Users className="w-4 h-4 mr-2" /> Friends
                    </Button>
                    <Button 
                        variant={activeTab === "search" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveTab("search")}
                    >
                        <UserPlus className="w-4 h-4 mr-2" /> Add Friends
                    </Button>
                </div>
            </div>

            {/* Messages Tab */}
            {activeTab === "messages" && (
                <div className="flex-1 flex gap-4 overflow-hidden">
                    {/* Conversations List */}
                    <div className={`glass-card rounded-xl overflow-hidden ${selectedConversation ? 'hidden md:block md:w-80' : 'w-full'}`}>
                        <div className="p-4 border-b border-slate-700">
                            <h3 className="text-white font-semibold">Conversations</h3>
                        </div>
                        <div className="overflow-y-auto h-full">
                            {conversations.length === 0 ? (
                                <div className="p-8 text-center">
                                    <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-400">No conversations yet</p>
                                    <p className="text-slate-500 text-sm">Add friends to start chatting</p>
                                </div>
                            ) : (
                                conversations.map((conv) => (
                                    <div
                                        key={conv.friend?.id}
                                        onClick={() => loadMessages(conv.friend)}
                                        className={`p-4 cursor-pointer hover:bg-slate-800/50 transition-colors ${
                                            selectedConversation?.id === conv.friend?.id ? 'bg-purple-500/20' : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                                <span className="text-purple-400 font-semibold">
                                                    {conv.friend?.first_name?.[0] || "?"}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white font-semibold">
                                                    {conv.friend?.first_name} {conv.friend?.last_name}
                                                </p>
                                                <p className="text-slate-400 text-sm truncate">
                                                    {conv.last_message?.content || "No messages yet"}
                                                </p>
                                            </div>
                                            {conv.unread_count > 0 && (
                                                <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">
                                                    {conv.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    {selectedConversation && (
                        <div className="flex-1 glass-card rounded-xl flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-slate-700 flex items-center gap-3">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="md:hidden"
                                    onClick={() => setSelectedConversation(null)}
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <span className="text-purple-400 font-semibold">
                                        {selectedConversation.first_name?.[0]}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-white font-semibold">
                                        {selectedConversation.first_name} {selectedConversation.last_name}
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                                            msg.sender_id === user.id 
                                                ? 'bg-purple-500 text-white' 
                                                : 'bg-slate-700 text-white'
                                        }`}>
                                            <p>{msg.content}</p>
                                            <p className={`text-xs mt-1 ${
                                                msg.sender_id === user.id ? 'text-purple-200' : 'text-slate-400'
                                            }`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-4 border-t border-slate-700">
                                <div className="flex gap-2">
                                    <Input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 input-neon"
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    />
                                    <Button onClick={sendMessage} disabled={isSending}>
                                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Friends Tab */}
            {activeTab === "friends" && (
                <div className="space-y-6">
                    {/* Pending Friend Requests Section */}
                    {friendRequests.length > 0 && (
                        <div className="glass-card rounded-xl p-6">
                            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-yellow-400" />
                                Friend Requests ({friendRequests.length})
                            </h3>
                            <div className="space-y-3">
                                {friendRequests.map((request) => (
                                    <div key={request.id} className="glass-light p-4 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                                <span className="text-yellow-400 font-semibold text-lg">
                                                    {request.sender?.first_name?.[0] || "?"}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-white font-semibold">
                                                    {request.sender?.first_name} {request.sender?.last_name}
                                                </p>
                                                <p className="text-slate-400 text-sm">{request.sender?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm"
                                                onClick={() => acceptFriendRequest(request.id)}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                <Check className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => rejectFriendRequest(request.id)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* My Friends Section */}
                    <div className="glass-card rounded-xl p-6">
                        <h3 className="text-white font-semibold mb-4">My Friends ({friends.length})</h3>
                        {friends.length === 0 && friendRequests.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400">No friends yet</p>
                                <Button className="mt-4" onClick={() => setActiveTab("search")}>
                                    <UserPlus className="w-4 h-4 mr-2" /> Find Friends
                                </Button>
                            </div>
                        ) : friends.length === 0 ? (
                            <p className="text-slate-400 text-center py-4">No friends yet. Accept requests above or search for friends!</p>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {friends.map((friendship) => {
                                    const friend = friendship.friend || friendship;
                                    return (
                                        <div key={friendship.id || friend.id} className="glass-light p-4 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                                                    <span className="text-purple-400 font-semibold text-lg">
                                                        {friend.first_name?.[0] || "?"}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-white font-semibold">
                                                        {friend.first_name} {friend.last_name}
                                                    </p>
                                                    <p className="text-slate-400 text-sm">{friend.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Search/Add Friends Tab */}
            {activeTab === "search" && (
                <div className="glass-card rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    searchUsers(e.target.value);
                                }}
                                placeholder="Search by name or email..."
                                className="pl-10 input-neon"
                            />
                        </div>
                    </div>

                    {searchResults.length === 0 && searchQuery.length >= 2 && (
                        <div className="text-center py-8">
                            <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">No users found</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {searchResults.map((searchUser) => (
                            <div key={searchUser.id} className="glass-light p-4 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                        <span className="text-purple-400 font-semibold">
                                            {searchUser.first_name?.[0] || "?"}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold">
                                            {searchUser.first_name} {searchUser.last_name}
                                        </p>
                                        <p className="text-slate-400 text-sm">{searchUser.email}</p>
                                    </div>
                                </div>
                                {searchUser.friendship_status === "accepted" ? (
                                    <span className="text-green-400 flex items-center gap-1">
                                        <Check className="w-4 h-4" /> Friends
                                    </span>
                                ) : searchUser.friendship_status === "pending" ? (
                                    <span className="text-yellow-400 flex items-center gap-1">
                                        <Clock className="w-4 h-4" /> Pending
                                    </span>
                                ) : (
                                    <Button size="sm" onClick={() => sendFriendRequest(searchUser.id)}>
                                        <UserPlus className="w-4 h-4 mr-1" /> Add Friend
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
