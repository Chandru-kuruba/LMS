import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
    Award,
    Search,
    Edit,
    Eye,
    Download,
    Calendar,
    User,
    BookOpen,
    Save,
    X,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminCertificatesManagePage() {
    const { accessToken } = useAuthStore();
    const [certificates, setCertificates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchById, setSearchById] = useState("");
    const [selectedCert, setSelectedCert] = useState(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editData, setEditData] = useState({
        name_on_certificate: "",
        course_title: "",
        issue_date: ""
    });

    useEffect(() => {
        fetchCertificates();
    }, [accessToken]);

    const fetchCertificates = async () => {
        try {
            const response = await axios.get(`${API}/admin/certificates`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setCertificates(response.data.certificates || []);
        } catch (error) {
            console.error("Failed to fetch certificates:", error);
            toast.error("Failed to load certificates");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchById = async () => {
        if (!searchById.trim()) {
            toast.error("Please enter a certificate ID");
            return;
        }

        try {
            const response = await axios.get(`${API}/admin/certificates/search`, {
                params: { certificate_id: searchById },
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (response.data.certificate) {
                setSelectedCert(response.data.certificate);
                setEditData({
                    name_on_certificate: response.data.certificate.name_on_certificate,
                    course_title: response.data.certificate.course_title,
                    issue_date: response.data.certificate.issue_date?.split("T")[0] || ""
                });
                setShowEditDialog(true);
            } else {
                toast.error("Certificate not found");
            }
        } catch (error) {
            toast.error("Certificate not found");
        }
    };

    const handleEdit = (cert) => {
        setSelectedCert(cert);
        setEditData({
            name_on_certificate: cert.name_on_certificate,
            course_title: cert.course_title,
            issue_date: cert.issue_date?.split("T")[0] || ""
        });
        setShowEditDialog(true);
    };

    const handleSaveEdit = async () => {
        if (!editData.name_on_certificate.trim()) {
            toast.error("Name is required");
            return;
        }

        setIsSaving(true);
        try {
            await axios.put(
                `${API}/admin/certificates/${selectedCert.certificate_id}`,
                {
                    name_on_certificate: editData.name_on_certificate,
                    course_title: editData.course_title,
                    issue_date: editData.issue_date ? new Date(editData.issue_date).toISOString() : undefined
                },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success("Certificate updated successfully!");
            setShowEditDialog(false);
            fetchCertificates();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to update certificate");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUnlockName = async (certId) => {
        try {
            await axios.post(
                `${API}/admin/certificates/${certId}/unlock-name`,
                null,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success("Name unlocked! User can now update their name.");
            fetchCertificates();
        } catch (error) {
            toast.error("Failed to unlock name");
        }
    };

    const filteredCertificates = certificates.filter(cert => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            cert.certificate_id?.toLowerCase().includes(query) ||
            cert.name_on_certificate?.toLowerCase().includes(query) ||
            cert.course_title?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="space-y-6" data-testid="admin-certificates-manage-page">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-outfit text-2xl font-bold text-white">Certificate Management</h1>
                    <p className="text-slate-400">View and edit all generated certificates</p>
                </div>

                <Button variant="outline" onClick={fetchCertificates}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Search by Certificate ID */}
            <div className="glass-heavy rounded-xl p-6">
                <h3 className="font-semibold text-white mb-4">Quick Search by Certificate ID</h3>
                <div className="flex gap-3">
                    <Input
                        value={searchById}
                        onChange={(e) => setSearchById(e.target.value)}
                        placeholder="Enter Certificate ID (e.g., LUMINA-XXXXXXXX-XXXXXXXX-YYYYMMDD)"
                        className="input-neon flex-1"
                        onKeyPress={(e) => e.key === "Enter" && handleSearchById()}
                    />
                    <Button className="btn-primary" onClick={handleSearchById}>
                        <Search className="w-4 h-4 mr-2" />
                        Find
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-medium rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <Award className="w-8 h-8 text-yellow-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">{certificates.length}</p>
                            <p className="text-xs text-slate-400">Total Certificates</p>
                        </div>
                    </div>
                </div>
                <div className="glass-medium rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <User className="w-8 h-8 text-purple-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {new Set(certificates.map(c => c.user_id)).size}
                            </p>
                            <p className="text-xs text-slate-400">Certified Users</p>
                        </div>
                    </div>
                </div>
                <div className="glass-medium rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-cyan-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {new Set(certificates.map(c => c.course_id)).size}
                            </p>
                            <p className="text-xs text-slate-400">Courses Certified</p>
                        </div>
                    </div>
                </div>
                <div className="glass-medium rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <Download className="w-8 h-8 text-green-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {certificates.reduce((sum, c) => sum + (c.print_count || 0), 0)}
                            </p>
                            <p className="text-xs text-slate-400">Total Prints</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Certificates Table */}
            <div className="glass-heavy rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="font-semibold text-white">All Certificates</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                            placeholder="Search certificates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 input-neon w-64"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-6 space-y-4">
                        {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
                    </div>
                ) : filteredCertificates.length === 0 ? (
                    <div className="p-12 text-center">
                        <Award className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No certificates found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/10">
                                    <TableHead className="text-slate-400">Certificate ID</TableHead>
                                    <TableHead className="text-slate-400">Recipient</TableHead>
                                    <TableHead className="text-slate-400">Course</TableHead>
                                    <TableHead className="text-slate-400">Issue Date</TableHead>
                                    <TableHead className="text-slate-400">Prints</TableHead>
                                    <TableHead className="text-slate-400">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCertificates.map((cert, index) => (
                                    <TableRow key={cert.id || index} className="border-white/5">
                                        <TableCell className="font-mono text-xs text-purple-400">
                                            {cert.certificate_id}
                                        </TableCell>
                                        <TableCell className="text-white">
                                            {cert.name_on_certificate}
                                            {cert.name_locked === false && (
                                                <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                                                    Unlocked
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-slate-300 max-w-[200px] truncate">
                                            {cert.course_title}
                                        </TableCell>
                                        <TableCell className="text-slate-400">
                                            {new Date(cert.issue_date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-slate-400">
                                            {cert.print_count || 0}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-purple-400 hover:text-purple-300"
                                                    onClick={() => handleEdit(cert)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-cyan-400 hover:text-cyan-300"
                                                    onClick={() => window.open(`/verify/${cert.certificate_id}`, '_blank')}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="glass-heavy border-purple-500/30">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Edit className="w-5 h-5 text-purple-400" />
                            Edit Certificate
                        </DialogTitle>
                    </DialogHeader>

                    {selectedCert && (
                        <div className="space-y-4 py-4">
                            <div className="glass-light rounded-lg p-3">
                                <p className="text-xs text-slate-500">Certificate ID</p>
                                <p className="font-mono text-purple-400">{selectedCert.certificate_id}</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300">Name on Certificate *</Label>
                                <Input
                                    value={editData.name_on_certificate}
                                    onChange={(e) => setEditData({...editData, name_on_certificate: e.target.value})}
                                    className="input-neon"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300">Course Title</Label>
                                <Input
                                    value={editData.course_title}
                                    onChange={(e) => setEditData({...editData, course_title: e.target.value})}
                                    className="input-neon"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300">Issue Date</Label>
                                <Input
                                    type="date"
                                    value={editData.issue_date}
                                    onChange={(e) => setEditData({...editData, issue_date: e.target.value})}
                                    className="input-neon"
                                />
                            </div>

                            {selectedCert.name_locked !== false && (
                                <Button
                                    variant="outline"
                                    className="w-full border-yellow-500/50 text-yellow-400"
                                    onClick={() => handleUnlockName(selectedCert.certificate_id)}
                                >
                                    Unlock Name (Allow User to Edit)
                                </Button>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                                    Cancel
                                </Button>
                                <Button className="btn-primary" onClick={handleSaveEdit} disabled={isSaving}>
                                    {isSaving ? "Saving..." : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
