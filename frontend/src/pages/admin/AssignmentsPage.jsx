import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FileText, Plus, Edit, Trash2, Eye, Users, CheckCircle,
    Calendar, Award, Loader2, X, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AssignmentsManagePage() {
    const { accessToken } = useAuthStore();
    const [assignments, setAssignments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showSubmissions, setShowSubmissions] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [gradeData, setGradeData] = useState({ score: 0, feedback: "" });
    const [gradingSubmission, setGradingSubmission] = useState(null);
    const [form, setForm] = useState({
        title: "",
        description: "",
        course_id: "",
        due_date: "",
        max_score: 100
    });

    useEffect(() => {
        fetchData();
    }, [accessToken]);

    const fetchData = async () => {
        try {
            const [assignmentsRes, coursesRes] = await Promise.all([
                axios.get(`${API}/admin/assignments`, { headers: { Authorization: `Bearer ${accessToken}` } }),
                axios.get(`${API}/admin/courses`, { headers: { Authorization: `Bearer ${accessToken}` } })
            ]);
            setAssignments(assignmentsRes.data.assignments || []);
            setCourses(coursesRes.data.courses || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!form.title || !form.course_id || !form.due_date) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            await axios.post(`${API}/admin/assignments`, form, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            toast.success("Assignment created!");
            setShowForm(false);
            setForm({ title: "", description: "", course_id: "", due_date: "", max_score: 100 });
            fetchData();
        } catch (error) {
            toast.error("Failed to create assignment");
        }
    };

    const fetchSubmissions = async (assignment) => {
        setSelectedAssignment(assignment);
        try {
            const res = await axios.get(`${API}/admin/assignments/${assignment.id}/submissions`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setSubmissions(res.data.submissions || []);
            setShowSubmissions(true);
        } catch (error) {
            toast.error("Failed to fetch submissions");
        }
    };

    const handleGrade = async () => {
        if (!gradingSubmission) return;
        
        try {
            await axios.put(
                `${API}/admin/submissions/${gradingSubmission.id}/grade`,
                null,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    params: { score: gradeData.score, feedback: gradeData.feedback }
                }
            );
            toast.success("Submission graded!");
            setGradingSubmission(null);
            setGradeData({ score: 0, feedback: "" });
            fetchSubmissions(selectedAssignment);
        } catch (error) {
            toast.error("Failed to grade submission");
        }
    };

    const getCourseTitle = (courseId) => {
        const course = courses.find(c => c.id === courseId);
        return course?.title || "Unknown Course";
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Assignments</h1>
                    <p className="text-slate-400">Create and manage course assignments</p>
                </div>
                <Button onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Create Assignment
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass-card p-4 rounded-xl">
                    <p className="text-slate-400 text-sm">Total Assignments</p>
                    <p className="text-2xl font-bold text-white">{assignments.length}</p>
                </div>
                <div className="glass-card p-4 rounded-xl">
                    <p className="text-slate-400 text-sm">Active Courses</p>
                    <p className="text-2xl font-bold text-white">
                        {new Set(assignments.map(a => a.course_id)).size}
                    </p>
                </div>
                <div className="glass-card p-4 rounded-xl">
                    <p className="text-slate-400 text-sm">Total Submissions</p>
                    <p className="text-2xl font-bold text-white">--</p>
                </div>
            </div>

            {/* Assignments List */}
            <div className="space-y-4">
                {assignments.length === 0 ? (
                    <div className="glass-card p-12 rounded-xl text-center">
                        <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl text-white mb-2">No Assignments</h3>
                        <p className="text-slate-400 mb-4">Create your first assignment to get started.</p>
                        <Button onClick={() => setShowForm(true)}>
                            <Plus className="w-4 h-4 mr-2" /> Create Assignment
                        </Button>
                    </div>
                ) : (
                    assignments.map((assignment, index) => (
                        <motion.div
                            key={assignment.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-card p-6 rounded-xl"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold">{assignment.title}</h3>
                                        <p className="text-slate-400 text-sm">{getCourseTitle(assignment.course_id)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-slate-400 text-sm flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                                        </p>
                                        <p className="text-slate-500 text-xs">Max Score: {assignment.max_score}</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => fetchSubmissions(assignment)}>
                                        <Users className="w-4 h-4 mr-2" /> View Submissions
                                    </Button>
                                </div>
                            </div>
                            {assignment.description && (
                                <p className="text-slate-500 text-sm mt-4 line-clamp-2">{assignment.description}</p>
                            )}
                        </motion.div>
                    ))
                )}
            </div>

            {/* Create Assignment Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="glass-card border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-white">Create Assignment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label className="text-slate-300">Title *</Label>
                            <Input
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="Assignment title"
                                className="input-neon"
                            />
                        </div>
                        <div>
                            <Label className="text-slate-300">Course *</Label>
                            <select
                                value={form.course_id}
                                onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
                            >
                                <option value="">Select a course</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>{course.title}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label className="text-slate-300">Description</Label>
                            <Textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Assignment instructions..."
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-slate-300">Due Date *</Label>
                                <Input
                                    type="datetime-local"
                                    value={form.due_date}
                                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                                    className="input-neon"
                                />
                            </div>
                            <div>
                                <Label className="text-slate-300">Max Score</Label>
                                <Input
                                    type="number"
                                    value={form.max_score}
                                    onChange={(e) => setForm({ ...form, max_score: parseInt(e.target.value) })}
                                    className="input-neon"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                        <Button onClick={handleCreate}>Create Assignment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Submissions Dialog */}
            <AnimatePresence>
                {showSubmissions && selectedAssignment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowSubmissions(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card p-6 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white">{selectedAssignment.title}</h2>
                                    <p className="text-slate-400">Submissions ({submissions.length})</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setShowSubmissions(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            {submissions.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-400">No submissions yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {submissions.map((submission) => (
                                        <div key={submission.id} className="glass-light p-4 rounded-lg">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                                        <span className="text-purple-400 font-semibold">
                                                            {submission.user?.first_name?.[0] || "U"}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-semibold">
                                                            {submission.user?.first_name} {submission.user?.last_name}
                                                        </p>
                                                        <p className="text-slate-400 text-sm">{submission.user?.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {submission.score !== undefined ? (
                                                        <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                                                            Score: {submission.score}/{selectedAssignment.max_score}
                                                        </span>
                                                    ) : (
                                                        <Button 
                                                            size="sm"
                                                            onClick={() => {
                                                                setGradingSubmission(submission);
                                                                setGradeData({ score: selectedAssignment.max_score, feedback: "" });
                                                            }}
                                                        >
                                                            <Award className="w-4 h-4 mr-1" /> Grade
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="bg-slate-800/50 p-3 rounded-lg">
                                                <p className="text-slate-300 whitespace-pre-wrap">{submission.content}</p>
                                            </div>
                                            <p className="text-slate-500 text-xs mt-2">
                                                Submitted: {new Date(submission.submitted_at).toLocaleString()}
                                            </p>
                                            {submission.feedback && (
                                                <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                                    <p className="text-green-400 text-sm font-semibold">Feedback:</p>
                                                    <p className="text-slate-300 text-sm">{submission.feedback}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Grade Dialog */}
            <Dialog open={!!gradingSubmission} onOpenChange={() => setGradingSubmission(null)}>
                <DialogContent className="glass-card border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-white">Grade Submission</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label className="text-slate-300">Score (out of {selectedAssignment?.max_score})</Label>
                            <Input
                                type="number"
                                min={0}
                                max={selectedAssignment?.max_score || 100}
                                value={gradeData.score}
                                onChange={(e) => setGradeData({ ...gradeData, score: parseInt(e.target.value) })}
                                className="input-neon"
                            />
                        </div>
                        <div>
                            <Label className="text-slate-300">Feedback (optional)</Label>
                            <Textarea
                                value={gradeData.feedback}
                                onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                                placeholder="Provide feedback to the student..."
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setGradingSubmission(null)}>Cancel</Button>
                        <Button onClick={handleGrade}>
                            <Save className="w-4 h-4 mr-2" /> Save Grade
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
