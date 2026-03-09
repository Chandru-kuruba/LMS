import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FileText, Clock, CheckCircle, AlertCircle, Upload, 
    Calendar, Award, Loader2, ChevronRight, X, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AssignmentsPage() {
    const { accessToken } = useAuthStore();
    const [assignments, setAssignments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissionText, setSubmissionText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchAssignments();
    }, [accessToken]);

    const fetchAssignments = async () => {
        try {
            const res = await axios.get(`${API}/my-assignments`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setAssignments(res.data.assignments || []);
        } catch (error) {
            console.error("Failed to fetch assignments:", error);
            toast.error("Failed to load assignments");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!submissionText.trim()) {
            toast.error("Please enter your submission");
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.post(`${API}/assignments/${selectedAssignment.id}/submit`, {
                content: submissionText
            }, { headers: { Authorization: `Bearer ${accessToken}` } });
            
            toast.success("Assignment submitted successfully!");
            setSelectedAssignment(null);
            setSubmissionText("");
            fetchAssignments();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to submit assignment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (assignment) => {
        if (assignment.submission?.score !== undefined) {
            return (
                <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400 flex items-center gap-1">
                    <Award className="w-3 h-3" /> Graded: {assignment.submission.score}%
                </span>
            );
        }
        if (assignment.submission) {
            return (
                <span className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Submitted
                </span>
            );
        }
        const dueDate = new Date(assignment.due_date);
        if (dueDate < new Date()) {
            return (
                <span className="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Overdue
                </span>
            );
        }
        return (
            <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Pending
            </span>
        );
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
            <div>
                <h1 className="text-2xl font-bold text-white">My Assignments</h1>
                <p className="text-slate-400">View and submit your course assignments</p>
            </div>

            {assignments.length === 0 ? (
                <div className="glass-card p-12 rounded-xl text-center">
                    <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl text-white mb-2">No Assignments Yet</h3>
                    <p className="text-slate-400">Assignments from your enrolled courses will appear here.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {assignments.map((assignment, index) => (
                        <motion.div
                            key={assignment.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-card p-6 rounded-xl hover:border-purple-500/30 transition-colors cursor-pointer"
                            onClick={() => setSelectedAssignment(assignment)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold">{assignment.title}</h3>
                                        <p className="text-slate-400 text-sm">{assignment.course_title}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {getStatusBadge(assignment)}
                                    <div className="text-right">
                                        <p className="text-slate-400 text-sm flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                                        </p>
                                        <p className="text-slate-500 text-xs">{assignment.max_score} points</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-500" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Assignment Detail Modal */}
            <AnimatePresence>
                {selectedAssignment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setSelectedAssignment(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">{selectedAssignment.title}</h2>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedAssignment(null)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-center gap-4">
                                    <span className="text-slate-400">Course:</span>
                                    <span className="text-white">{selectedAssignment.course_title}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-slate-400">Due Date:</span>
                                    <span className="text-white">{new Date(selectedAssignment.due_date).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-slate-400">Max Score:</span>
                                    <span className="text-white">{selectedAssignment.max_score} points</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-slate-400">Status:</span>
                                    {getStatusBadge(selectedAssignment)}
                                </div>
                            </div>

                            <div className="glass-light p-4 rounded-lg mb-6">
                                <h4 className="text-white font-semibold mb-2">Instructions</h4>
                                <p className="text-slate-300 whitespace-pre-wrap">{selectedAssignment.description}</p>
                            </div>

                            {selectedAssignment.submission ? (
                                <div className="space-y-4">
                                    <div className="glass-light p-4 rounded-lg">
                                        <h4 className="text-white font-semibold mb-2">Your Submission</h4>
                                        <p className="text-slate-300 whitespace-pre-wrap">{selectedAssignment.submission.content}</p>
                                        <p className="text-slate-500 text-sm mt-2">
                                            Submitted: {new Date(selectedAssignment.submission.submitted_at).toLocaleString()}
                                        </p>
                                    </div>
                                    
                                    {selectedAssignment.submission.score !== undefined && (
                                        <div className="glass-light p-4 rounded-lg border border-green-500/30">
                                            <h4 className="text-green-400 font-semibold mb-2">Grade & Feedback</h4>
                                            <p className="text-2xl text-white font-bold mb-2">
                                                {selectedAssignment.submission.score}/{selectedAssignment.max_score}
                                            </p>
                                            {selectedAssignment.submission.feedback && (
                                                <p className="text-slate-300">{selectedAssignment.submission.feedback}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <h4 className="text-white font-semibold">Submit Your Work</h4>
                                    <Textarea
                                        value={submissionText}
                                        onChange={(e) => setSubmissionText(e.target.value)}
                                        placeholder="Enter your assignment submission here..."
                                        className="min-h-[200px] bg-slate-800 border-slate-700 text-white"
                                    />
                                    <Button 
                                        onClick={handleSubmit} 
                                        disabled={isSubmitting}
                                        className="w-full"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4 mr-2" />
                                        )}
                                        Submit Assignment
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
