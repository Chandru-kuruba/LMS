import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { 
    Upload, Download, Users, BookOpen, Award, Mail, 
    AlertTriangle, Check, X, Loader2, FileText, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function BulkOperationsPage() {
    const { accessToken } = useAuthStore();
    const [activeTab, setActiveTab] = useState("users");
    const [isLoading, setIsLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState("");
    const [results, setResults] = useState(null);

    useEffect(() => {
        fetchData();
    }, [accessToken]);

    const fetchData = async () => {
        try {
            const [usersRes, coursesRes] = await Promise.all([
                axios.get(`${API}/admin/users`, { headers: { Authorization: `Bearer ${accessToken}` } }),
                axios.get(`${API}/admin/courses`, { headers: { Authorization: `Bearer ${accessToken}` } })
            ]);
            setUsers(usersRes.data.users || []);
            setCourses(coursesRes.data.courses || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        }
    };

    // Import Users
    const handleImportUsers = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await axios.post(`${API}/admin/bulk/import-users`, formData, {
                headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "multipart/form-data" }
            });
            setResults({ type: "import", ...res.data });
            toast.success(`Imported ${res.data.created} users`);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Import failed");
        } finally {
            setIsLoading(false);
        }
    };

    // Export Users
    const handleExportUsers = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${API}/admin/bulk/export-users`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'users_export.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Users exported successfully");
        } catch (error) {
            toast.error("Export failed");
        } finally {
            setIsLoading(false);
        }
    };

    // Bulk Enroll
    const handleBulkEnroll = async () => {
        if (!selectedCourse || selectedUsers.length === 0) {
            toast.error("Select a course and at least one user");
            return;
        }

        setIsLoading(true);
        try {
            const res = await axios.post(`${API}/admin/bulk/enroll`, {
                user_ids: selectedUsers,
                course_id: selectedCourse
            }, { headers: { Authorization: `Bearer ${accessToken}` } });
            setResults({ type: "enroll", ...res.data });
            toast.success(`Enrolled ${res.data.enrolled} users`);
            setSelectedUsers([]);
        } catch (error) {
            toast.error(error.response?.data?.detail || "Enrollment failed");
        } finally {
            setIsLoading(false);
        }
    };

    // Bulk Generate Certificates
    const handleBulkCertificates = async () => {
        if (!selectedCourse || selectedUsers.length === 0) {
            toast.error("Select a course and at least one user");
            return;
        }

        setIsLoading(true);
        try {
            const res = await axios.post(`${API}/admin/bulk/generate-certificates`, {
                user_ids: selectedUsers,
                course_id: selectedCourse
            }, { headers: { Authorization: `Bearer ${accessToken}` } });
            setResults({ type: "certificates", ...res.data });
            toast.success(`Generated ${res.data.generated} certificates`);
            setSelectedUsers([]);
        } catch (error) {
            toast.error(error.response?.data?.detail || "Certificate generation failed");
        } finally {
            setIsLoading(false);
        }
    };

    // Send Reminders
    const handleSendReminders = async () => {
        setIsLoading(true);
        try {
            const res = await axios.post(`${API}/admin/email/send-reminders`, null, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            toast.success(res.data.message);
        } catch (error) {
            toast.error("Failed to send reminders");
        } finally {
            setIsLoading(false);
        }
    };

    // Check Bucket Limits
    const handleCheckBucketLimits = async () => {
        setIsLoading(true);
        try {
            const res = await axios.post(`${API}/admin/email/check-bucket-limits`, null, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            toast.success(res.data.message);
        } catch (error) {
            toast.error("Failed to check bucket limits");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleUserSelection = (userId) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const selectAllUsers = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map(u => u.id));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Bulk Operations</h1>
                    <p className="text-slate-400">Import, export, and bulk manage users, enrollments, and certificates</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="glass-card">
                    <TabsTrigger value="users" className="data-[state=active]:bg-purple-500/20">
                        <Users className="w-4 h-4 mr-2" /> User Import/Export
                    </TabsTrigger>
                    <TabsTrigger value="enroll" className="data-[state=active]:bg-purple-500/20">
                        <BookOpen className="w-4 h-4 mr-2" /> Bulk Enrollment
                    </TabsTrigger>
                    <TabsTrigger value="certificates" className="data-[state=active]:bg-purple-500/20">
                        <Award className="w-4 h-4 mr-2" /> Bulk Certificates
                    </TabsTrigger>
                    <TabsTrigger value="emails" className="data-[state=active]:bg-purple-500/20">
                        <Mail className="w-4 h-4 mr-2" /> Email Automation
                    </TabsTrigger>
                </TabsList>

                {/* User Import/Export Tab */}
                <TabsContent value="users" className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-6 rounded-xl"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                                    <Upload className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold">Import Users</h3>
                                    <p className="text-slate-400 text-sm">Upload CSV file to bulk create users</p>
                                </div>
                            </div>
                            <p className="text-slate-500 text-xs mb-4">
                                CSV format: email, first_name, last_name, password (optional)
                            </p>
                            <Input
                                type="file"
                                accept=".csv"
                                onChange={handleImportUsers}
                                disabled={isLoading}
                                className="input-neon"
                            />
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card p-6 rounded-xl"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <Download className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold">Export Users</h3>
                                    <p className="text-slate-400 text-sm">Download all users as CSV</p>
                                </div>
                            </div>
                            <p className="text-slate-500 text-xs mb-4">
                                Exports: ID, email, name, role, status, balance
                            </p>
                            <Button onClick={handleExportUsers} disabled={isLoading} className="w-full">
                                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                Export to CSV
                            </Button>
                        </motion.div>
                    </div>
                </TabsContent>

                {/* Bulk Enrollment Tab */}
                <TabsContent value="enroll" className="space-y-4">
                    <div className="glass-card p-6 rounded-xl">
                        <h3 className="text-white font-semibold mb-4">Select Course</h3>
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white mb-4"
                        >
                            <option value="">-- Select a course --</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>{course.title}</option>
                            ))}
                        </select>

                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold">Select Users ({selectedUsers.length} selected)</h3>
                            <Button variant="outline" size="sm" onClick={selectAllUsers}>
                                {selectedUsers.length === users.length ? "Deselect All" : "Select All"}
                            </Button>
                        </div>

                        <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
                            {users.map(user => (
                                <div 
                                    key={user.id}
                                    onClick={() => toggleUserSelection(user.id)}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                        selectedUsers.includes(user.id) 
                                            ? 'bg-purple-500/20 border border-purple-500/50' 
                                            : 'bg-slate-800/50 hover:bg-slate-700/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                                            selectedUsers.includes(user.id) ? 'bg-purple-500 border-purple-500' : 'border-slate-600'
                                        }`}>
                                            {selectedUsers.includes(user.id) && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="text-white">{user.first_name} {user.last_name}</span>
                                        <span className="text-slate-400 text-sm">{user.email}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button onClick={handleBulkEnroll} disabled={isLoading || !selectedCourse || selectedUsers.length === 0} className="w-full">
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookOpen className="w-4 h-4 mr-2" />}
                            Enroll {selectedUsers.length} Users
                        </Button>
                    </div>
                </TabsContent>

                {/* Bulk Certificates Tab */}
                <TabsContent value="certificates" className="space-y-4">
                    <div className="glass-card p-6 rounded-xl">
                        <h3 className="text-white font-semibold mb-4">Select Course</h3>
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white mb-4"
                        >
                            <option value="">-- Select a course --</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>{course.title}</option>
                            ))}
                        </select>

                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold">Select Users ({selectedUsers.length} selected)</h3>
                            <Button variant="outline" size="sm" onClick={selectAllUsers}>
                                {selectedUsers.length === users.length ? "Deselect All" : "Select All"}
                            </Button>
                        </div>

                        <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
                            {users.map(user => (
                                <div 
                                    key={user.id}
                                    onClick={() => toggleUserSelection(user.id)}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                        selectedUsers.includes(user.id) 
                                            ? 'bg-purple-500/20 border border-purple-500/50' 
                                            : 'bg-slate-800/50 hover:bg-slate-700/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                                            selectedUsers.includes(user.id) ? 'bg-purple-500 border-purple-500' : 'border-slate-600'
                                        }`}>
                                            {selectedUsers.includes(user.id) && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="text-white">{user.first_name} {user.last_name}</span>
                                        <span className="text-slate-400 text-sm">{user.email}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button onClick={handleBulkCertificates} disabled={isLoading || !selectedCourse || selectedUsers.length === 0} className="w-full">
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Award className="w-4 h-4 mr-2" />}
                            Generate {selectedUsers.length} Certificates
                        </Button>
                    </div>
                </TabsContent>

                {/* Email Automation Tab */}
                <TabsContent value="emails" className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-6 rounded-xl"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                    <Mail className="w-6 h-6 text-yellow-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold">Course Reminders</h3>
                                    <p className="text-slate-400 text-sm">Send reminders to users with incomplete courses</p>
                                </div>
                            </div>
                            <p className="text-slate-500 text-xs mb-4">
                                Sends reminder emails to all users who have started but not completed courses.
                            </p>
                            <Button onClick={handleSendReminders} disabled={isLoading} className="w-full">
                                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                Send Reminder Emails
                            </Button>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card p-6 rounded-xl"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold">Storage Warnings</h3>
                                    <p className="text-slate-400 text-sm">Check R2 buckets and send limit warnings</p>
                                </div>
                            </div>
                            <p className="text-slate-500 text-xs mb-4">
                                Checks all R2 buckets and sends warning emails for those above 80% capacity.
                            </p>
                            <Button onClick={handleCheckBucketLimits} disabled={isLoading} variant="outline" className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10">
                                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                                Check & Notify
                            </Button>
                        </motion.div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Results Display */}
            {results && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 rounded-xl"
                >
                    <h3 className="text-white font-semibold mb-4">Operation Results</h3>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2 text-green-400">
                            <Check className="w-5 h-5" />
                            <span>Success: {results.created || results.enrolled || results.generated || 0}</span>
                        </div>
                        {results.errors?.length > 0 && (
                            <div className="flex items-center gap-2 text-red-400">
                                <X className="w-5 h-5" />
                                <span>Errors: {results.errors.length}</span>
                            </div>
                        )}
                    </div>
                    {results.errors?.length > 0 && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 max-h-40 overflow-y-auto">
                            {results.errors.map((err, i) => (
                                <p key={i} className="text-red-400 text-sm">{err}</p>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
