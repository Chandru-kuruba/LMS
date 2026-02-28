import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { Receipt, ExternalLink, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function OrdersPage() {
    const { accessToken } = useAuthStore();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get(`${API}/orders`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setOrders(response.data.orders || []);
            } catch (error) {
                console.error("Failed to fetch orders:", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (accessToken) fetchOrders();
    }, [accessToken]);

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="w-5 h-5 text-green-400" />;
            case "failed":
                return <XCircle className="w-5 h-5 text-red-400" />;
            default:
                return <Clock className="w-5 h-5 text-yellow-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "completed":
                return "bg-green-500/20 text-green-400";
            case "failed":
                return "bg-red-500/20 text-red-400";
            default:
                return "bg-yellow-500/20 text-yellow-400";
        }
    };

    return (
        <div className="space-y-6" data-testid="orders-page">
            <div>
                <h1 className="font-outfit text-2xl font-bold text-white">Order History</h1>
                <p className="text-slate-400">View all your past purchases</p>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="glass-medium rounded-xl p-6">
                            <div className="flex justify-between items-start mb-4">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                            <Skeleton className="h-20 w-full" />
                        </div>
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-16 glass-medium rounded-xl">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
                        <Receipt className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No orders yet</h3>
                    <p className="text-slate-400 mb-6">Your purchase history will appear here</p>
                    <Link to="/courses">
                        <Button className="btn-primary">Browse Courses</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order, index) => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-medium rounded-xl p-6"
                            data-testid={`order-${order.id}`}
                        >
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-semibold text-white">
                                            Order #{order.txn_id?.slice(-8).toUpperCase()}
                                        </h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        {new Date(order.created_at).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-outfit text-xl font-bold text-purple-400">
                                        ₹{order.total?.toFixed(2)}
                                    </p>
                                    {order.discount > 0 && (
                                        <p className="text-sm text-green-400">
                                            Saved ₹{order.discount?.toFixed(2)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-4">
                                <p className="text-sm text-slate-500 mb-3">
                                    {order.courses?.length || 0} course(s)
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {order.courses?.map((course) => (
                                        <Link
                                            key={course.id}
                                            to={`/learn/${course.id}`}
                                            className="flex items-center gap-3 p-3 glass-light rounded-lg hover:bg-white/10 transition-colors"
                                        >
                                            <img
                                                src={course.thumbnail_url || "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=200"}
                                                alt={course.title}
                                                className="w-16 h-12 object-cover rounded"
                                            />
                                            <div>
                                                <p className="font-medium text-white text-sm line-clamp-1">
                                                    {course.title}
                                                </p>
                                                <p className="text-xs text-slate-500">{course.category}</p>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-slate-500" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
