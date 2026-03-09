import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
    MessageSquare, Users, Search, Send, UserPlus, Check, X, 
    Clock, Loader2, ArrowLeft, Wifi, WifiOff, Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const WS_URL = process.env.REACT_APP_BACKEND_URL?.replace('https://', 'wss://').replace('http://', 'ws://') || '';

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
    const [isConnected, setIsConnected] = useState(false);
    const [typingUsers, setTypingUsers] = useState({});
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Initialize WebSocket connection
    useEffect(() => {
        if (!accessToken) return;

        // Connect to Socket.IO
        const socket = io(process.env.REACT_APP_BACKEND_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('WebSocket connected');
            // Authenticate after connection
            socket.emit('authenticate', { token: accessToken });
        });

        socket.on('authenticated', (data) => {
            console.log('WebSocket authenticated:', data);
            setIsConnected(true);
        });

        socket.on('auth_error', (error) => {
            console.error('WebSocket auth error:', error);
            setIsConnected(false);
        });

        socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
        });

        // Handle incoming messages
        socket.on('new_message', (message) => {
            console.log('New message received:', message);
            // Add message to the conversation if it's from the selected user
            setMessages(prev => {
                // Check if message already exists
                if (prev.some(m => m.id === message.id)) return prev;
                
                // Only add if from selected conversation
                if (selectedConversation && message.sender_id === selectedConversation.id) {
                    return [...prev, message];
                }
                return prev;
            });

            // Update conversations list
            setConversations(prev => {
                const updated = prev.map(conv => {
                    if (conv.friend?.id === message.sender_id) {
                        return {
                            ...conv,
                            last_message: message.content,
                            last_message_time: message.created_at,
                            unread_count: (conv.unread_count || 0) + 1
                        };
                    }
                    return conv;
                });
                return updated;
            });

            // Show notification if not viewing that conversation
            if (!selectedConversation || selectedConversation.id !== message.sender_id) {
                toast.info(`New message from ${message.sender?.first_name || 'Someone'}`);
            }
        });

        // Handle typing indicators
        socket.on('user_typing', ({ sender_id }) => {
            setTypingUsers(prev => ({ ...prev, [sender_id]: true }));
        });

        socket.on('user_stop_typing', ({ sender_id }) => {
            setTypingUsers(prev => {
                const updated = { ...prev };
                delete updated[sender_id];
                return updated;
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [accessToken]);

    // Update selected conversation ref for socket handler
    useEffect(() => {
        if (socketRef.current && selectedConversation) {
            // Mark messages as read when conversation is selected
            markMessagesAsRead(selectedConversation.id);
        }
    }, [selectedConversation]);

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
            
            // Mark conversation as read
            setConversations(prev => 
                prev.map(conv => 
                    conv.friend?.id === friend.id 
                        ? { ...conv, unread_count: 0 }
                        : conv
                )
            );
        } catch (error) {
            console.error("Failed to load messages:", error);
        }
    };

    const markMessagesAsRead = async (senderId) => {
        try {
            await axios.post(`${API}/messages/read/${senderId}`, null, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
        } catch (error) {
            console.error("Failed to mark messages as read:", error);
        }
    };

    const handleTyping = useCallback(() => {
        if (!socketRef.current || !selectedConversation || !isConnected) return;

        // Emit typing event
        socketRef.current.emit('typing', {
            recipient_id: selectedConversation.id,
            sender_id: user?.id
        });

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to stop typing
        typingTimeoutRef.current = setTimeout(() => {
            socketRef.current?.emit('stop_typing', {
                recipient_id: selectedConversation.id,
                sender_id: user?.id
            });
        }, 2000);
    }, [selectedConversation, user?.id, isConnected]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        setIsSending(true);
        const messageContent = newMessage;
        setNewMessage("");

        // Stop typing indicator
        if (socketRef.current) {
            socketRef.current.emit('stop_typing', {
                recipient_id: selectedConversation.id,
                sender_id: user?.id
            });
        }

        try {
            const res = await axios.post(`${API}/messages`, {
                recipient_id: selectedConversation.id,
                content: messageContent
            }, { headers: { Authorization: `Bearer ${accessToken}` } });
            
            // Add message to list (backend emits to recipient via WebSocket)
            const newMsg = res.data.data || {
                id: Date.now().toString(),
                sender_id: user.id,
                recipient_id: selectedConversation.id,
                content: messageContent,
                created_at: new Date().toISOString()
            };
            
            setMessages(prev => [...prev, newMsg]);
        } catch (error) {
            toast.error("Failed to send message");
            setNewMessage(messageContent); // Restore message on error
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div data-testid="messages-page" className="h-[calc(100vh-200px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-white">Messages</h1>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50">
                        {isConnected ? (
                            <>
                                <Wifi className="w-4 h-4 text-green-400" />
                                <span className="text-xs text-green-400">Live</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-4 h-4 text-slate-500" />
                                <span className="text-xs text-slate-500">Offline</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button 
                        data-testid="messages-tab-btn"
                        variant={activeTab === "messages" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveTab("messages")}
                    >
                        <MessageSquare className="w-4 h-4 mr-2" /> Messages
                    </Button>
                    <Button 
                        data-testid="friends-tab-btn"
                        variant={activeTab === "friends" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveTab("friends")}
                    >
                        <Users className="w-4 h-4 mr-2" /> Friends
                        {friendRequests.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 rounded-full">{friendRequests.length}</span>
                        )}
                    </Button>
                    <Button 
                        data-testid="add-friends-tab-btn"
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
                        <div className="overflow-y-auto h-[calc(100%-60px)]">
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
                                        data-testid={`conversation-${conv.friend?.id}`}
                                        onClick={() => loadMessages(conv.friend)}
                                        className={`p-4 cursor-pointer hover:bg-slate-800/50 transition-colors border-b border-slate-700/50 ${
                                            selectedConversation?.id === conv.friend?.id ? 'bg-purple-900/30 border-l-4 border-l-purple-500' : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                                    {conv.friend?.first_name?.[0] || '?'}
                                                </div>
                                                {typingUsers[conv.friend?.id] && (
                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center">
                                                        <motion.div
                                                            animate={{ scale: [1, 1.2, 1] }}
                                                            transition={{ repeat: Infinity, duration: 0.8 }}
                                                        >
                                                            <Circle className="w-3 h-3 text-green-400 fill-green-400" />
                                                        </motion.div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-white font-medium truncate">
                                                        {conv.friend?.first_name} {conv.friend?.last_name}
                                                    </p>
                                                    {conv.unread_count > 0 && (
                                                        <span className="px-2 py-0.5 text-xs bg-purple-500 text-white rounded-full">
                                                            {conv.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-slate-400 text-sm truncate">
                                                    {typingUsers[conv.friend?.id] ? (
                                                        <span className="text-green-400">typing...</span>
                                                    ) : (
                                                        conv.last_message || 'Start a conversation'
                                                    )}
                                                </p>
                                                {conv.last_message_time && (
                                                    <p className="text-slate-500 text-xs mt-1">
                                                        {formatTime(conv.last_message_time)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    {selectedConversation ? (
                        <div className="flex-1 glass-card rounded-xl flex flex-col overflow-hidden">
                            {/* Chat Header */}
                            <div className="p-4 border-b border-slate-700 flex items-center gap-4">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="md:hidden"
                                    onClick={() => setSelectedConversation(null)}
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                    {selectedConversation.first_name?.[0] || '?'}
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-semibold">
                                        {selectedConversation.first_name} {selectedConversation.last_name}
                                    </p>
                                    {typingUsers[selectedConversation.id] && (
                                        <p className="text-green-400 text-sm animate-pulse">typing...</p>
                                    )}
                                </div>
                                {isConnected && (
                                    <div className="flex items-center gap-2 text-green-400 text-xs">
                                        <Circle className="w-2 h-2 fill-green-400" />
                                        Live
                                    </div>
                                )}
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                <AnimatePresence>
                                    {messages.map((msg, index) => (
                                        <motion.div
                                            key={msg.id || index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[70%] ${
                                                msg.sender_id === user?.id 
                                                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-l-xl rounded-tr-xl' 
                                                    : 'bg-slate-700 text-white rounded-r-xl rounded-tl-xl'
                                            } px-4 py-3`}>
                                                <p className="break-words">{msg.content}</p>
                                                <p className={`text-xs mt-1 ${
                                                    msg.sender_id === user?.id ? 'text-purple-200' : 'text-slate-400'
                                                }`}>
                                                    {formatTime(msg.created_at)}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t border-slate-700">
                                <div className="flex gap-3">
                                    <Input
                                        data-testid="message-input"
                                        value={newMessage}
                                        onChange={(e) => {
                                            setNewMessage(e.target.value);
                                            handleTyping();
                                        }}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-slate-800 border-slate-700 text-white"
                                        disabled={isSending}
                                    />
                                    <Button 
                                        data-testid="send-message-btn"
                                        onClick={sendMessage}
                                        disabled={!newMessage.trim() || isSending}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        {isSending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 glass-card rounded-xl hidden md:flex items-center justify-center">
                            <div className="text-center">
                                <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400 text-lg">Select a conversation</p>
                                <p className="text-slate-500 text-sm">Choose a friend to start chatting</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Friends Tab */}
            {activeTab === "friends" && (
                <div className="flex-1 overflow-y-auto">
                    {/* Friend Requests */}
                    {friendRequests.length > 0 && (
                        <div className="glass-card rounded-xl p-4 mb-4">
                            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-purple-400" />
                                Friend Requests ({friendRequests.length})
                            </h3>
                            <div className="space-y-3">
                                {friendRequests.map((req) => (
                                    <div key={req.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold">
                                                {req.requester?.first_name?.[0] || '?'}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">
                                                    {req.requester?.first_name} {req.requester?.last_name}
                                                </p>
                                                <p className="text-slate-400 text-sm">{req.requester?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                onClick={() => acceptFriendRequest(req.id)}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                <Check className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="destructive"
                                                onClick={() => rejectFriendRequest(req.id)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Friends List */}
                    <div className="glass-card rounded-xl p-4">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-400" />
                            My Friends ({friends.length})
                        </h3>
                        {friends.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400">No friends yet</p>
                                <p className="text-slate-500 text-sm">Search for users to add as friends</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {friends.map((friend) => (
                                    <div 
                                        key={friend.id}
                                        className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                                        onClick={() => {
                                            setSelectedConversation(friend);
                                            setActiveTab("messages");
                                            loadMessages(friend);
                                        }}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                            {friend.first_name?.[0] || '?'}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium">
                                                {friend.first_name} {friend.last_name}
                                            </p>
                                            <p className="text-slate-400 text-sm">Click to message</p>
                                        </div>
                                        <MessageSquare className="w-5 h-5 text-purple-400" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Search Tab */}
            {activeTab === "search" && (
                <div className="flex-1 glass-card rounded-xl p-4">
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <Input
                                data-testid="search-users-input"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    searchUsers(e.target.value);
                                }}
                                placeholder="Search users by name or email..."
                                className="pl-10 bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                    </div>

                    {searchQuery.length < 2 ? (
                        <div className="text-center py-8">
                            <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">Search for users</p>
                            <p className="text-slate-500 text-sm">Enter at least 2 characters to search</p>
                        </div>
                    ) : searchResults.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">No users found</p>
                            <p className="text-slate-500 text-sm">Try a different search term</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {searchResults.map((result) => (
                                <div key={result.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                            {result.first_name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">
                                                {result.first_name} {result.last_name}
                                            </p>
                                            <p className="text-slate-400 text-sm">{result.email}</p>
                                        </div>
                                    </div>
                                    {result.is_friend ? (
                                        <span className="text-green-400 text-sm flex items-center gap-1">
                                            <Check className="w-4 h-4" /> Friends
                                        </span>
                                    ) : result.request_sent ? (
                                        <span className="text-yellow-400 text-sm flex items-center gap-1">
                                            <Clock className="w-4 h-4" /> Pending
                                        </span>
                                    ) : (
                                        <Button 
                                            size="sm"
                                            onClick={() => sendFriendRequest(result.id)}
                                            className="bg-purple-600 hover:bg-purple-700"
                                        >
                                            <UserPlus className="w-4 h-4 mr-2" /> Add Friend
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
