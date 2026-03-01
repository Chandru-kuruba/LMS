import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
    ArrowLeft,
    Plus,
    Edit,
    Trash2,
    GripVertical,
    Video,
    FileText,
    HelpCircle,
    Upload,
    Save,
    Eye,
    EyeOff,
    ChevronDown,
    ChevronUp,
    Check,
    X,
    Loader2
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
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CourseEditorPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { accessToken } = useAuthStore();
    const [course, setCourse] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeModuleId, setActiveModuleId] = useState(null);
    
    // Module dialog state
    const [moduleDialog, setModuleDialog] = useState({ open: false, mode: "create", data: null });
    // Lesson dialog state
    const [lessonDialog, setLessonDialog] = useState({ open: false, mode: "create", moduleId: null, data: null });
    // Quiz dialog state
    const [quizDialog, setQuizDialog] = useState({ open: false, mode: "create", moduleId: null, data: null });
    // Question dialog state
    const [questionDialog, setQuestionDialog] = useState({ open: false, mode: "create", quizId: null, data: null });
    
    // Form states
    const [moduleForm, setModuleForm] = useState({ title: "", description: "", order: 0 });
    const [lessonForm, setLessonForm] = useState({
        title: "", description: "", content_type: "video", content: "", video_key: "", duration_minutes: 0, order: 0, is_preview: false
    });
    const [quizForm, setQuizForm] = useState({ title: "", description: "", passing_score: 70, time_limit_minutes: null });
    const [questionForm, setQuestionForm] = useState({
        question_text: "", question_type: "multiple_choice", options: ["", "", "", ""], correct_answer: 0, points: 10
    });
    
    const [uploadProgress, setUploadProgress] = useState(null);
    const [availableBuckets, setAvailableBuckets] = useState([]);
    const [selectedBucket, setSelectedBucket] = useState("");

    useEffect(() => {
        fetchCourse();
        fetchBuckets();
    }, [courseId, accessToken]);

    const fetchBuckets = async () => {
        try {
            const response = await axios.get(`${API}/admin/upload/buckets`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setAvailableBuckets(response.data.buckets || []);
            // Set default bucket
            const defaultBucket = response.data.buckets?.find(b => b.is_default);
            if (defaultBucket) setSelectedBucket(defaultBucket.id);
            else if (response.data.buckets?.length > 0) setSelectedBucket(response.data.buckets[0].id);
        } catch (error) {
            console.log("No buckets configured");
        }
    };

    const fetchCourse = async () => {
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

    const handleSaveCourse = async (updates) => {
        setIsSaving(true);
        try {
            await axios.put(
                `${API}/admin/courses/${courseId}`,
                updates,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success("Course updated!");
            fetchCourse();
        } catch (error) {
            toast.error("Failed to update course");
        } finally {
            setIsSaving(false);
        }
    };

    // Module handlers
    const handleCreateModule = async () => {
        try {
            const order = (course.modules?.length || 0) + 1;
            await axios.post(
                `${API}/admin/courses/${courseId}/modules`,
                { ...moduleForm, order },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success("Module created!");
            setModuleDialog({ open: false, mode: "create", data: null });
            setModuleForm({ title: "", description: "", order: 0 });
            fetchCourse();
        } catch (error) {
            toast.error("Failed to create module");
        }
    };

    const handleUpdateModule = async () => {
        try {
            await axios.put(
                `${API}/admin/modules/${moduleDialog.data.id}`,
                moduleForm,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success("Module updated!");
            setModuleDialog({ open: false, mode: "create", data: null });
            fetchCourse();
        } catch (error) {
            toast.error("Failed to update module");
        }
    };

    const handleDeleteModule = async (moduleId) => {
        if (!confirm("Delete this module and all its lessons?")) return;
        try {
            await axios.delete(`${API}/admin/modules/${moduleId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            toast.success("Module deleted!");
            fetchCourse();
        } catch (error) {
            toast.error("Failed to delete module");
        }
    };

    // Lesson handlers
    const handleCreateLesson = async () => {
        try {
            const module = course.modules?.find(m => m.id === lessonDialog.moduleId);
            const order = (module?.lessons?.length || 0) + 1;
            await axios.post(
                `${API}/admin/modules/${lessonDialog.moduleId}/lessons`,
                { ...lessonForm, order },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success("Lesson created!");
            setLessonDialog({ open: false, mode: "create", moduleId: null, data: null });
            setLessonForm({ title: "", description: "", content_type: "video", content: "", video_key: "", duration_minutes: 0, order: 0, is_preview: false });
            fetchCourse();
        } catch (error) {
            toast.error("Failed to create lesson");
        }
    };

    const handleUpdateLesson = async () => {
        try {
            await axios.put(
                `${API}/admin/lessons/${lessonDialog.data.id}`,
                lessonForm,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success("Lesson updated!");
            setLessonDialog({ open: false, mode: "create", moduleId: null, data: null });
            fetchCourse();
        } catch (error) {
            toast.error("Failed to update lesson");
        }
    };

    const handleDeleteLesson = async (lessonId) => {
        if (!confirm("Delete this lesson?")) return;
        try {
            await axios.delete(`${API}/admin/lessons/${lessonId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            toast.success("Lesson deleted!");
            fetchCourse();
        } catch (error) {
            toast.error("Failed to delete lesson");
        }
    };

    // Quiz handlers
    const handleCreateQuiz = async () => {
        try {
            await axios.post(
                `${API}/admin/modules/${quizDialog.moduleId}/quiz`,
                quizForm,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success("Quiz created!");
            setQuizDialog({ open: false, mode: "create", moduleId: null, data: null });
            setQuizForm({ title: "", description: "", passing_score: 70, time_limit_minutes: null });
            fetchCourse();
        } catch (error) {
            toast.error("Failed to create quiz");
        }
    };

    const handleDeleteQuiz = async (quizId) => {
        if (!confirm("Delete this quiz and all questions?")) return;
        try {
            await axios.delete(`${API}/admin/quizzes/${quizId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            toast.success("Quiz deleted!");
            fetchCourse();
        } catch (error) {
            toast.error("Failed to delete quiz");
        }
    };

    // Question handlers
    const handleCreateQuestion = async () => {
        try {
            await axios.post(
                `${API}/admin/quizzes/${questionDialog.quizId}/questions`,
                questionForm,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success("Question added!");
            setQuestionDialog({ open: false, mode: "create", quizId: null, data: null });
            setQuestionForm({ question_text: "", question_type: "multiple_choice", options: ["", "", "", ""], correct_answer: 0, points: 10 });
            fetchCourse();
        } catch (error) {
            toast.error("Failed to add question");
        }
    };

    const handleDeleteQuestion = async (questionId) => {
        if (!confirm("Delete this question?")) return;
        try {
            await axios.delete(`${API}/admin/questions/${questionId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            toast.success("Question deleted!");
            fetchCourse();
        } catch (error) {
            toast.error("Failed to delete question");
        }
    };

    // Video upload - streams through server to R2
    const handleVideoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileSizeMB = file.size / (1024 * 1024);
        
        if (fileSizeMB > 5000) {
            toast.error("File too large. Maximum size is 5GB");
            return;
        }

        if (!selectedBucket && availableBuckets.length > 0) {
            toast.error("Please select a storage bucket first");
            return;
        }

        toast.info(`Uploading ${Math.round(fileSizeMB)}MB video...`);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append("file", file);

        try {
            // Use bucket-specific upload if bucket is selected
            const uploadUrl = selectedBucket 
                ? `${API}/admin/upload/video/to-bucket/${selectedBucket}`
                : `${API}/admin/upload/video`;

            const response = await axios.post(uploadUrl, formData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "multipart/form-data"
                },
                timeout: 0,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percent);
                }
            });
            
            // Store bucket info with video key
            const videoKeyWithBucket = selectedBucket 
                ? `${selectedBucket}:${response.data.video_key}`
                : response.data.video_key;
            
            setLessonForm({ ...lessonForm, video_key: videoKeyWithBucket });
            toast.success(`Video uploaded to ${response.data.bucket_name || 'storage'}! (${Math.round(response.data.size / (1024 * 1024))}MB)`);
        } catch (error) {
            console.error("Upload error:", error);
            toast.error(error.response?.data?.detail || "Failed to upload video. Check your connection and try again.");
        } finally {
            setUploadProgress(null);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="text-center py-16">
                <p className="text-slate-400">Course not found</p>
                <Link to="/admin/courses">
                    <Button className="mt-4 btn-secondary">Back to Courses</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="course-editor-page">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/admin/courses">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="font-outfit text-2xl font-bold text-white">{course.title}</h1>
                        <p className="text-slate-400">{course.category} • {course.level}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className={course.is_published ? "border-green-500 text-green-400" : "border-yellow-500 text-yellow-400"}
                        onClick={() => handleSaveCourse({ is_published: !course.is_published })}
                    >
                        {course.is_published ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                        {course.is_published ? "Published" : "Draft"}
                    </Button>
                </div>
            </div>

            {/* Course Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="glass-medium rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{course.modules?.length || 0}</p>
                    <p className="text-sm text-slate-500">Modules</p>
                </div>
                <div className="glass-medium rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">
                        {course.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0}
                    </p>
                    <p className="text-sm text-slate-500">Lessons</p>
                </div>
                <div className="glass-medium rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">
                        {course.modules?.filter(m => m.quiz).length || 0}
                    </p>
                    <p className="text-sm text-slate-500">Quizzes</p>
                </div>
                <div className="glass-medium rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{course.enrollment_count || 0}</p>
                    <p className="text-sm text-slate-500">Students</p>
                </div>
            </div>

            {/* Modules Section */}
            <div className="glass-heavy rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-outfit text-xl font-bold text-white">Course Content</h2>
                    <Button
                        className="btn-primary"
                        onClick={() => {
                            setModuleForm({ title: "", description: "", order: (course.modules?.length || 0) + 1 });
                            setModuleDialog({ open: true, mode: "create", data: null });
                        }}
                        data-testid="add-module-btn"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Module
                    </Button>
                </div>

                {course.modules?.length === 0 ? (
                    <div className="text-center py-12 glass-light rounded-xl">
                        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No modules yet. Add your first module to get started.</p>
                    </div>
                ) : (
                    <Accordion type="multiple" className="space-y-4">
                        {course.modules?.map((module, moduleIndex) => (
                            <AccordionItem key={module.id} value={module.id} className="glass-medium rounded-xl border-none overflow-hidden">
                                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-white/5">
                                    <div className="flex items-center gap-4 flex-1">
                                        <span className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400 font-semibold">
                                            {moduleIndex + 1}
                                        </span>
                                        <div className="text-left flex-1">
                                            <p className="font-semibold text-white">{module.title}</p>
                                            <p className="text-sm text-slate-500">
                                                {module.lessons?.length || 0} lessons {module.quiz && "• 1 quiz"}
                                            </p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-4">
                                    {/* Module Actions */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-slate-700"
                                            onClick={() => {
                                                setModuleForm({ title: module.title, description: module.description || "", order: module.order });
                                                setModuleDialog({ open: true, mode: "edit", data: module });
                                            }}
                                        >
                                            <Edit className="w-3 h-3 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-slate-700"
                                            onClick={() => {
                                                setLessonForm({ title: "", description: "", content_type: "video", content: "", video_key: "", duration_minutes: 0, order: (module.lessons?.length || 0) + 1, is_preview: false });
                                                setLessonDialog({ open: true, mode: "create", moduleId: module.id, data: null });
                                            }}
                                        >
                                            <Plus className="w-3 h-3 mr-1" />
                                            Add Lesson
                                        </Button>
                                        {!module.quiz && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-slate-700"
                                                onClick={() => {
                                                    setQuizForm({ title: `${module.title} Quiz`, description: "", passing_score: 70, time_limit_minutes: null });
                                                    setQuizDialog({ open: true, mode: "create", moduleId: module.id, data: null });
                                                }}
                                            >
                                                <HelpCircle className="w-3 h-3 mr-1" />
                                                Add Quiz
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                            onClick={() => handleDeleteModule(module.id)}
                                        >
                                            <Trash2 className="w-3 h-3 mr-1" />
                                            Delete
                                        </Button>
                                    </div>

                                    {/* Lessons List */}
                                    <div className="space-y-2 ml-4">
                                        {module.lessons?.map((lesson, lessonIndex) => (
                                            <div key={lesson.id} className="flex items-center gap-3 p-3 glass-light rounded-lg group">
                                                <span className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-xs text-slate-400">
                                                    {lessonIndex + 1}
                                                </span>
                                                {lesson.content_type === "video" ? (
                                                    <Video className="w-4 h-4 text-cyan-400" />
                                                ) : (
                                                    <FileText className="w-4 h-4 text-purple-400" />
                                                )}
                                                <span className="flex-1 text-slate-300">{lesson.title}</span>
                                                {lesson.is_preview && (
                                                    <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">Preview</span>
                                                )}
                                                <span className="text-sm text-slate-500">{lesson.duration_minutes}m</span>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7"
                                                        onClick={() => {
                                                            setLessonForm({
                                                                title: lesson.title,
                                                                description: lesson.description || "",
                                                                content_type: lesson.content_type,
                                                                content: lesson.content || "",
                                                                video_key: lesson.video_key || "",
                                                                duration_minutes: lesson.duration_minutes,
                                                                order: lesson.order,
                                                                is_preview: lesson.is_preview
                                                            });
                                                            setLessonDialog({ open: true, mode: "edit", moduleId: module.id, data: lesson });
                                                        }}
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 text-red-400"
                                                        onClick={() => handleDeleteLesson(lesson.id)}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Quiz */}
                                        {module.quiz && (
                                            <div className="p-3 glass-light rounded-lg border border-purple-500/30">
                                                <div className="flex items-center gap-3">
                                                    <HelpCircle className="w-4 h-4 text-purple-400" />
                                                    <span className="flex-1 text-slate-300 font-medium">{module.quiz.title}</span>
                                                    <span className="text-sm text-slate-500">
                                                        {module.quiz.questions?.length || 0} questions • Pass: {module.quiz.passing_score}%
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-slate-700"
                                                        onClick={() => {
                                                            setQuestionForm({ question_text: "", question_type: "multiple_choice", options: ["", "", "", ""], correct_answer: 0, points: 10 });
                                                            setQuestionDialog({ open: true, mode: "create", quizId: module.quiz.id, data: null });
                                                        }}
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" />
                                                        Question
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 text-red-400"
                                                        onClick={() => handleDeleteQuiz(module.quiz.id)}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                                {module.quiz.questions?.length > 0 && (
                                                    <div className="mt-3 space-y-2 pl-7">
                                                        {module.quiz.questions.map((q, qIndex) => (
                                                            <div key={q.id} className="flex items-center gap-2 text-sm text-slate-400 group">
                                                                <span>Q{qIndex + 1}:</span>
                                                                <span className="flex-1 truncate">{q.question_text}</span>
                                                                <span className="text-xs">{q.points} pts</span>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-400"
                                                                    onClick={() => handleDeleteQuestion(q.id)}
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </div>

            {/* Module Dialog */}
            <Dialog open={moduleDialog.open} onOpenChange={(open) => setModuleDialog({ ...moduleDialog, open })}>
                <DialogContent className="glass-heavy border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {moduleDialog.mode === "create" ? "Add Module" : "Edit Module"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Title</Label>
                            <Input
                                placeholder="Module title"
                                value={moduleForm.title}
                                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                                className="input-neon"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Description</Label>
                            <Textarea
                                placeholder="Module description (optional)"
                                value={moduleForm.description}
                                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                                className="input-neon"
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button
                            className="btn-primary"
                            onClick={moduleDialog.mode === "create" ? handleCreateModule : handleUpdateModule}
                        >
                            {moduleDialog.mode === "create" ? "Create Module" : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Lesson Dialog */}
            <Dialog open={lessonDialog.open} onOpenChange={(open) => setLessonDialog({ ...lessonDialog, open })}>
                <DialogContent className="glass-heavy border-white/10 max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {lessonDialog.mode === "create" ? "Add Lesson" : "Edit Lesson"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Title</Label>
                            <Input
                                placeholder="Lesson title"
                                value={lessonForm.title}
                                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                                className="input-neon"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Description</Label>
                            <Textarea
                                placeholder="Lesson description"
                                value={lessonForm.description}
                                onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                                className="input-neon"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Content Type</Label>
                                <Select
                                    value={lessonForm.content_type}
                                    onValueChange={(v) => setLessonForm({ ...lessonForm, content_type: v })}
                                >
                                    <SelectTrigger className="input-neon">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="video">Video</SelectItem>
                                        <SelectItem value="text">Text</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Duration (minutes)</Label>
                                <Input
                                    type="number"
                                    value={lessonForm.duration_minutes}
                                    onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: parseInt(e.target.value) || 0 })}
                                    className="input-neon"
                                />
                            </div>
                        </div>
                        {lessonForm.content_type === "video" && (
                            <div className="space-y-3">
                                <Label className="text-slate-300">Storage Bucket</Label>
                                {availableBuckets.length > 0 ? (
                                    <select
                                        value={selectedBucket}
                                        onChange={(e) => setSelectedBucket(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
                                    >
                                        {availableBuckets.map(bucket => (
                                            <option key={bucket.id} value={bucket.id}>
                                                {bucket.name} ({bucket.bucket_name}) {bucket.is_default ? '- Default' : ''}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-sm text-yellow-400">
                                        No storage buckets configured. Go to Settings → R2 Buckets to add one.
                                    </p>
                                )}
                                
                                <Label className="text-slate-300">Video File</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        type="file"
                                        accept="video/*"
                                        onChange={handleVideoUpload}
                                        className="input-neon"
                                        disabled={availableBuckets.length === 0}
                                    />
                                    {uploadProgress !== null && (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                                            <span className="text-sm text-purple-400">{uploadProgress}%</span>
                                        </div>
                                    )}
                                </div>
                                {lessonForm.video_key && (
                                    <p className="text-sm text-green-400 flex items-center gap-1">
                                        <Check className="w-4 h-4" />
                                        Video uploaded: {lessonForm.video_key.split(':').pop()}
                                    </p>
                                )}
                            </div>
                        )}
                        {lessonForm.content_type === "text" && (
                            <div className="space-y-2">
                                <Label className="text-slate-300">Content</Label>
                                <Textarea
                                    placeholder="Lesson content..."
                                    value={lessonForm.content}
                                    onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                                    className="input-neon min-h-[200px]"
                                />
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_preview"
                                checked={lessonForm.is_preview}
                                onChange={(e) => setLessonForm({ ...lessonForm, is_preview: e.target.checked })}
                                className="rounded bg-slate-800 border-slate-700"
                            />
                            <Label htmlFor="is_preview" className="text-slate-300">Allow preview (non-enrolled users can view)</Label>
                        </div>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button
                            className="btn-primary"
                            onClick={lessonDialog.mode === "create" ? handleCreateLesson : handleUpdateLesson}
                        >
                            {lessonDialog.mode === "create" ? "Create Lesson" : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Quiz Dialog */}
            <Dialog open={quizDialog.open} onOpenChange={(open) => setQuizDialog({ ...quizDialog, open })}>
                <DialogContent className="glass-heavy border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-white">Create Quiz</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Title</Label>
                            <Input
                                placeholder="Quiz title"
                                value={quizForm.title}
                                onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                                className="input-neon"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Description</Label>
                            <Textarea
                                placeholder="Quiz description"
                                value={quizForm.description}
                                onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                                className="input-neon"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Passing Score (%)</Label>
                                <Input
                                    type="number"
                                    value={quizForm.passing_score}
                                    onChange={(e) => setQuizForm({ ...quizForm, passing_score: parseInt(e.target.value) || 70 })}
                                    className="input-neon"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Time Limit (min)</Label>
                                <Input
                                    type="number"
                                    placeholder="Optional"
                                    value={quizForm.time_limit_minutes || ""}
                                    onChange={(e) => setQuizForm({ ...quizForm, time_limit_minutes: e.target.value ? parseInt(e.target.value) : null })}
                                    className="input-neon"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button className="btn-primary" onClick={handleCreateQuiz}>
                            Create Quiz
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Question Dialog */}
            <Dialog open={questionDialog.open} onOpenChange={(open) => setQuestionDialog({ ...questionDialog, open })}>
                <DialogContent className="glass-heavy border-white/10 max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-white">Add Question</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Question</Label>
                            <Textarea
                                placeholder="Enter your question..."
                                value={questionForm.question_text}
                                onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                                className="input-neon"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Options</Label>
                            {questionForm.options.map((opt, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="correct_answer"
                                        checked={questionForm.correct_answer === index}
                                        onChange={() => setQuestionForm({ ...questionForm, correct_answer: index })}
                                        className="text-purple-600"
                                    />
                                    <Input
                                        placeholder={`Option ${index + 1}`}
                                        value={opt}
                                        onChange={(e) => {
                                            const newOptions = [...questionForm.options];
                                            newOptions[index] = e.target.value;
                                            setQuestionForm({ ...questionForm, options: newOptions });
                                        }}
                                        className="input-neon flex-1"
                                    />
                                </div>
                            ))}
                            <p className="text-xs text-slate-500">Select the radio button next to the correct answer</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Points</Label>
                            <Input
                                type="number"
                                value={questionForm.points}
                                onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) || 10 })}
                                className="input-neon w-32"
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button className="btn-primary" onClick={handleCreateQuestion}>
                            Add Question
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
