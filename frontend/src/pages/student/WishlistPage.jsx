import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Heart, ShoppingCart, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWishlistStore, useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

export default function WishlistPage() {
    const { accessToken } = useAuthStore();
    const { items, isLoading, fetchWishlist, removeFromWishlist } = useWishlistStore();
    const { addToCart } = useCartStore();

    useEffect(() => {
        if (accessToken) fetchWishlist();
    }, [accessToken, fetchWishlist]);

    const handleRemove = async (itemId) => {
        const result = await removeFromWishlist(itemId);
        if (result.success) {
            toast.success("Removed from wishlist");
        } else {
            toast.error(result.error);
        }
    };

    const handleAddToCart = async (courseId) => {
        const result = await addToCart(courseId);
        if (result.success) {
            toast.success("Added to cart!");
        } else {
            toast.error(result.error);
        }
    };

    return (
        <div className="space-y-6" data-testid="wishlist-page">
            <div>
                <h1 className="font-outfit text-2xl font-bold text-white">My Wishlist</h1>
                <p className="text-slate-400">{items.length} courses saved</p>
            </div>

            {isLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="glass-medium rounded-xl overflow-hidden">
                            <Skeleton className="aspect-video" />
                            <div className="p-5 space-y-3">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-16 glass-medium rounded-xl">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
                        <Heart className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Your wishlist is empty</h3>
                    <p className="text-slate-400 mb-6">Save courses you're interested in!</p>
                    <Link to="/courses">
                        <Button className="btn-primary">Browse Courses</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="card-course group"
                        >
                            <div className="relative aspect-video overflow-hidden">
                                <img
                                    src={item.course?.thumbnail_url || "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800"}
                                    alt={item.course?.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                                <button
                                    onClick={() => handleRemove(item.id)}
                                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-slate-900/80 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-600 text-white">
                                    {item.course?.category}
                                </span>
                            </div>
                            <div className="p-5">
                                <Link to={`/courses/${item.course?.id}`}>
                                    <h3 className="font-outfit text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
                                        {item.course?.title}
                                    </h3>
                                </Link>
                                <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                                    {item.course?.short_description}
                                </p>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                        <span className="text-white font-medium text-sm">
                                            {item.course?.average_rating?.toFixed(1) || "New"}
                                        </span>
                                    </div>
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
                                </div>
                                <Button
                                    className="w-full btn-primary"
                                    onClick={() => handleAddToCart(item.course?.id)}
                                >
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    Add to Cart
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
