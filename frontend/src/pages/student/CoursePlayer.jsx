import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
    Play,
    Check,
    Lock,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    FileText,
    Video,
    HelpCircle,
    Award,
    Menu,
    X,
    Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CoursePlayerPage() {
    const { courseId } = useParams();
    const { user, accessToken } = useAuthStore();
    const [course, setCourse] = useState(null);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [currentModule, setCurrentModule] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isQuizMode, setIsQuizMode] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizResult, setQuizResult] = useState(null);
    const [certificate, setCertificate] = useState(null);
    const [showCertDialog, setShowCertDialog] = useState(false);
    const [certName, setCertName] = useState("");
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const [courseRes, certRes] = await Promise.all([
                    axios.get(`${API}/courses/${courseId}/enrolled`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    }),
                    axios.get(`${API}/certificates/${courseId}`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    }).catch(() => ({ data: { certificate: null } }))
                ]);
                
                setCourse(courseRes.data);
                setCertificate(certRes.data.certificate);
                
                // Set first incomplete lesson as current
                const modules = courseRes.data.modules || [];
                for (const module of modules) {
                    for (const lesson of module.lessons || []) {
                        if (!lesson.progress?.is_completed) {
                            setCurrentModule(module);
                            setCurrentLesson(lesson);
                            return;
                        }
                    }
                }
                // If all completed, show first lesson
                if (modules[0]?.lessons?.[0]) {
                    setCurrentModule(modules[0]);
                    setCurrentLesson(modules[0].lessons[0]);
                }
            } catch (error) {
                console.error("Failed to fetch course:", error);
                toast.error("Failed to load course");
            } finally {
                setIsLoading(false);
            }
        };
        if (accessToken) fetchCourse();
    }, [courseId, accessToken]);

    const handleRequestCertificate = async () => {
        if (!certName.trim()) {
            toast.error("Please enter your name for the certificate");
            return;
        }
        
        setIsRequesting(true);
        try {
            const response = await axios.post(
                `${API}/certificates/${courseId}/request`,
                null,
                {
                    params: { name_on_certificate: certName },
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            toast.success("Certificate generated successfully!");
            setCertificate(response.data.certificate);
            setShowCertDialog(false);
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to generate certificate");
        } finally {
            setIsRequesting(false);
        }
    };

    const handleLessonComplete = async () => {
        if (!currentLesson) return;
        
        try {
            await axios.post(
                `${API}/lessons/${currentLesson.id}/progress`,
                null,
                {
                    params: { watch_percentage: 100 },
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            
            // Refresh course data
            const response = await axios.get(`${API}/courses/${courseId}/enrolled`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setCourse(response.data);
            toast.success("Lesson completed!");
            
            // Move to next lesson
            goToNextLesson();
        } catch (error) {
            toast.error("Failed to mark lesson complete");
        }
    };

    const handleQuizSubmit = async () => {
        if (!currentModule?.quiz) return;
        
        try {
            const response = await axios.post(
                `${API}/quizzes/${currentModule.quiz.id}/submit`,
                { answers: quizAnswers },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            setQuizResult(response.data);
            
            if (response.data.is_passed) {
                toast.success(`Quiz passed! Score: ${response.data.score.toFixed(0)}%`);
            } else {
                toast.error(`Quiz failed. Score: ${response.data.score.toFixed(0)}%`);
            }
        } catch (error) {
            toast.error("Failed to submit quiz");
        }
    };

    const goToNextLesson = () => {
        if (!course || !currentModule || !currentLesson) return;
        
        const modules = course.modules || [];
        const currentModuleIndex = modules.findIndex(m => m.id === currentModule.id);
        const currentLessonIndex = currentModule.lessons?.findIndex(l => l.id === currentLesson.id) || 0;
        
        // Try next lesson in current module
        if (currentModule.lessons && currentLessonIndex < currentModule.lessons.length - 1) {
            setCurrentLesson(currentModule.lessons[currentLessonIndex + 1]);
            return;
        }
        
        // Try first lesson in next module
        if (currentModuleIndex < modules.length - 1) {
            const nextModule = modules[currentModuleIndex + 1];
            setCurrentModule(nextModule);
            setCurrentLesson(nextModule.lessons?.[0] || null);
            setIsQuizMode(false);
        }
    };

    const goToPreviousLesson = () => {
        if (!course || !currentModule || !currentLesson) return;
        
        const modules = course.modules || [];
        const currentModuleIndex = modules.findIndex(m => m.id === currentModule.id);
        const currentLessonIndex = currentModule.lessons?.findIndex(l => l.id === currentLesson.id) || 0;
        
        // Try previous lesson in current module
        if (currentLessonIndex > 0) {
            setCurrentLesson(currentModule.lessons[currentLessonIndex - 1]);
            return;
        }
        
        // Try last lesson in previous module
        if (currentModuleIndex > 0) {
            const prevModule = modules[currentModuleIndex - 1];
            setCurrentModule(prevModule);
            setCurrentLesson(prevModule.lessons?.[prevModule.lessons.length - 1] || null);
            setIsQuizMode(false);
        }
    };

    const progress = course?.enrollment?.progress_percentage || 0;

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)]">
                <div className="flex-1 p-6">
                    <Skeleton className="aspect-video rounded-xl mb-6" />
                    <Skeleton className="h-8 w-2/3 mb-4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="hidden lg:block w-80 glass-heavy border-l border-white/10">
                    <Skeleton className="h-full" />
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Course not found</h2>
                    <Link to="/my-courses">
                        <Button className="btn-primary">Back to My Courses</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden" data-testid="course-player-page">
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Video/Content Area */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                    {isQuizMode && currentModule?.quiz ? (
                        <div className="max-w-3xl mx-auto">
                            <div className="glass-heavy rounded-2xl p-6 lg:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
                                        <HelpCircle className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <h2 className="font-outfit text-2xl font-bold text-white">
                                            {currentModule.quiz.title}
                                        </h2>
                                        <p className="text-slate-400">
                                            {currentModule.quiz.questions?.length || 0} questions • 
                                            Pass: {currentModule.quiz.passing_score}%
                                        </p>
                                    </div>
                                </div>

                                {quizResult ? (
                                    <div className="text-center py-8">
                                        <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                                            quizResult.is_passed ? "bg-green-500/20" : "bg-red-500/20"
                                        }`}>
                                            {quizResult.is_passed ? (
                                                <Award className="w-12 h-12 text-green-400" />
                                            ) : (
                                                <X className="w-12 h-12 text-red-400" />
                                            )}
                                        </div>
                                        <h3 className="font-outfit text-3xl font-bold text-white mb-2">
                                            {quizResult.is_passed ? "Congratulations!" : "Try Again"}
                                        </h3>
                                        <p className="text-slate-400 mb-4">
                                            Your score: {quizResult.score.toFixed(0)}%
                                        </p>
                                        <Button
                                            className="btn-primary"
                                            onClick={() => {
                                                setQuizResult(null);
                                                setQuizAnswers({});
                                                if (quizResult.is_passed) {
                                                    setIsQuizMode(false);
                                                    goToNextLesson();
                                                }
                                            }}
                                        >
                                            {quizResult.is_passed ? "Continue" : "Retry Quiz"}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {currentModule.quiz.questions?.map((question, qIndex) => (
                                            <div key={question.id} className="glass-light rounded-xl p-5">
                                                <p className="font-semibold text-white mb-4">
                                                    {qIndex + 1}. {question.question_text}
                                                </p>
                                                <div className="space-y-2">
                                                    {question.options?.map((option, oIndex) => (
                                                        <button
                                                            key={oIndex}
                                                            onClick={() => setQuizAnswers({
                                                                ...quizAnswers,
                                                                [question.id]: oIndex
                                                            })}
                                                            className={`quiz-option w-full text-left p-4 rounded-lg border transition-all ${
                                                                quizAnswers[question.id] === oIndex
                                                                    ? "border-purple-500 bg-purple-500/10 selected"
                                                                    : "border-slate-700 hover:border-slate-600"
                                                            }`}
                                                        >
                                                            <span className="text-slate-300">{option}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}

                                        <Button
                                            className="w-full btn-primary py-4"
                                            onClick={handleQuizSubmit}
                                            disabled={Object.keys(quizAnswers).length !== currentModule.quiz.questions?.length}
                                        >
                                            Submit Quiz
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : currentLesson ? (
                        <div className="max-w-4xl mx-auto">
                            {/* Video Player */}
                            {currentLesson.content_type === "video" && (
                                <div className="video-container mb-6 bg-slate-900 rounded-2xl overflow-hidden">
                                    {currentLesson.video_key ? (
                                        <video
                                            controls
                                            className="w-full h-full"
                                            src={`${API}/lessons/${currentLesson.id}/video`}
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    ) : (
                                        <div className="aspect-video flex items-center justify-center bg-slate-900">
                                            <div className="text-center">
                                                <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                                <p className="text-slate-500">Video not available</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Lesson Content */}
                            <div className="glass-heavy rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="px-3 py-1 rounded-full bg-purple-600/20 text-purple-400 text-sm">
                                        {currentModule?.title}
                                    </span>
                                    {currentLesson.progress?.is_completed && (
                                        <span className="flex items-center gap-1 text-green-400 text-sm">
                                            <Check className="w-4 h-4" />
                                            Completed
                                        </span>
                                    )}
                                </div>

                                <h1 className="font-outfit text-2xl font-bold text-white mb-4">
                                    {currentLesson.title}
                                </h1>

                                {currentLesson.description && (
                                    <p className="text-slate-400 mb-6">{currentLesson.description}</p>
                                )}

                                {currentLesson.content_type === "text" && currentLesson.content && (
                                    <div className="prose prose-invert max-w-none">
                                        <div className="text-slate-300 whitespace-pre-wrap">
                                            {currentLesson.content}
                                        </div>
                                    </div>
                                )}

                                {!currentLesson.progress?.is_completed && (
                                    <Button
                                        className="mt-6 btn-primary"
                                        onClick={handleLessonComplete}
                                        data-testid="complete-lesson-btn"
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        Mark as Complete
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-slate-500">Select a lesson to start learning</p>
                        </div>
                    )}
                </div>

                {/* Bottom Navigation */}
                <div className="glass-heavy border-t border-white/10 p-4">
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        <Button
                            variant="ghost"
                            className="text-slate-400 hover:text-white"
                            onClick={goToPreviousLesson}
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Previous
                        </Button>

                        <div className="flex-1 max-w-md mx-4 hidden sm:block">
                            <div className="flex items-center gap-3">
                                <Progress value={progress} className="flex-1 h-2" />
                                <span className="text-sm text-slate-400 whitespace-nowrap">
                                    {progress.toFixed(0)}% Complete
                                </span>
                            </div>
                        </div>

                        <Button
                            className="btn-primary"
                            onClick={() => {
                                if (currentModule?.quiz && !isQuizMode) {
                                    // Check if all lessons in module completed
                                    const allLessonsComplete = currentModule.lessons?.every(
                                        l => l.progress?.is_completed
                                    );
                                    if (allLessonsComplete) {
                                        setIsQuizMode(true);
                                    } else {
                                        goToNextLesson();
                                    }
                                } else {
                                    goToNextLesson();
                                }
                            }}
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Sidebar Toggle (Mobile) */}
            <button
                className="lg:hidden fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center shadow-lg neon-glow-purple"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                {isSidebarOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>

            {/* Sidebar */}
            <aside className={`fixed lg:relative inset-y-0 right-0 w-80 glass-heavy border-l border-white/10 transform transition-transform duration-300 z-30 ${
                isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
            }`}>
                <div className="p-4 border-b border-white/10">
                    <h2 className="font-outfit font-semibold text-white truncate">
                        {course.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                        <Progress value={progress} className="flex-1 h-1.5" />
                        <span className="text-xs text-slate-500">{progress.toFixed(0)}%</span>
                    </div>
                </div>

                <ScrollArea className="h-[calc(100%-5rem)]">
                    <Accordion type="multiple" defaultValue={[currentModule?.id]} className="px-2 py-2">
                        {course.modules?.map((module, moduleIndex) => (
                            <AccordionItem key={module.id} value={module.id} className="border-none">
                                <AccordionTrigger className="px-3 py-3 hover:bg-white/5 rounded-lg hover:no-underline">
                                    <div className="flex items-center gap-3 text-left">
                                        <span className="w-7 h-7 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400 text-sm font-semibold">
                                            {moduleIndex + 1}
                                        </span>
                                        <span className="text-white text-sm font-medium truncate">
                                            {module.title}
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-2">
                                    <div className="space-y-1 ml-10">
                                        {module.lessons?.map((lesson) => (
                                            <button
                                                key={lesson.id}
                                                onClick={() => {
                                                    setCurrentModule(module);
                                                    setCurrentLesson(lesson);
                                                    setIsQuizMode(false);
                                                    setIsSidebarOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                                                    currentLesson?.id === lesson.id
                                                        ? "bg-purple-600/20 text-purple-400"
                                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                                }`}
                                            >
                                                {lesson.progress?.is_completed ? (
                                                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                                                ) : lesson.content_type === "video" ? (
                                                    <Play className="w-4 h-4 flex-shrink-0" />
                                                ) : (
                                                    <FileText className="w-4 h-4 flex-shrink-0" />
                                                )}
                                                <span className="text-sm truncate">{lesson.title}</span>
                                            </button>
                                        ))}

                                        {module.quiz && (
                                            <button
                                                onClick={() => {
                                                    setCurrentModule(module);
                                                    setIsQuizMode(true);
                                                    setIsSidebarOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                                                    isQuizMode && currentModule?.id === module.id
                                                        ? "bg-purple-600/20 text-purple-400"
                                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                                }`}
                                            >
                                                {module.quiz.attempt?.is_passed ? (
                                                    <Award className="w-4 h-4 text-green-400 flex-shrink-0" />
                                                ) : (
                                                    <HelpCircle className="w-4 h-4 flex-shrink-0" />
                                                )}
                                                <span className="text-sm">Quiz: {module.quiz.title}</span>
                                            </button>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </ScrollArea>
            </aside>
        </div>
    );
}
