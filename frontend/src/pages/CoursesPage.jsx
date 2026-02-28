import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import {
    Search,
    Filter,
    Star,
    Clock,
    Users,
    ChevronDown,
    Grid,
    List,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CoursesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [viewMode, setViewMode] = useState("grid");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const currentPage = parseInt(searchParams.get("page") || "1");
    const searchQuery = searchParams.get("search") || "";
    const categoryFilter = searchParams.get("category") || "";
    const levelFilter = searchParams.get("level") || "";
    const sortBy = searchParams.get("sort") || "created_at";

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [coursesRes, categoriesRes] = await Promise.all([
                    axios.get(`${API}/courses`, {
                        params: {
                            page: currentPage,
                            limit: 12,
                            search: searchQuery || undefined,
                            category: categoryFilter || undefined,
                            level: levelFilter || undefined,
                            sort_by: sortBy,
                            sort_order: "desc"
                        }
                    }),
                    axios.get(`${API}/courses/categories`)
                ]);
                
                setCourses(coursesRes.data.courses || []);
                setTotalPages(coursesRes.data.pages || 1);
                setCategories(categoriesRes.data.categories || []);
            } catch (error) {
                console.error("Failed to fetch courses:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [currentPage, searchQuery, categoryFilter, levelFilter, sortBy]);

    const updateFilter = (key, value) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        newParams.set("page", "1");
        setSearchParams(newParams);
    };

    const clearFilters = () => {
        setSearchParams({});
    };

    const hasActiveFilters = searchQuery || categoryFilter || levelFilter;

    return (
        <div className="min-h-screen bg-[#0F172A] py-8" data-testid="courses-page">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="font-outfit text-3xl sm:text-4xl font-bold text-white mb-2">
                        Explore Courses
                    </h1>
                    <p className="text-slate-400">
                        Discover courses taught by industry experts
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row gap-4 mb-8">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <Input
                            type="text"
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => updateFilter("search", e.target.value)}
                            className="pl-12 input-neon"
                            data-testid="search-courses-input"
                        />
                    </div>

                    {/* Desktop Filters */}
                    <div className="hidden lg:flex gap-3">
                        <Select value={categoryFilter || "all"} onValueChange={(v) => updateFilter("category", v === "all" ? "" : v)}>
                            <SelectTrigger className="w-48 input-neon" data-testid="category-filter">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={levelFilter || "all"} onValueChange={(v) => updateFilter("level", v === "all" ? "" : v)}>
                            <SelectTrigger className="w-40 input-neon" data-testid="level-filter">
                                <SelectValue placeholder="All Levels" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Levels</SelectItem>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={sortBy} onValueChange={(v) => updateFilter("sort", v)}>
                            <SelectTrigger className="w-40 input-neon" data-testid="sort-filter">
                                <SelectValue placeholder="Sort By" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="created_at">Newest</SelectItem>
                                <SelectItem value="price">Price</SelectItem>
                                <SelectItem value="title">Title</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Mobile Filter Button */}
                    <Button
                        variant="outline"
                        className="lg:hidden border-slate-700 text-slate-400"
                        onClick={() => setIsFilterOpen(true)}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                    </Button>

                    {/* View Toggle */}
                    <div className="hidden sm:flex items-center gap-1 glass-light rounded-lg p-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={viewMode === "grid" ? "bg-purple-600/20 text-purple-400" : "text-slate-500"}
                            onClick={() => setViewMode("grid")}
                        >
                            <Grid className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={viewMode === "list" ? "bg-purple-600/20 text-purple-400" : "text-slate-500"}
                            onClick={() => setViewMode("list")}
                        >
                            <List className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Active Filters */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {searchQuery && (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-light text-sm text-slate-300">
                                Search: {searchQuery}
                                <button onClick={() => updateFilter("search", "")} className="hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </span>
                        )}
                        {categoryFilter && (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-light text-sm text-slate-300">
                                {categoryFilter}
                                <button onClick={() => updateFilter("category", "")} className="hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </span>
                        )}
                        {levelFilter && (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-light text-sm text-slate-300">
                                {levelFilter}
                                <button onClick={() => updateFilter("level", "")} className="hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </span>
                        )}
                        <button
                            onClick={clearFilters}
                            className="text-sm text-purple-400 hover:text-purple-300"
                        >
                            Clear all
                        </button>
                    </div>
                )}

                {/* Course Grid */}
                {isLoading ? (
                    <div className={`grid gap-6 ${viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : ""}`}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="glass-medium rounded-xl overflow-hidden">
                                <Skeleton className="aspect-video" />
                                <div className="p-5 space-y-3">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : courses.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full glass-light flex items-center justify-center">
                            <Search className="w-10 h-10 text-slate-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No courses found</h3>
                        <p className="text-slate-400 mb-6">Try adjusting your search or filters</p>
                        <Button onClick={clearFilters} className="btn-secondary">
                            Clear Filters
                        </Button>
                    </div>
                ) : (
                    <div className={`grid gap-6 ${viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : ""}`}>
                        {courses.map((course, index) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link
                                    to={`/courses/${course.id}`}
                                    className={`block card-course course-card-glow group ${
                                        viewMode === "list" ? "flex" : ""
                                    }`}
                                    data-testid={`course-card-${course.id}`}
                                >
                                    <div className={`relative overflow-hidden ${
                                        viewMode === "list" ? "w-64 flex-shrink-0" : "aspect-video"
                                    }`}>
                                        <img
                                            src={course.thumbnail_url || "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800"}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-600 text-white">
                                            {course.category}
                                        </span>
                                        {course.discount_price && (
                                            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
                                                SALE
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-5 flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                course.level === "beginner" ? "bg-green-500/20 text-green-400" :
                                                course.level === "intermediate" ? "bg-yellow-500/20 text-yellow-400" :
                                                "bg-red-500/20 text-red-400"
                                            }`}>
                                                {course.level}
                                            </span>
                                        </div>
                                        <h3 className="font-outfit text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
                                            {course.title}
                                        </h3>
                                        <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                                            {course.short_description}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                    {course.average_rating?.toFixed(1) || "New"}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    {course.enrollment_count || 0}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                {course.discount_price ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-500 line-through text-sm">
                                                            ₹{course.price}
                                                        </span>
                                                        <span className="text-xl font-bold text-purple-400">
                                                            ₹{course.discount_price}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xl font-bold text-purple-400">
                                                        ₹{course.price}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-12">
                        {[...Array(totalPages)].map((_, i) => (
                            <Button
                                key={i}
                                variant={currentPage === i + 1 ? "default" : "outline"}
                                size="sm"
                                onClick={() => updateFilter("page", String(i + 1))}
                                className={currentPage === i + 1 ? "bg-purple-600 hover:bg-purple-500" : "border-slate-700 text-slate-400"}
                            >
                                {i + 1}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            {/* Mobile Filter Modal */}
            {isFilterOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsFilterOpen(false)} />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        className="absolute bottom-0 left-0 right-0 glass-heavy rounded-t-3xl p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-outfit text-xl font-semibold text-white">Filters</h3>
                            <Button variant="ghost" size="icon" onClick={() => setIsFilterOpen(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-slate-400 mb-2 block">Category</label>
                                <Select value={categoryFilter || "all"} onValueChange={(v) => updateFilter("category", v === "all" ? "" : v)}>
                                    <SelectTrigger className="w-full input-neon">
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm text-slate-400 mb-2 block">Level</label>
                                <Select value={levelFilter || "all"} onValueChange={(v) => updateFilter("level", v === "all" ? "" : v)}>
                                    <SelectTrigger className="w-full input-neon">
                                        <SelectValue placeholder="All Levels" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Levels</SelectItem>
                                        <SelectItem value="beginner">Beginner</SelectItem>
                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                        <SelectItem value="advanced">Advanced</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm text-slate-400 mb-2 block">Sort By</label>
                                <Select value={sortBy} onValueChange={(v) => updateFilter("sort", v)}>
                                    <SelectTrigger className="w-full input-neon">
                                        <SelectValue placeholder="Sort By" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="created_at">Newest</SelectItem>
                                        <SelectItem value="price">Price</SelectItem>
                                        <SelectItem value="title">Title</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                variant="outline"
                                className="flex-1 border-slate-700 text-slate-400"
                                onClick={clearFilters}
                            >
                                Clear All
                            </Button>
                            <Button
                                className="flex-1 btn-primary"
                                onClick={() => setIsFilterOpen(false)}
                            >
                                Apply Filters
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
