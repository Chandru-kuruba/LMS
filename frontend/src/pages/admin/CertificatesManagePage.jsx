import { useState, useEffect, useRef } from "react";
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
    RefreshCw,
    Lock,
    Unlock,
    Type,
    Move,
    Image,
    QrCode,
    Building2,
    FileText,
    Palette,
    GripVertical,
    Settings2,
    RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Logo URLs
const COMPANY_LOGO = "https://customer-assets.emergentagent.com/job_lms-stabilize-1/artifacts/8733xudx_Untitled_design-removebg-preview.png";
const MSME_LOGO = "https://customer-assets.emergentagent.com/job_lms-stabilize-1/artifacts/pmw7was4_msme.png";
const ISO_LOGO = "https://customer-assets.emergentagent.com/job_lms-stabilize-1/artifacts/yn7tm6lm_iso.png";

const fontOptions = [
    { value: "Great Vibes", label: "Great Vibes (Script)" },
    { value: "Outfit", label: "Outfit (Modern)" },
    { value: "Playfair Display", label: "Playfair Display (Elegant)" },
    { value: "Montserrat", label: "Montserrat (Clean)" },
    { value: "Georgia", label: "Georgia (Classic)" },
    { value: "Times New Roman", label: "Times New Roman (Formal)" }
];

const defaultLayout = {
    // Name settings
    name_position: { x: 550, y: 350 },
    name_font_family: "Great Vibes",
    name_font_size: 52,
    name_font_color: "#ffd700",
    // Course title settings
    course_position: { x: 550, y: 420 },
    course_font_family: "Outfit",
    course_font_size: 22,
    course_font_color: "#94A3B8",
    show_course: true,
    // Date settings
    date_position: { x: 550, y: 520 },
    date_font_size: 14,
    date_font_color: "#94A3B8",
    show_date: true,
    // Certificate ID settings
    cert_id_position: { x: 550, y: 700 },
    cert_id_font_size: 10,
    cert_id_font_color: "#64748B",
    show_cert_id: true,
    // Logo settings
    logo_position: { x: 550, y: 80 },
    logo_size: { width: 180, height: 60 },
    show_logo: true,
    // QR Code settings
    qr_position: { x: 1000, y: 650 },
    qr_size: 80,
    show_qr: true,
    // Signature settings
    signature_position: { x: 550, y: 580 },
    signature_name: "Chandru H",
    signature_title: "Founder & CEO",
    show_signature: true,
    // Background
    background_image: ""
};

