import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ShoppingCart, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

export default function CartPage() {
    const navigate = useNavigate();
    const { accessToken } = useAuthStore();
    const { items, total, isLoading, fetchCart, removeFromCart } = useCartStore();

    useEffect(() => {
        if (accessToken) fetchCart();
    }, [accessToken, fetchCart]);

    const handleRemove = async (itemId) => {
        const result = await removeFromCart(itemId);
        if (result.success) {
            toast.success("Removed from cart");
        } else {
            toast.error(result.error);
        }
    };

    const handleCheckout = () => {
        if (items.length === 0) {
            toast.error("Your cart is empty");
            return;
        }
        navigate("/checkout");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6" data-testid="cart-page">
            <div>
                <h1 className="font-outfit text-2xl font-bold text-white">Shopping Cart</h1>
                <p className="text-slate-400">{items.length} items in your cart</p>
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
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-16 glass-medium rounded-xl">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
                        <ShoppingCart className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Your cart is empty</h3>
                    <p className="text-slate-400 mb-6">Explore our courses and add some to your cart!</p>
                    <Link to="/courses">
                        <Button className="btn-primary">Browse Courses</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="glass-medium rounded-xl p-4"
                                data-testid={`cart-item-${item.course?.id}`}
                            >
                                <div className="flex gap-4">
                                    <Link to={`/courses/${item.course?.id}`} className="flex-shrink-0">
                                        <img
                                            src={item.course?.thumbnail_url || "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400"}
                                            alt={item.course?.title}
                                            className="w-32 h-24 object-cover rounded-lg"
                                        />
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link to={`/courses/${item.course?.id}`}>
                                            <h3 className="font-semibold text-white hover:text-purple-400 transition-colors line-clamp-2">
                                                {item.course?.title}
                                            </h3>
                                        </Link>
                                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-purple-600/20 text-purple-400 mt-1">
                                            {item.course?.category}
                                        </span>
                                        <div className="flex items-center justify-between mt-3">
                                            <div>
                                                {item.course?.discount_price ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-500 line-through text-sm">
                                                            ₹{item.course.price}
                                                        </span>
                                                        <span className="text-xl font-bold text-purple-400">
                                                            ₹{item.course.discount_price}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xl font-bold text-purple-400">
                                                        ₹{item.course?.price}
                                                    </span>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                onClick={() => handleRemove(item.id)}
                                                data-testid={`remove-item-${item.course?.id}`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="glass-heavy rounded-xl p-6 sticky top-24">
                            <h2 className="font-outfit text-xl font-bold text-white mb-6">Order Summary</h2>
                            
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-slate-400">
                                    <span>Subtotal ({items.length} items)</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Discount</span>
                                    <span className="text-green-400">-₹0.00</span>
                                </div>
                                <hr className="border-white/10" />
                                <div className="flex justify-between text-white font-semibold text-lg">
                                    <span>Total</span>
                                    <span className="text-purple-400">${total.toFixed(2)}</span>
                                </div>
                            </div>

                            <Button
                                className="w-full btn-primary py-4"
                                onClick={handleCheckout}
                                data-testid="checkout-btn"
                            >
                                <ShoppingBag className="w-5 h-5 mr-2" />
                                Proceed to Checkout
                            </Button>

                            <p className="text-center text-xs text-slate-500 mt-4">
                                Secure checkout powered by PayU
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
