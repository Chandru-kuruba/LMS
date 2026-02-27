import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { BookOpen, Play, Award, Clock, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function EnrolledCoursesPage() {
    const { user, accessToken } = useAuthStore();
    const [courses, setCourses] = useState([]);
    const [certificates, setCertificates] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [showCertDialog, setShowCertDialog] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [certName, setCertName] = useState("");
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [coursesRes, certsRes] = await Promise.all([
                    axios.get(`${API}/enrolled-courses`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    }),
                    axios.get(`${API}/certificates`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    })
                ]);
                setCourses(coursesRes.data.courses || []);
                // Create a map of course_id to certificate
                const certMap = {};
                (certsRes.data.certificates || []).forEach(cert => {
                    certMap[cert.course_id] = cert;
                });
                setCertificates(certMap);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (accessToken) fetchData();
    }, [accessToken]);

    const handleRequestCertificate = async () => {
        if (!certName.trim()) {
            toast.error("Please enter your name for the certificate");
            return;
        }
        
        setIsRequesting(true);
        try {
            const response = await axios.post(
                `${API}/certificates/${selectedCourse.id}/request`,
                null,
                {
                    params: { name_on_certificate: certName },
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            toast.success("Certificate generated successfully!");
            setCertificates({
                ...certificates,
                [selectedCourse.id]: response.data.certificate
            });
            setShowCertDialog(false);
            setCertName("");
            setSelectedCourse(null);
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to generate certificate");
        } finally {
            setIsRequesting(false);
        }
    };

    const openCertDialog = (course, e) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedCourse(course);
        setCertName(`${user?.first_name || ""} ${user?.last_name || ""}`.trim());
        setShowCertDialog(true);
    };

    const filteredCourses = courses.filter((course) => {
        const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase());
        const matchesFilter =
            filter === "all" ||
            (filter === "in-progress" && course.enrollment?.progress_percentage > 0 && !course.enrollment?.is_completed) ||
            (filter === "completed" && course.enrollment?.is_completed) ||
            (filter === "not-started" && (course.enrollment?.progress_percentage || 0) === 0);
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6" data-testid="enrolled-courses-page">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-outfit text-2xl font-bold text-white">My Courses</h1>
                    <p className="text-slate-400">Continue your learning journey</p>
                </div>
                <Link to="/courses">
                    <Button className="btn-secondary">Browse More Courses</Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                        type="text"
                        placeholder="Search your courses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-12 input-neon"
                    />
                </div>

                <Tabs value={filter} onValueChange={setFilter} className="w-full sm:w-auto">
                    <TabsList className="glass-light">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                        <TabsTrigger value="completed">Completed</TabsTrigger>
                        <TabsTrigger value="not-started">Not Started</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Course Grid */}
            {isLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="glass-medium rounded-xl overflow-hidden">
                            <Skeleton className="aspect-video" />
                            <div className="p-5 space-y-3">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-2 w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="text-center py-16 glass-medium rounded-xl">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                        {courses.length === 0 ? "No enrolled courses" : "No courses match your filter"}
                    </h3>
                    <p className="text-slate-400 mb-6">
                        {courses.length === 0
                            ? "Start your learning journey by enrolling in a course!"
                            : "Try adjusting your search or filter"
                        }
                    </p>
                    <Link to="/courses">
                        <Button className="btn-primary">Browse Courses</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course, index) => (
                        <motion.div
                            key={course.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Link
                                to={`/learn/${course.id}`}
                                className="block card-course course-card-glow group"
                                data-testid={`enrolled-course-${course.id}`}
                            >
                                <div className="relative aspect-video overflow-hidden">
                                    <img
                                        src={course.thumbnail_url || "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800"}
                                        alt={course.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                                    
                                    {/* Progress Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <span className="text-white font-medium">
                                                {Math.round(course.enrollment?.progress_percentage || 0)}% Complete
                                            </span>
                                            {course.enrollment?.is_completed && (
                                                <span className="flex items-center gap-1 text-green-400">
                                                    <Award className="w-4 h-4" />
                                                    Done
                                                </span>
                                            )}
                                        </div>
                                        <Progress
                                            value={course.enrollment?.progress_percentage || 0}
                                            className="h-2 bg-slate-700"
                                        />
                                    </div>

                                    {/* Play Button Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                                        <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center neon-glow-purple">
                                            <Play className="w-7 h-7 text-white ml-1" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-0.5 rounded text-xs bg-purple-600/20 text-purple-400">
                                            {course.category}
                                        </span>
                                    </div>
                                    <h3 className="font-outfit text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
                                        {course.title}
                                    </h3>
                                    <div className="flex items-center justify-between text-sm text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="w-4 h-4" />
                                            {course.enrollment?.completed_lessons?.length || 0} lessons done
                                        </span>
                                        
                                        {/* Certificate Button */}
                                        {course.enrollment?.is_completed && (
                                            certificates[course.id] ? (
                                                <Link 
                                                    to="/certificates"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex items-center gap-1 text-green-400 hover:text-green-300"
                                                >
                                                    <Award className="w-4 h-4" />
                                                    View Certificate
                                                </Link>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 text-xs h-7"
                                                    onClick={(e) => openCertDialog(course, e)}
                                                    data-testid={`request-cert-${course.id}`}
                                                >
                                                    <Award className="w-3 h-3 mr-1" />
                                                    Get Certificate
                                                </Button>
                                            )
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Certificate Request Dialog */}
            <Dialog open={showCertDialog} onOpenChange={setShowCertDialog}>
                <DialogContent className="glass-heavy border-purple-500/30">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Award className="w-5 h-5 text-yellow-400" />
                            Request Certificate
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Enter your name exactly as you want it to appear on your certificate. 
                            <span className="text-yellow-400 block mt-1">
                                Note: This name cannot be changed after submission.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Course</Label>
                            <p className="text-white font-medium">{selectedCourse?.title}</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Your Name on Certificate *</Label>
                            <Input
                                value={certName}
                                onChange={(e) => setCertName(e.target.value)}
                                placeholder="Enter your full name"
                                className="input-neon"
                            />
                        </div>
                        <Button
                            className="w-full btn-primary"
                            onClick={handleRequestCertificate}
                            disabled={isRequesting || !certName.trim()}
                        >
                            {isRequesting ? "Generating..." : "Generate Certificate"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
