import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
    BookOpen,
    Plus,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    MoreVertical
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
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminCoursesPage() {
    const { accessToken } = useAuthStore();
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newCourse, setNewCourse] = useState({
        title: "",
        description: "",
        short_description: "",
        price: "",
        discount_price: "",
        category: "",
        level: "beginner",
        is_published: false
    });

    useEffect(() => {
        fetchCourses();
    }, [accessToken]);

    const fetchCourses = async () => {
        try {
            const response = await axios.get(`${API}/admin/courses`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setCourses(response.data.courses || []);
        } catch (error) {
            console.error("Failed to fetch courses:", error);
            toast.error("Failed to load courses");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCourse = async () => {
        if (!newCourse.title || !newCourse.price || !newCourse.category) {
            toast.error("Please fill in required fields");
            return;
        }

        setIsCreating(true);
        try {
            await axios.post(
                `${API}/admin/courses`,
                {
                    ...newCourse,
                    price: parseFloat(newCourse.price),
                    discount_price: newCourse.discount_price ? parseFloat(newCourse.discount_price) : null
                },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success("Course created!");
            setNewCourse({
                title: "",
                description: "",
                short_description: "",
                price: "",
                discount_price: "",
                category: "",
                level: "beginner",
                is_published: false
            });
            setShowCreateDialog(false);
            fetchCourses();
        } catch (error) {
            toast.error("Failed to create course");
        } finally {
            setIsCreating(false);
        }
    };

    const handleTogglePublish = async (courseId, isPublished) => {
        try {
            await axios.put(
                `${API}/admin/courses/${courseId}`,
                { is_published: !isPublished },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success(isPublished ? "Course unpublished" : "Course published");
            fetchCourses();
        } catch (error) {
            toast.error("Failed to update course");
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (!confirm("Are you sure you want to delete this course?")) return;
        
        try {
            await axios.delete(`${API}/admin/courses/${courseId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            toast.success("Course deleted");
            fetchCourses();
        } catch (error) {
            toast.error("Failed to delete course");
        }
    };

    return (
        <div className="space-y-6" data-testid="admin-courses-page">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-outfit text-2xl font-bold text-white">Course Management</h1>
                    <p className="text-slate-400">Create and manage courses</p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="btn-primary" data-testid="create-course-btn">
                            <Plus className="w-4 h-4 mr-2" />
                            New Course
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-heavy border-white/10 max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-white">Create New Course</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Title *</Label>
                                <Input
                                    placeholder="Course title"
                                    value={newCourse.title}
                                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                                    className="input-neon"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Short Description</Label>
                                <Input
                                    placeholder="Brief description"
                                    value={newCourse.short_description}
                                    onChange={(e) => setNewCourse({ ...newCourse, short_description: e.target.value })}
                                    className="input-neon"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Full Description</Label>
                                <Textarea
                                    placeholder="Detailed course description..."
                                    value={newCourse.description}
                                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                                    className="input-neon min-h-[100px]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Price *</Label>
                                    <Input
                                        type="number"
                                        placeholder="99.99"
                                        value={newCourse.price}
                                        onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })}
                                        className="input-neon"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Discount Price</Label>
                                    <Input
                                        type="number"
                                        placeholder="49.99"
                                        value={newCourse.discount_price}
                                        onChange={(e) => setNewCourse({ ...newCourse, discount_price: e.target.value })}
                                        className="input-neon"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Category *</Label>
                                    <Select
                                        value={newCourse.category}
                                        onValueChange={(v) => setNewCourse({ ...newCourse, category: v })}
                                    >
                                        <SelectTrigger className="input-neon">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Development">Development</SelectItem>
                                            <SelectItem value="Design">Design</SelectItem>
                                            <SelectItem value="Marketing">Marketing</SelectItem>
                                            <SelectItem value="Business">Business</SelectItem>
                                            <SelectItem value="Data Science">Data Science</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Level</Label>
                                    <Select
                                        value={newCourse.level}
                                        onValueChange={(v) => setNewCourse({ ...newCourse, level: v })}
                                    >
                                        <SelectTrigger className="input-neon">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="beginner">Beginner</SelectItem>
                                            <SelectItem value="intermediate">Intermediate</SelectItem>
                                            <SelectItem value="advanced">Advanced</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button
                                className="w-full btn-primary"
                                onClick={handleCreateCourse}
                                disabled={isCreating}
                            >
                                {isCreating ? "Creating..." : "Create Course"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Courses Grid */}
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
            ) : courses.length === 0 ? (
                <div className="text-center py-16 glass-medium rounded-xl">
                    <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No courses yet. Create your first course!</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course, index) => (
                        <motion.div
                            key={course.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-medium rounded-xl overflow-hidden group"
                        >
                            <div className="relative aspect-video">
                                <img
                                    src={course.thumbnail_url || "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800"}
                                    alt={course.title}
                                    className="w-full h-full object-cover"
                                />
                                <Link
                                    to={`/admin/courses/${course.id}`}
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                                >
                                    <Button size="sm" variant="secondary" className="bg-white/20">
                                        <Edit className="w-4 h-4 mr-1" />
                                        Edit Course
                                    </Button>
                                </Link>
                                <span className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
                                    course.is_published
                                        ? "bg-green-500/80 text-white"
                                        : "bg-yellow-500/80 text-white"
                                }`}>
                                    {course.is_published ? "Published" : "Draft"}
                                </span>
                            </div>
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="font-semibold text-white line-clamp-2">
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {course.category} • {course.level}
                                        </p>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-slate-400 flex-shrink-0">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="glass-heavy border-white/10">
                                            <DropdownMenuItem
                                                className="text-slate-300"
                                                onClick={() => handleTogglePublish(course.id, course.is_published)}
                                            >
                                                {course.is_published ? (
                                                    <>
                                                        <EyeOff className="w-4 h-4 mr-2" />
                                                        Unpublish
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Publish
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-400"
                                                onClick={() => handleDeleteCourse(course.id)}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                    <div>
                                        {course.discount_price ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500 line-through text-sm">
                                                    ${course.price}
                                                </span>
                                                <span className="text-lg font-bold text-purple-400">
                                                    ${course.discount_price}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-lg font-bold text-purple-400">
                                                ${course.price}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm text-slate-500">
                                        {course.enrollment_count || 0} students
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
