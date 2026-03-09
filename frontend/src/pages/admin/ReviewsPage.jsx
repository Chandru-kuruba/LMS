import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
    Star,
    Eye,
    EyeOff,
    Edit2,
    Trash2,
    Search,
    Filter,
    Check,
    X,
    MessageSquare
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
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminReviewsPage() {
    const { accessToken } = useAuthStore();
    const [reviews, setReviews] = useState([]);
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterCourse, setFilterCourse] = useState("all");
    const [filterVisibility, setFilterVisibility] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    
    // Edit dialog state
    const [editDialog, setEditDialog] = useState({ open: false, review: null });
    const [editForm, setEditForm] = useState({ rating: 5, comment: "" });

    useEffect(() => {
        fetchReviews();
        fetchCourses();
    }, [accessToken, filterCourse, filterVisibility]);

    const fetchCourses = async () => {
        try {
            const response = await axios.get(`${API}/admin/courses`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setCourses(response.data.courses || []);
        } catch (error) {
            console.error("Failed to fetch courses:", error);
        }
    };

    const fetchReviews = async () => {
        setIsLoading(true);
        try {
            let url = `${API}/admin/reviews`;
            const params = new URLSearchParams();
            if (filterCourse && filterCourse !== "all") {
                params.append("course_id", filterCourse);
            }
            if (filterVisibility !== "all") {
                params.append("is_visible", filterVisibility === "visible");
            }
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setReviews(response.data.reviews || []);
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
            toast.error("Failed to load reviews");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleVisibility = async (reviewId, currentVisibility) => {
        try {
            await axios.put(
                `${API}/admin/reviews/${reviewId}/visibility?is_visible=${!currentVisibility}`,
                null,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success(currentVisibility ? "Review hidden" : "Review is now visible");
            fetchReviews();
        } catch (error) {
            toast.error("Failed to update review visibility");
        }
    };

    const handleEditReview = async () => {
        try {
            await axios.put(
                `${API}/admin/reviews/${editDialog.review.id}?rating=${editForm.rating}&comment=${encodeURIComponent(editForm.comment)}`,
                null,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success("Review updated");
            setEditDialog({ open: false, review: null });
            fetchReviews();
        } catch (error) {
            toast.error("Failed to update review");
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm("Are you sure you want to delete this review?")) return;
        try {
            await axios.delete(`${API}/admin/reviews/${reviewId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            toast.success("Review deleted");
            fetchReviews();
        } catch (error) {
            toast.error("Failed to delete review");
        }
    };

    const openEditDialog = (review) => {
        setEditForm({ rating: review.rating, comment: review.comment });
        setEditDialog({ open: true, review });
    };

    const filteredReviews = reviews.filter(review => {
        if (!searchQuery) return true;
        const search = searchQuery.toLowerCase();
        return (
            review.comment?.toLowerCase().includes(search) ||
            review.user?.first_name?.toLowerCase().includes(search) ||
            review.user?.last_name?.toLowerCase().includes(search) ||
            review.user?.email?.toLowerCase().includes(search) ||
            review.course?.title?.toLowerCase().includes(search)
        );
    });

    const pendingCount = reviews.filter(r => !r.is_visible).length;
    const visibleCount = reviews.filter(r => r.is_visible).length;

    return (
        <div className="space-y-6" data-testid="reviews-page">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-outfit text-2xl font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-purple-400" />
                        Review Management
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Approve, edit, or hide student reviews</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass-medium rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{reviews.length}</p>
                    <p className="text-sm text-slate-500">Total Reviews</p>
                </div>
                <div className="glass-medium rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
                    <p className="text-sm text-slate-500">Pending Approval</p>
                </div>
                <div className="glass-medium rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">{visibleCount}</p>
                    <p className="text-sm text-slate-500">Visible</p>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-heavy rounded-xl p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input
                                placeholder="Search reviews..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 input-neon"
                            />
                        </div>
                    </div>
                    <Select value={filterCourse} onValueChange={setFilterCourse}>
                        <SelectTrigger className="w-[200px] input-neon">
                            <SelectValue placeholder="Filter by course" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Courses</SelectItem>
                            {courses.map(course => (
                                <SelectItem key={course.id} value={course.id}>
                                    {course.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterVisibility} onValueChange={setFilterVisibility}>
                        <SelectTrigger className="w-[150px] input-neon">
                            <SelectValue placeholder="Visibility" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="visible">Visible</SelectItem>
                            <SelectItem value="hidden">Hidden</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                    </div>
                ) : filteredReviews.length === 0 ? (
                    <div className="text-center py-12 glass-medium rounded-xl">
                        <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No reviews found</p>
                    </div>
                ) : (
                    filteredReviews.map((review, index) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`glass-medium rounded-xl p-5 ${!review.is_visible ? 'border-l-4 border-yellow-500' : 'border-l-4 border-green-500'}`}
                        >
                            <div className="flex items-start gap-4">
                                {/* User Avatar */}
                                <img
                                    src={review.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user_id}`}
                                    alt=""
                                    className="w-12 h-12 rounded-full"
                                />
                                
                                {/* Review Content */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-semibold text-white">
                                            {review.user?.first_name} {review.user?.last_name}
                                        </span>
                                        <span className="text-sm text-slate-500">{review.user?.email}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs ${review.is_visible ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                            {review.is_visible ? 'Visible' : 'Hidden'}
                                        </span>
                                        {review.is_edited && (
                                            <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
                                                Edited
                                            </span>
                                        )}
                                    </div>
                                    
                                    <p className="text-sm text-slate-400 mb-2">
                                        Course: <span className="text-purple-400">{review.course?.title}</span>
                                    </p>
                                    
                                    {/* Rating */}
                                    <div className="flex items-center gap-1 mb-3">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
                                            />
                                        ))}
                                        <span className="text-sm text-slate-500 ml-2">{review.rating}/5</span>
                                    </div>
                                    
                                    {/* Comment */}
                                    <p className="text-slate-300">{review.comment}</p>
                                    
                                    <p className="text-xs text-slate-600 mt-3">
                                        {new Date(review.created_at).toLocaleDateString('en-US', { 
                                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className={review.is_visible ? "text-green-400 hover:text-green-300" : "text-yellow-400 hover:text-yellow-300"}
                                        onClick={() => handleToggleVisibility(review.id, review.is_visible)}
                                        title={review.is_visible ? "Hide review" : "Show review"}
                                        data-testid={`toggle-visibility-${review.id}`}
                                    >
                                        {review.is_visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-blue-400 hover:text-blue-300"
                                        onClick={() => openEditDialog(review)}
                                        title="Edit review"
                                        data-testid={`edit-review-${review.id}`}
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-red-400 hover:text-red-300"
                                        onClick={() => handleDeleteReview(review.id)}
                                        title="Delete review"
                                        data-testid={`delete-review-${review.id}`}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
                <DialogContent className="glass-heavy border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-white">Edit Review</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Rating</Label>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setEditForm({ ...editForm, rating: star })}
                                        className="focus:outline-none"
                                    >
                                        <Star
                                            className={`w-8 h-8 transition-colors ${
                                                star <= editForm.rating 
                                                    ? 'text-yellow-400 fill-yellow-400' 
                                                    : 'text-slate-600 hover:text-yellow-400'
                                            }`}
                                        />
                                    </button>
                                ))}
                                <span className="text-slate-400 ml-2">{editForm.rating}/5</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Comment</Label>
                            <Textarea
                                value={editForm.comment}
                                onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                                className="input-neon min-h-[120px]"
                                placeholder="Review comment..."
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setEditDialog({ open: false, review: null })}>
                            Cancel
                        </Button>
                        <Button className="btn-primary" onClick={handleEditReview}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