export default function AdminCertificatesManagePage() {
    const { accessToken } = useAuthStore();
    const [certificates, setCertificates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchById, setSearchById] = useState("");
    const [selectedCert, setSelectedCert] = useState(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showLayoutDialog, setShowLayoutDialog] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("info");
    const [editData, setEditData] = useState({
        name_on_certificate: "",
        course_title: "",
        issue_date: ""
    });
    const [layoutData, setLayoutData] = useState({ ...defaultLayout });

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
                openLayoutEditor(response.data.certificate);
            } else {
                toast.error("Certificate not found");
            }
        } catch (error) {
            toast.error("Certificate not found");
        }
    };

    const openLayoutEditor = (cert) => {
        setSelectedCert(cert);
        setEditData({
            name_on_certificate: cert.name_on_certificate || "",
            course_title: cert.course_title || "",
            issue_date: cert.issue_date?.split("T")[0] || ""
        });
        // Merge stored layout with defaults
        const storedLayout = cert.layout || {};
        setLayoutData({ ...defaultLayout, ...storedLayout });
        setActiveTab("info");
        setShowLayoutDialog(true);
    };

    const handleSaveLayout = async () => {
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
                    issue_date: editData.issue_date ? new Date(editData.issue_date).toISOString() : undefined,
                    ...layoutData
                },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success("Certificate updated successfully!");
            setShowLayoutDialog(false);
            fetchCertificates();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to update certificate");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLockToggle = async (cert) => {
        const isCurrentlyLocked = cert.is_locked !== false;
        const endpoint = isCurrentlyLocked ? "unlock" : "lock";
        
        try {
            await axios.post(
                `${API}/admin/certificates/${cert.certificate_id}/${endpoint}`,
                null,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success(isCurrentlyLocked ? "Certificate unlocked - user can edit their name" : "Certificate locked");
            fetchCertificates();
        } catch (error) {
            toast.error("Failed to update lock status");
        }
    };

    const resetLayout = () => {
        setLayoutData({ ...defaultLayout });
        toast.success("Layout reset to defaults");
    };

    const updatePosition = (element, axis, value) => {
        const key = `${element}_position`;
        setLayoutData({
            ...layoutData,
            [key]: { ...layoutData[key], [axis]: value }
        });
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

    const PositionControl = ({ label, element, icon: Icon, maxX = 1100, maxY = 780 }) => (
        <div className="space-y-3 p-3 glass-light rounded-lg">
            <div className="flex items-center justify-between">
                <Label className="text-slate-300 flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4 text-purple-400" />}
                    {label}
                </Label>
                <span className="text-xs text-slate-500 font-mono">
                    ({layoutData[`${element}_position`]?.x || 0}, {layoutData[`${element}_position`]?.y || 0})
                </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <Label className="text-xs text-slate-500">X Position</Label>
                    <Slider
                        value={[layoutData[`${element}_position`]?.x || 0]}
                        onValueChange={([v]) => updatePosition(element, "x", v)}
                        min={0}
                        max={maxX}
                        className="py-2"
                    />
                </div>
                <div>
                    <Label className="text-xs text-slate-500">Y Position</Label>
                    <Slider
                        value={[layoutData[`${element}_position`]?.y || 0]}
                        onValueChange={([v]) => updatePosition(element, "y", v)}
                        min={0}
                        max={maxY}
                        className="py-2"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6" data-testid="admin-certificates-manage-page">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-outfit text-2xl font-bold text-white">Certificate Management</h1>
                    <p className="text-slate-400">View, edit, and redesign generated certificates</p>
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
                        Find & Edit
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
                        <Lock className="w-8 h-8 text-red-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {certificates.filter(c => c.is_locked !== false).length}
                            </p>
                            <p className="text-xs text-slate-400">Locked</p>
                        </div>
                    </div>
                </div>
                <div className="glass-medium rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <Unlock className="w-8 h-8 text-green-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {certificates.filter(c => c.is_locked === false).length}
                            </p>
                            <p className="text-xs text-slate-400">Unlocked</p>
                        </div>
                    </div>
                </div>
                <div className="glass-medium rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <Download className="w-8 h-8 text-cyan-400" />
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
                                    <TableHead className="text-slate-400">Status</TableHead>
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
                                        </TableCell>
                                        <TableCell className="text-slate-300 max-w-[200px] truncate">
                                            {cert.course_title}
                                        </TableCell>
                                        <TableCell className="text-slate-400">
                                            {new Date(cert.issue_date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {cert.is_locked === false ? (
                                                <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded flex items-center gap-1 w-fit">
                                                    <Unlock className="w-3 h-3" /> Unlocked
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded flex items-center gap-1 w-fit">
                                                    <Lock className="w-3 h-3" /> Locked
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-purple-400 hover:text-purple-300"
                                                    onClick={() => openLayoutEditor(cert)}
                                                    title="Edit Certificate Layout"
                                                >
                                                    <Settings2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={cert.is_locked === false ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"}
                                                    onClick={() => handleLockToggle(cert)}
                                                    title={cert.is_locked === false ? "Lock Certificate" : "Unlock Certificate"}
                                                >
                                                    {cert.is_locked === false ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-cyan-400 hover:text-cyan-300"
                                                    onClick={() => window.open(`/verify/${cert.certificate_id}`, '_blank')}
                                                    title="View Certificate"
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

            {/* Full Layout Editor Dialog */}
            <Dialog open={showLayoutDialog} onOpenChange={setShowLayoutDialog}>
                <DialogContent className="glass-heavy border-purple-500/30 max-w-7xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Edit className="w-5 h-5 text-purple-400" />
                            Edit Certificate - Full Layout Control
                        </DialogTitle>
                    </DialogHeader>

                    {selectedCert && (
                        <div className="grid lg:grid-cols-5 gap-6 py-4">
                            {/* Settings Panel - 2 columns */}
                            <div className="lg:col-span-2 space-y-4">
                                <Tabs value={activeTab} onValueChange={setActiveTab}>
                                    <TabsList className="grid w-full grid-cols-4 glass-medium">
                                        <TabsTrigger value="info" className="text-xs">Info</TabsTrigger>
                                        <TabsTrigger value="text" className="text-xs">Text</TabsTrigger>
                                        <TabsTrigger value="elements" className="text-xs">Elements</TabsTrigger>
                                        <TabsTrigger value="position" className="text-xs">Position</TabsTrigger>
                                    </TabsList>

                                    {/* Info Tab */}
                                    <TabsContent value="info" className="space-y-4 mt-4">
                                        <div className="glass-light rounded-lg p-3">
                                            <p className="text-xs text-slate-500">Certificate ID</p>
                                            <p className="font-mono text-purple-400 text-sm">{selectedCert.certificate_id}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Recipient Name *</Label>
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

                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 border-yellow-500/50 text-yellow-400"
                                                onClick={resetLayout}
                                            >
                                                <RotateCcw className="w-4 h-4 mr-1" />
                                                Reset Layout
                                            </Button>
                                        </div>
                                    </TabsContent>

                                    {/* Text Styling Tab */}
                                    <TabsContent value="text" className="space-y-4 mt-4 max-h-[400px] overflow-y-auto">
                                        {/* Name Styling */}
                                        <div className="p-3 glass-light rounded-lg space-y-3">
                                            <Label className="text-slate-300 flex items-center gap-2">
                                                <Type className="w-4 h-4 text-yellow-400" /> Recipient Name
                                            </Label>
                                            <Select 
                                                value={layoutData.name_font_family}
                                                onValueChange={(v) => setLayoutData({ ...layoutData, name_font_family: v })}
                                            >
                                                <SelectTrigger className="input-neon">
                                                    <SelectValue placeholder="Font Family" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {fontOptions.map(font => (
                                                        <SelectItem key={font.value} value={font.value}>
                                                            {font.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-xs text-slate-500">Size: {layoutData.name_font_size}px</Label>
                                                    <Slider
                                                        value={[layoutData.name_font_size]}
                                                        onValueChange={([v]) => setLayoutData({ ...layoutData, name_font_size: v })}
                                                        min={24}
                                                        max={80}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={layoutData.name_font_color}
                                                        onChange={(e) => setLayoutData({ ...layoutData, name_font_color: e.target.value })}
                                                        className="w-10 h-8 rounded cursor-pointer"
                                                    />
                                                    <Input
                                                        value={layoutData.name_font_color}
                                                        onChange={(e) => setLayoutData({ ...layoutData, name_font_color: e.target.value })}
                                                        className="input-neon flex-1 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Course Title Styling */}
                                        <div className="p-3 glass-light rounded-lg space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-slate-300 flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-cyan-400" /> Course Title
                                                </Label>
                                                <Switch
                                                    checked={layoutData.show_course}
                                                    onCheckedChange={(v) => setLayoutData({ ...layoutData, show_course: v })}
                                                />
                                            </div>
                                            {layoutData.show_course && (
                                                <>
                                                    <Select 
                                                        value={layoutData.course_font_family}
                                                        onValueChange={(v) => setLayoutData({ ...layoutData, course_font_family: v })}
                                                    >
                                                        <SelectTrigger className="input-neon">
                                                            <SelectValue placeholder="Font Family" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {fontOptions.map(font => (
                                                                <SelectItem key={font.value} value={font.value}>
                                                                    {font.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <Label className="text-xs text-slate-500">Size: {layoutData.course_font_size}px</Label>
                                                            <Slider
                                                                value={[layoutData.course_font_size]}
                                                                onValueChange={([v]) => setLayoutData({ ...layoutData, course_font_size: v })}
                                                                min={12}
                                                                max={40}
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="color"
                                                                value={layoutData.course_font_color}
                                                                onChange={(e) => setLayoutData({ ...layoutData, course_font_color: e.target.value })}
                                                                className="w-10 h-8 rounded cursor-pointer"
                                                            />
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Signature Settings */}
                                        <div className="p-3 glass-light rounded-lg space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-slate-300 flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-green-400" /> Signature
                                                </Label>
                                                <Switch
                                                    checked={layoutData.show_signature}
                                                    onCheckedChange={(v) => setLayoutData({ ...layoutData, show_signature: v })}
                                                />
                                            </div>
                                            {layoutData.show_signature && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <Label className="text-xs text-slate-500">Signer Name</Label>
                                                        <Input
                                                            value={layoutData.signature_name}
                                                            onChange={(e) => setLayoutData({ ...layoutData, signature_name: e.target.value })}
                                                            className="input-neon text-sm"
                                                            placeholder="John Smith"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-slate-500">Title</Label>
                                                        <Input
                                                            value={layoutData.signature_title}
                                                            onChange={(e) => setLayoutData({ ...layoutData, signature_title: e.target.value })}
                                                            className="input-neon text-sm"
                                                            placeholder="CEO"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    {/* Elements Tab */}
                                    <TabsContent value="elements" className="space-y-4 mt-4 max-h-[400px] overflow-y-auto">
                                        {/* Logo Settings */}
                                        <div className="p-3 glass-light rounded-lg space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-slate-300 flex items-center gap-2">
                                                    <Image className="w-4 h-4 text-purple-400" /> Company Logo
                                                </Label>
                                                <Switch
                                                    checked={layoutData.show_logo}
                                                    onCheckedChange={(v) => setLayoutData({ ...layoutData, show_logo: v })}
                                                />
                                            </div>
                                            {layoutData.show_logo && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <Label className="text-xs text-slate-500">Width: {layoutData.logo_size?.width || 180}px</Label>
                                                        <Slider
                                                            value={[layoutData.logo_size?.width || 180]}
                                                            onValueChange={([v]) => setLayoutData({
                                                                ...layoutData,
                                                                logo_size: { ...layoutData.logo_size, width: v }
                                                            })}
                                                            min={60}
                                                            max={400}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-slate-500">Height: {layoutData.logo_size?.height || 60}px</Label>
                                                        <Slider
                                                            value={[layoutData.logo_size?.height || 60]}
                                                            onValueChange={([v]) => setLayoutData({
                                                                ...layoutData,
                                                                logo_size: { ...layoutData.logo_size, height: v }
                                                            })}
                                                            min={30}
                                                            max={150}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* QR Code Settings */}
                                        <div className="p-3 glass-light rounded-lg space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-slate-300 flex items-center gap-2">
                                                    <QrCode className="w-4 h-4 text-blue-400" /> QR Code (Verification)
                                                </Label>
                                                <Switch
                                                    checked={layoutData.show_qr}
                                                    onCheckedChange={(v) => setLayoutData({ ...layoutData, show_qr: v })}
                                                />
                                            </div>
                                            {layoutData.show_qr && (
                                                <div>
                                                    <Label className="text-xs text-slate-500">QR Size: {layoutData.qr_size}px</Label>
                                                    <Slider
                                                        value={[layoutData.qr_size]}
                                                        onValueChange={([v]) => setLayoutData({ ...layoutData, qr_size: v })}
                                                        min={50}
                                                        max={150}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Date Settings */}
                                        <div className="p-3 glass-light rounded-lg space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-slate-300 flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-orange-400" /> Issue Date
                                                </Label>
                                                <Switch
                                                    checked={layoutData.show_date}
                                                    onCheckedChange={(v) => setLayoutData({ ...layoutData, show_date: v })}
                                                />
                                            </div>
                                            {layoutData.show_date && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <Label className="text-xs text-slate-500">Size: {layoutData.date_font_size}px</Label>
                                                        <Slider
                                                            value={[layoutData.date_font_size]}
                                                            onValueChange={([v]) => setLayoutData({ ...layoutData, date_font_size: v })}
                                                            min={10}
                                                            max={24}
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={layoutData.date_font_color}
                                                            onChange={(e) => setLayoutData({ ...layoutData, date_font_color: e.target.value })}
                                                            className="w-10 h-8 rounded cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Certificate ID Settings */}
                                        <div className="p-3 glass-light rounded-lg space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-slate-300 flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-slate-400" /> Certificate ID
                                                </Label>
                                                <Switch
                                                    checked={layoutData.show_cert_id}
                                                    onCheckedChange={(v) => setLayoutData({ ...layoutData, show_cert_id: v })}
                                                />
                                            </div>
                                            {layoutData.show_cert_id && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <Label className="text-xs text-slate-500">Size: {layoutData.cert_id_font_size}px</Label>
                                                        <Slider
                                                            value={[layoutData.cert_id_font_size]}
                                                            onValueChange={([v]) => setLayoutData({ ...layoutData, cert_id_font_size: v })}
                                                            min={8}
                                                            max={18}
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={layoutData.cert_id_font_color}
                                                            onChange={(e) => setLayoutData({ ...layoutData, cert_id_font_color: e.target.value })}
                                                            className="w-10 h-8 rounded cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    {/* Position Tab */}
                                    <TabsContent value="position" className="space-y-3 mt-4 max-h-[400px] overflow-y-auto">
                                        {layoutData.show_logo && <PositionControl label="Logo" element="logo" icon={Image} />}
                                        <PositionControl label="Recipient Name" element="name" icon={Type} />
                                        {layoutData.show_course && <PositionControl label="Course Title" element="course" icon={FileText} />}
                                        {layoutData.show_signature && <PositionControl label="Signature" element="signature" icon={Building2} />}
                                        {layoutData.show_date && <PositionControl label="Date" element="date" icon={Calendar} />}
                                        {layoutData.show_cert_id && <PositionControl label="Certificate ID" element="cert_id" icon={FileText} />}
                                        {layoutData.show_qr && <PositionControl label="QR Code" element="qr" icon={QrCode} />}
                                    </TabsContent>
                                </Tabs>
                            </div>

                            {/* Live Preview - 3 columns */}
                            <div className="lg:col-span-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-slate-300">Live Preview</Label>
                                    <span className="text-xs text-slate-500">1100 x 780px</span>
                                </div>
                                <div 
                                    className="relative w-full bg-gradient-to-br from-slate-900 via-[#0d0d1a] to-slate-900 rounded-lg overflow-hidden border-4 border-yellow-600/50"
                                    style={{
                                        aspectRatio: "1100/780",
                                        backgroundImage: layoutData.background_image ? `url(${layoutData.background_image})` : undefined,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                >
                                    {/* Decorative corners */}
                                    <div className="absolute top-2 left-2 w-16 h-16 border-t-2 border-l-2 border-yellow-600/50"></div>
                                    <div className="absolute top-2 right-2 w-16 h-16 border-t-2 border-r-2 border-yellow-600/50"></div>
                                    <div className="absolute bottom-2 left-2 w-16 h-16 border-b-2 border-l-2 border-yellow-600/50"></div>
                                    <div className="absolute bottom-2 right-2 w-16 h-16 border-b-2 border-r-2 border-yellow-600/50"></div>

                                    {/* Logo */}
                                    {layoutData.show_logo && (
                                        <div 
                                            className="absolute flex items-center justify-center gap-2"
                                            style={{
                                                left: `${(layoutData.logo_position?.x || 550) / 11}%`,
                                                top: `${(layoutData.logo_position?.y || 80) / 7.8}%`,
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                        >
                                            <img 
                                                src={COMPANY_LOGO} 
                                                alt="Logo" 
                                                style={{
                                                    maxWidth: `${(layoutData.logo_size?.width || 180) / 5}px`,
                                                    maxHeight: `${(layoutData.logo_size?.height || 60) / 2.5}px`,
                                                }}
                                                className="object-contain"
                                            />
                                        </div>
                                    )}

                                    {/* Certificate Title */}
                                    <div 
                                        className="absolute text-center"
                                        style={{
                                            left: '50%',
                                            top: '18%',
                                            transform: 'translateX(-50%)',
                                        }}
                                    >
                                        <span className="text-xs tracking-[0.3em] text-yellow-600/80">CERTIFICATE OF COMPLETION</span>
                                    </div>

                                    {/* This certifies text */}
                                    <div 
                                        className="absolute text-center"
                                        style={{
                                            left: '50%',
                                            top: '28%',
                                            transform: 'translateX(-50%)',
                                        }}
                                    >
                                        <span className="text-[8px] text-slate-400">This is to certify that</span>
                                    </div>

                                    {/* Name */}
                                    <div 
                                        className="absolute text-center whitespace-nowrap"
                                        style={{
                                            left: `${(layoutData.name_position?.x || 550) / 11}%`,
                                            top: `${(layoutData.name_position?.y || 350) / 7.8}%`,
                                            transform: 'translate(-50%, -50%)',
                                            fontFamily: layoutData.name_font_family,
                                            fontSize: `${layoutData.name_font_size / 3}px`,
                                            color: layoutData.name_font_color
                                        }}
                                    >
                                        {editData.name_on_certificate || "John Doe"}
                                    </div>

                                    {/* Course Title */}
                                    {layoutData.show_course && (
                                        <div 
                                            className="absolute text-center"
                                            style={{
                                                left: `${(layoutData.course_position?.x || 550) / 11}%`,
                                                top: `${(layoutData.course_position?.y || 420) / 7.8}%`,
                                                transform: 'translate(-50%, -50%)',
                                                fontFamily: layoutData.course_font_family,
                                                fontSize: `${layoutData.course_font_size / 3}px`,
                                                color: layoutData.course_font_color
                                            }}
                                        >
                                            <span className="text-[7px] text-slate-500 block">has successfully completed</span>
                                            {editData.course_title || "Course Title"}
                                        </div>
                                    )}

                                    {/* Signature */}
                                    {layoutData.show_signature && (
                                        <div 
                                            className="absolute text-center"
                                            style={{
                                                left: `${(layoutData.signature_position?.x || 550) / 11}%`,
                                                top: `${(layoutData.signature_position?.y || 580) / 7.8}%`,
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                        >
                                            <div className="border-b border-yellow-600/50 pb-0.5 mb-0.5">
                                                <span className="text-[10px] italic text-yellow-600/80" style={{ fontFamily: "Great Vibes" }}>
                                                    {layoutData.signature_name}
                                                </span>
                                            </div>
                                            <span className="text-[6px] text-slate-500">{layoutData.signature_title}</span>
                                        </div>
                                    )}

                                    {/* Date */}
                                    {layoutData.show_date && (
                                        <div 
                                            className="absolute"
                                            style={{
                                                left: `${(layoutData.date_position?.x || 550) / 11}%`,
                                                top: `${(layoutData.date_position?.y || 520) / 7.8}%`,
                                                transform: 'translate(-50%, -50%)',
                                                fontSize: `${layoutData.date_font_size / 3}px`,
                                                color: layoutData.date_font_color
                                            }}
                                        >
                                            {new Date(editData.issue_date || Date.now()).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    )}

                                    {/* Certificate ID */}
                                    {layoutData.show_cert_id && (
                                        <div 
                                            className="absolute font-mono"
                                            style={{
                                                left: `${(layoutData.cert_id_position?.x || 550) / 11}%`,
                                                top: `${(layoutData.cert_id_position?.y || 700) / 7.8}%`,
                                                transform: 'translate(-50%, -50%)',
                                                fontSize: `${layoutData.cert_id_font_size / 3}px`,
                                                color: layoutData.cert_id_font_color
                                            }}
                                        >
                                            {selectedCert.certificate_id}
                                        </div>
                                    )}

                                    {/* QR Code */}
                                    {layoutData.show_qr && (
                                        <div 
                                            className="absolute bg-white/90 rounded p-0.5 flex items-center justify-center"
                                            style={{
                                                left: `${(layoutData.qr_position?.x || 1000) / 11}%`,
                                                top: `${(layoutData.qr_position?.y || 650) / 7.8}%`,
                                                transform: 'translate(-50%, -50%)',
                                                width: `${layoutData.qr_size / 3.5}px`,
                                                height: `${layoutData.qr_size / 3.5}px`,
                                            }}
                                        >
                                            <QrCode className="w-full h-full text-slate-800" />
                                        </div>
                                    )}

                                    {/* Certification Logos */}
                                    <div className="absolute bottom-3 left-3 flex items-center gap-1">
                                        <img src={MSME_LOGO} alt="MSME" className="h-4 object-contain opacity-70" />
                                        <img src={ISO_LOGO} alt="ISO" className="h-4 object-contain opacity-70" />
                                    </div>
                                </div>

                                <p className="text-xs text-slate-500 text-center">
                                    Preview shows approximate positions. Changes will be saved and applied to the actual certificate.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between gap-3 pt-4 border-t border-white/10">
                        <div className="text-xs text-slate-500">
                            Status: {selectedCert?.is_locked === false ? (
                                <span className="text-green-400">Unlocked - User can edit name</span>
                            ) : (
                                <span className="text-red-400">Locked - User cannot edit</span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setShowLayoutDialog(false)}>
                                Cancel
                            </Button>
                            <Button className="btn-primary" onClick={handleSaveLayout} disabled={isSaving}>
                                {isSaving ? "Saving..." : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Certificate
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
