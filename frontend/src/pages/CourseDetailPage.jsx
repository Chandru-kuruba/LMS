import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
    Play,
    Star,
    Clock,
    Users,
    Award,
    BookOpen,
    ChevronDown,
    ChevronRight,
    ShoppingCart,
    Heart,
    Share2,
    Check,
    Lock,
    FileText,
    Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";
import { useCartStore, useWishlistStore } from "@/store/cartStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CourseDetailPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const { addToCart, items: cartItems } = useCartStore();
    const { addToWishlist, removeFromWishlist, items: wishlistItems, isInWishlist } = useWishlistStore();
    
    const [course, setCourse] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    const isInCart = cartItems.some(item => item.course?.id === courseId);
    const inWishlist = isInWishlist(courseId);

    useEffect(() => {
        const fetchCourse = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`${API}/courses/${courseId}`);
                setCourse(response.data);
            } catch (error) {
                console.error("Failed to fetch course:", error);
                toast.error("Failed to load course");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCourse();
    }, [courseId]);

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }
        const result = await addToCart(courseId);
        if (result.success) {
            toast.success("Added to cart!");
        } else {
            toast.error(result.error);
        }
    };

    const handleWishlist = async () => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }
        if (inWishlist) {
            const item = wishlistItems.find(i => i.course?.id === courseId);
            if (item) {
                await removeFromWishlist(item.id);
                toast.success("Removed from wishlist");
            }
        } else {
            const result = await addToWishlist(courseId);
            if (result.success) {
                toast.success("Added to wishlist!");
            } else {
                toast.error(result.error);
            }
        }
    };

    const totalLessons = course?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
    const totalDuration = course?.modules?.reduce((acc, m) => 
        acc + (m.lessons?.reduce((a, l) => a + (l.duration_minutes || 0), 0) || 0), 0) || 0;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0F172A] py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="aspect-video rounded-2xl" />
                            <Skeleton className="h-10 w-3/4" />
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                        <div>
                            <Skeleton className="h-96 rounded-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Course not found</h2>
                    <Link to="/courses">
                        <Button className="btn-primary">Browse Courses</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F172A]" data-testid="course-detail-page">
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-slate-900 to-[#0F172A] py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Left Content */}
                        <div className="lg:col-span-2">
                            {/* Breadcrumb */}
                            <nav className="flex items-center gap-2 text-sm mb-6">
                                <Link to="/courses" className="text-slate-500 hover:text-white transition-colors">
                                    Courses
                                </Link>
                                <ChevronRight className="w-4 h-4 text-slate-600" />
                                <span className="text-purple-400">{course.category}</span>
                            </nav>

                            {/* Video Preview */}
                            <div className="relative aspect-video rounded-2xl overflow-hidden mb-8 group">
                                <img
                                    src={course.thumbnail_url || "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800"}
                                    alt={course.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center neon-glow-purple">
                                        <Play className="w-8 h-8 text-white ml-1" />
                                    </button>
                                </div>
                            </div>

                            {/* Course Info */}
                            <div className="flex flex-wrap items-center gap-4 mb-4">
                                <span className="px-3 py-1 rounded-full bg-purple-600/20 text-purple-400 text-sm font-medium">
                                    {course.category}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    course.level === "beginner" ? "bg-green-500/20 text-green-400" :
                                    course.level === "intermediate" ? "bg-yellow-500/20 text-yellow-400" :
                                    "bg-red-500/20 text-red-400"
                                }`}>
                                    {course.level}
                                </span>
                            </div>

                            <h1 className="font-outfit text-3xl sm:text-4xl font-bold text-white mb-4">
                                {course.title}
                            </h1>

                            <p className="text-lg text-slate-400 mb-6">
                                {course.short_description}
                            </p>

                            {/* Stats */}
                            <div className="flex flex-wrap items-center gap-6 mb-8">
                                <div className="flex items-center gap-2">
                                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                    <span className="text-white font-semibold">
                                        {course.average_rating?.toFixed(1) || "New"}
                                    </span>
                                    <span className="text-slate-500">
                                        ({course.review_count || 0} reviews)
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Users className="w-5 h-5" />
                                    <span>{course.enrollment_count || 0} students</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400">
                                    <BookOpen className="w-5 h-5" />
                                    <span>{totalLessons} lessons</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Clock className="w-5 h-5" />
                                    <span>{Math.round(totalDuration / 60)}h {totalDuration % 60}m</span>
                                </div>
                            </div>

                            {/* Instructor */}
                            {course.instructor && (
                                <div className="flex items-center gap-4 p-4 glass-light rounded-xl mb-8">
                                    <img
                                        src={course.instructor.avatar_url}
                                        alt={course.instructor.first_name}
                                        className="w-14 h-14 rounded-full border-2 border-purple-500"
                                    />
                                    <div>
                                        <p className="text-sm text-slate-500">Instructor</p>
                                        <p className="font-semibold text-white">
                                            {course.instructor.first_name} {course.instructor.last_name}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Sidebar - Purchase Card */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 glass-heavy rounded-2xl p-6 neon-border-purple">
                                {/* Price */}
                                <div className="mb-6">
                                    {course.discount_price ? (
                                        <div className="flex items-center gap-3">
                                            <span className="font-outfit text-4xl font-bold text-white">
                                                ${course.discount_price}
                                            </span>
                                            <span className="text-xl text-slate-500 line-through">
                                                ${course.price}
                                            </span>
                                            <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-sm font-medium">
                                                {Math.round((1 - course.discount_price / course.price) * 100)}% OFF
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="font-outfit text-4xl font-bold text-white">
                                            ${course.price}
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="space-y-3 mb-6">
                                    {isInCart ? (
                                        <Link to="/cart" className="block">
                                            <Button className="w-full btn-primary py-4" data-testid="go-to-cart-btn">
                                                <ShoppingCart className="w-5 h-5 mr-2" />
                                                Go to Cart
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Button 
                                            className="w-full btn-primary py-4" 
                                            onClick={handleAddToCart}
                                            data-testid="add-to-cart-btn"
                                        >
                                            <ShoppingCart className="w-5 h-5 mr-2" />
                                            Add to Cart
                                        </Button>
                                    )}
                                    <Button 
                                        className="w-full btn-secondary py-4"
                                        onClick={handleWishlist}
                                        data-testid="wishlist-btn"
                                    >
                                        <Heart className={`w-5 h-5 mr-2 ${inWishlist ? "fill-pink-500 text-pink-500" : ""}`} />
                                        {inWishlist ? "In Wishlist" : "Add to Wishlist"}
                                    </Button>
                                </div>

                                {/* Course Includes */}
                                <div className="border-t border-white/10 pt-6">
                                    <h4 className="font-semibold text-white mb-4">This course includes:</h4>
                                    <ul className="space-y-3">
                                        <li className="flex items-center gap-3 text-slate-400">
                                            <Video className="w-5 h-5 text-purple-400" />
                                            <span>{totalLessons} video lessons</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-slate-400">
                                            <Clock className="w-5 h-5 text-purple-400" />
                                            <span>{Math.round(totalDuration / 60)}+ hours of content</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-slate-400">
                                            <Award className="w-5 h-5 text-purple-400" />
                                            <span>Certificate of completion</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-slate-400">
                                            <BookOpen className="w-5 h-5 text-purple-400" />
                                            <span>Lifetime access</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Share */}
                                <div className="border-t border-white/10 pt-6 mt-6">
                                    <Button variant="ghost" className="w-full text-slate-400 hover:text-white">
                                        <Share2 className="w-5 h-5 mr-2" />
                                        Share this course
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="lg:col-span-2">
                    {/* Tab Navigation */}
                    <div className="flex gap-4 border-b border-white/10 mb-8 overflow-x-auto">
                        {["overview", "curriculum", "reviews"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-4 px-2 font-medium capitalize whitespace-nowrap transition-colors ${
                                    activeTab === tab
                                        ? "text-purple-400 border-b-2 border-purple-400"
                                        : "text-slate-500 hover:text-white"
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    {activeTab === "overview" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            <div>
                                <h2 className="font-outfit text-2xl font-bold text-white mb-4">
                                    About This Course
                                </h2>
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-slate-400 whitespace-pre-line">
                                        {course.description}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-outfit text-xl font-bold text-white mb-4">
                                    What You'll Learn
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {[
                                        "Build real-world projects",
                                        "Master core concepts",
                                        "Best practices and patterns",
                                        "Industry-standard tools",
                                        "Problem-solving skills",
                                        "Portfolio-ready projects"
                                    ].map((item) => (
                                        <div key={item} className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Check className="w-4 h-4 text-green-400" />
                                            </div>
                                            <span className="text-slate-300">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "curriculum" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-outfit text-2xl font-bold text-white">
                                    Course Curriculum
                                </h2>
                                <span className="text-slate-500">
                                    {course.modules?.length || 0} modules • {totalLessons} lessons
                                </span>
                            </div>

                            <Accordion type="multiple" className="space-y-4">
                                {course.modules?.map((module, moduleIndex) => (
                                    <AccordionItem
                                        key={module.id}
                                        value={module.id}
                                        className="glass-medium rounded-xl border-none overflow-hidden"
                                    >
                                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                                            <div className="flex items-center gap-4 text-left">
                                                <span className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400 font-semibold text-sm">
                                                    {moduleIndex + 1}
                                                </span>
                                                <div>
                                                    <h3 className="font-semibold text-white">
                                                        {module.title}
                                                    </h3>
                                                    <p className="text-sm text-slate-500">
                                                        {module.lessons?.length || 0} lessons
                                                    </p>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-6 pb-4">
                                            <div className="space-y-2 ml-12">
                                                {module.lessons?.map((lesson, lessonIndex) => (
                                                    <div
                                                        key={lesson.id}
                                                        className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-white/5 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {lesson.is_preview ? (
                                                                <Play className="w-4 h-4 text-purple-400" />
                                                            ) : (
                                                                <Lock className="w-4 h-4 text-slate-600" />
                                                            )}
                                                            <span className={lesson.is_preview ? "text-slate-300" : "text-slate-500"}>
                                                                {lesson.title}
                                                            </span>
                                                            {lesson.is_preview && (
                                                                <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-400">
                                                                    Preview
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-sm text-slate-600">
                                                            {lesson.duration_minutes || 0} min
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </motion.div>
                    )}

                    {activeTab === "reviews" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="font-outfit text-2xl font-bold text-white">
                                    Student Reviews
                                </h2>
                                <div className="flex items-center gap-2">
                                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                                    <span className="text-2xl font-bold text-white">
                                        {course.average_rating?.toFixed(1) || "0"}
                                    </span>
                                    <span className="text-slate-500">
                                        ({course.review_count || 0} reviews)
                                    </span>
                                </div>
                            </div>

                            {course.reviews?.length > 0 ? (
                                <div className="space-y-6">
                                    {course.reviews.map((review) => (
                                        <div key={review.id} className="glass-light rounded-xl p-6">
                                            <div className="flex items-start gap-4">
                                                <img
                                                    src={review.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user_id}`}
                                                    alt="Reviewer"
                                                    className="w-12 h-12 rounded-full"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-semibold text-white">
                                                            {review.user?.first_name} {review.user?.last_name}
                                                        </h4>
                                                        <div className="flex items-center gap-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className={`w-4 h-4 ${
                                                                        i < review.rating
                                                                            ? "text-yellow-500 fill-yellow-500"
                                                                            : "text-slate-600"
                                                                    }`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-slate-400">{review.comment}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 glass-light rounded-xl">
                                    <Star className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-400">No reviews yet. Be the first to review!</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
