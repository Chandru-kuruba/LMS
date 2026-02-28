import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
    Award,
    Upload,
    Trash2,
    Save,
    Eye,
    Plus,
    Image,
    Type,
    Move,
    Palette,
    Settings,
    QrCode,
    FileText,
    Calendar,
    Building2,
    GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const defaultTemplate = {
    name: "",
    background_image: "",
    // Logo settings
    logo_image: "",
    logo_position: { x: 500, y: 80 },
    logo_size: { width: 120, height: 60 },
    show_logo: true,
    // Name settings
    name_position: { x: 500, y: 350 },
    name_font_family: "Great Vibes",
    name_font_size: 48,
    name_font_color: "#8B5CF6",
    // Course title settings
    course_position: { x: 500, y: 420 },
    course_font_family: "Outfit",
    course_font_size: 24,
    course_font_color: "#94A3B8",
    show_course: true,
    // Certificate ID settings
    cert_id_position: { x: 500, y: 620 },
    cert_id_font_size: 12,
    cert_id_font_color: "#64748B",
    show_cert_id: true,
    // Date settings
    date_position: { x: 500, y: 580 },
    date_font_size: 14,
    date_font_color: "#94A3B8",
    show_date: true,
    // QR Code settings
    qr_position: { x: 900, y: 600 },
    qr_size: 80,
    show_qr: true,
    // Signature settings
    signature_position: { x: 500, y: 520 },
    signature_name: "Chandru H",
    signature_title: "Founder & CEO",
    show_signature: true
};

const fontOptions = [
    { value: "Great Vibes", label: "Great Vibes (Script)" },
    { value: "Outfit", label: "Outfit (Modern)" },
    { value: "Playfair Display", label: "Playfair Display (Elegant)" },
    { value: "Montserrat", label: "Montserrat (Clean)" },
    { value: "Georgia", label: "Georgia (Classic)" },
    { value: "Times New Roman", label: "Times New Roman (Formal)" }
];

export default function CertificateTemplatesPage() {
    const { accessToken } = useAuthStore();
    const [templates, setTemplates] = useState([]);
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [showEditor, setShowEditor] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(defaultTemplate);
    const [isSaving, setIsSaving] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [activeTab, setActiveTab] = useState("basic");
    const previewRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, [accessToken]);

    const fetchData = async () => {
        try {
            const [templatesRes, coursesRes] = await Promise.all([
                axios.get(`${API}/admin/certificate-templates`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }).catch(() => ({ data: { templates: [] } })),
                axios.get(`${API}/admin/courses`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                })
            ]);
            setTemplates(templatesRes.data.templates || []);
            setCourses(coursesRes.data.courses || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e, type = "background") => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be less than 5MB");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === "background") {
                setEditingTemplate({
                    ...editingTemplate,
                    background_image: reader.result
                });
                setPreviewImage(reader.result);
            } else if (type === "logo") {
                setEditingTemplate({
                    ...editingTemplate,
                    logo_image: reader.result
                });
                setLogoPreview(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSaveTemplate = async () => {
        if (!editingTemplate.name.trim()) {
            toast.error("Please enter a template name");
            return;
        }

        setIsSaving(true);
        try {
            if (editingTemplate.id) {
                await axios.put(
                    `${API}/admin/certificate-templates/${editingTemplate.id}`,
                    editingTemplate,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                toast.success("Template updated!");
            } else {
                await axios.post(
                    `${API}/admin/certificate-templates`,
                    editingTemplate,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                toast.success("Template created!");
            }
            setShowEditor(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to save template");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteTemplate = async (templateId) => {
        if (!window.confirm("Are you sure you want to delete this template?")) return;
        
        try {
            await axios.delete(
                `${API}/admin/certificate-templates/${templateId}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success("Template deleted!");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete template");
        }
    };

    const handleAssignToCourse = async (templateId, courseId) => {
        try {
            await axios.post(
                `${API}/admin/certificate-templates/${templateId}/assign`,
                null,
                {
                    params: { course_id: courseId },
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            toast.success("Template assigned to course!");
            fetchData();
        } catch (error) {
            toast.error("Failed to assign template");
        }
    };

    const openEditor = (template = null) => {
        if (template) {
            setEditingTemplate({ ...defaultTemplate, ...template });
            setPreviewImage(template.background_image);
            setLogoPreview(template.logo_image);
        } else {
            setEditingTemplate({ ...defaultTemplate });
            setPreviewImage(null);
            setLogoPreview(null);
        }
        setActiveTab("basic");
        setShowEditor(true);
    };

    const updatePosition = (element, axis, value) => {
        const key = `${element}_position`;
        setEditingTemplate({
            ...editingTemplate,
            [key]: { ...editingTemplate[key], [axis]: value }
        });
    };

    const PositionControl = ({ label, element, maxX = 1000, maxY = 700 }) => (
        <div className="space-y-3 p-3 glass-light rounded-lg">
            <div className="flex items-center justify-between">
                <Label className="text-slate-300 flex items-center gap-2">
                    <GripVertical className="w-4 h-4" />
                    {label}
                </Label>
                <span className="text-xs text-slate-500">
                    ({editingTemplate[`${element}_position`]?.x || 0}, {editingTemplate[`${element}_position`]?.y || 0})
                </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <Label className="text-xs text-slate-500">X Position</Label>
                    <Slider
                        value={[editingTemplate[`${element}_position`]?.x || 0]}
                        onValueChange={([v]) => updatePosition(element, "x", v)}
                        min={0}
                        max={maxX}
                        className="py-2"
                    />
                </div>
                <div>
                    <Label className="text-xs text-slate-500">Y Position</Label>
                    <Slider
                        value={[editingTemplate[`${element}_position`]?.y || 0]}
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
        <div className="space-y-6" data-testid="certificate-templates-page">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-outfit text-2xl font-bold text-white">Certificate Templates</h1>
                    <p className="text-slate-400">Create and manage certificate designs with full control</p>
                </div>

                <Button className="btn-primary" onClick={() => openEditor()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                </Button>
            </div>

            {/* Templates Grid */}
            {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
                </div>
            ) : templates.length === 0 ? (
                <div className="glass-heavy rounded-xl p-12 text-center">
                    <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-white text-xl mb-2">No Templates Yet</h3>
                    <p className="text-slate-400 mb-6">
                        Create your first certificate template with full design control - position logos, text, QR codes, and more.
                    </p>
                    <Button className="btn-primary" onClick={() => openEditor()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Template
                    </Button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template, index) => (
                        <motion.div
                            key={template.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-heavy rounded-xl overflow-hidden"
                        >
                            {/* Preview */}
                            <div className="relative h-40 bg-slate-800 flex items-center justify-center overflow-hidden">
                                {template.background_image ? (
                                    <img 
                                        src={template.background_image} 
                                        alt={template.name}
                                        className="w-full h-full object-cover opacity-70"
                                    />
                                ) : (
                                    <Award className="w-16 h-16 text-slate-600" />
                                )}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span 
                                        style={{ 
                                            fontFamily: template.name_font_family || template.font_family,
                                            fontSize: `${(template.name_font_size || template.font_size || 48) / 2}px`,
                                            color: template.name_font_color || template.font_color
                                        }}
                                    >
                                        Sample Name
                                    </span>
                                </div>
                                {template.show_qr !== false && (
                                    <div className="absolute bottom-2 right-2 w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                                        <QrCode className="w-5 h-5 text-slate-400" />
                                    </div>
                                )}
                            </div>

                            <div className="p-4">
                                <h3 className="font-semibold text-white mb-2">{template.name}</h3>
                                
                                <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-slate-400">
                                    {template.show_logo !== false && <span className="px-2 py-0.5 bg-purple-500/20 rounded">Logo</span>}
                                    {template.show_qr !== false && <span className="px-2 py-0.5 bg-cyan-500/20 rounded">QR</span>}
                                    {template.show_signature !== false && <span className="px-2 py-0.5 bg-green-500/20 rounded">Signature</span>}
                                </div>

                                {/* Course Assignment */}
                                <div className="mb-4">
                                    <Label className="text-xs text-slate-500">Assign to Course</Label>
                                    <Select onValueChange={(v) => handleAssignToCourse(template.id, v)}>
                                        <SelectTrigger className="mt-1 input-neon h-9 text-sm">
                                            <SelectValue placeholder="Select course" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {courses.map(course => (
                                                <SelectItem key={course.id} value={course.id}>
                                                    {course.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 border-purple-500/50 text-purple-400"
                                        onClick={() => openEditor(template)}
                                    >
                                        <Settings className="w-4 h-4 mr-1" />
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-red-500/50 text-red-400"
                                        onClick={() => handleDeleteTemplate(template.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Default Template Info */}
            <div className="glass-medium rounded-xl p-6">
                <h3 className="font-semibold text-white mb-4">Default Certificate</h3>
                <p className="text-slate-400 text-sm">
                    If no template is assigned to a course, a default elegant certificate design will be used.
                    The default template features a dark gradient background with neon accents, company logo, signature, and QR code for verification.
                </p>
            </div>

            {/* Enhanced Template Editor Dialog */}
            <Dialog open={showEditor} onOpenChange={setShowEditor}>
                <DialogContent className="glass-heavy border-purple-500/30 max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Award className="w-5 h-5 text-purple-400" />
                            {editingTemplate.id ? "Edit Template" : "Create Template"} - Advanced Editor
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid lg:grid-cols-5 gap-6 py-4">
                        {/* Settings Panel - 2 columns */}
                        <div className="lg:col-span-2 space-y-4">
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="grid w-full grid-cols-4 glass-medium">
                                    <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
                                    <TabsTrigger value="text" className="text-xs">Text</TabsTrigger>
                                    <TabsTrigger value="elements" className="text-xs">Elements</TabsTrigger>
                                    <TabsTrigger value="position" className="text-xs">Position</TabsTrigger>
                                </TabsList>

                                {/* Basic Tab */}
                                <TabsContent value="basic" className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Template Name *</Label>
                                        <Input
                                            value={editingTemplate.name}
                                            onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                            placeholder="e.g., Modern Blue Certificate"
                                            className="input-neon"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Background Image</Label>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, "background")}
                                            className="input-neon"
                                        />
                                        <p className="text-xs text-slate-500">Recommended: 1000x700px, max 5MB</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Logo Image</Label>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, "logo")}
                                            className="input-neon"
                                        />
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500">Company/Organization logo</span>
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs text-slate-400">Show Logo</Label>
                                                <Switch
                                                    checked={editingTemplate.show_logo}
                                                    onCheckedChange={(v) => setEditingTemplate({ ...editingTemplate, show_logo: v })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {editingTemplate.show_logo && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-slate-400">Logo Width: {editingTemplate.logo_size?.width || 120}px</Label>
                                                <Slider
                                                    value={[editingTemplate.logo_size?.width || 120]}
                                                    onValueChange={([v]) => setEditingTemplate({
                                                        ...editingTemplate,
                                                        logo_size: { ...editingTemplate.logo_size, width: v }
                                                    })}
                                                    min={40}
                                                    max={300}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-slate-400">Logo Height: {editingTemplate.logo_size?.height || 60}px</Label>
                                                <Slider
                                                    value={[editingTemplate.logo_size?.height || 60]}
                                                    onValueChange={([v]) => setEditingTemplate({
                                                        ...editingTemplate,
                                                        logo_size: { ...editingTemplate.logo_size, height: v }
                                                    })}
                                                    min={20}
                                                    max={150}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Text Styling Tab */}
                                <TabsContent value="text" className="space-y-4 mt-4">
                                    {/* Name Styling */}
                                    <div className="p-3 glass-light rounded-lg space-y-3">
                                        <Label className="text-slate-300 flex items-center gap-2">
                                            <Type className="w-4 h-4" /> Recipient Name
                                        </Label>
                                        <Select 
                                            value={editingTemplate.name_font_family}
                                            onValueChange={(v) => setEditingTemplate({ ...editingTemplate, name_font_family: v })}
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
                                                <Label className="text-xs text-slate-500">Size: {editingTemplate.name_font_size}px</Label>
                                                <Slider
                                                    value={[editingTemplate.name_font_size]}
                                                    onValueChange={([v]) => setEditingTemplate({ ...editingTemplate, name_font_size: v })}
                                                    min={24}
                                                    max={72}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={editingTemplate.name_font_color}
                                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name_font_color: e.target.value })}
                                                    className="w-10 h-8 rounded cursor-pointer"
                                                />
                                                <Input
                                                    value={editingTemplate.name_font_color}
                                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name_font_color: e.target.value })}
                                                    className="input-neon flex-1 text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Course Title Styling */}
                                    <div className="p-3 glass-light rounded-lg space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-slate-300 flex items-center gap-2">
                                                <FileText className="w-4 h-4" /> Course Title
                                            </Label>
                                            <Switch
                                                checked={editingTemplate.show_course}
                                                onCheckedChange={(v) => setEditingTemplate({ ...editingTemplate, show_course: v })}
                                            />
                                        </div>
                                        {editingTemplate.show_course && (
                                            <>
                                                <Select 
                                                    value={editingTemplate.course_font_family}
                                                    onValueChange={(v) => setEditingTemplate({ ...editingTemplate, course_font_family: v })}
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
                                                        <Label className="text-xs text-slate-500">Size: {editingTemplate.course_font_size}px</Label>
                                                        <Slider
                                                            value={[editingTemplate.course_font_size]}
                                                            onValueChange={([v]) => setEditingTemplate({ ...editingTemplate, course_font_size: v })}
                                                            min={12}
                                                            max={36}
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={editingTemplate.course_font_color}
                                                            onChange={(e) => setEditingTemplate({ ...editingTemplate, course_font_color: e.target.value })}
                                                            className="w-10 h-8 rounded cursor-pointer"
                                                        />
                                                        <Input
                                                            value={editingTemplate.course_font_color}
                                                            onChange={(e) => setEditingTemplate({ ...editingTemplate, course_font_color: e.target.value })}
                                                            className="input-neon flex-1 text-xs"
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
                                                <Building2 className="w-4 h-4" /> Signature
                                            </Label>
                                            <Switch
                                                checked={editingTemplate.show_signature}
                                                onCheckedChange={(v) => setEditingTemplate({ ...editingTemplate, show_signature: v })}
                                            />
                                        </div>
                                        {editingTemplate.show_signature && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-xs text-slate-500">Signer Name</Label>
                                                    <Input
                                                        value={editingTemplate.signature_name}
                                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, signature_name: e.target.value })}
                                                        className="input-neon text-sm"
                                                        placeholder="John Smith"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-slate-500">Title</Label>
                                                    <Input
                                                        value={editingTemplate.signature_title}
                                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, signature_title: e.target.value })}
                                                        className="input-neon text-sm"
                                                        placeholder="CEO"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                {/* Elements Tab */}
                                <TabsContent value="elements" className="space-y-4 mt-4">
                                    {/* QR Code Settings */}
                                    <div className="p-3 glass-light rounded-lg space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-slate-300 flex items-center gap-2">
                                                <QrCode className="w-4 h-4" /> QR Code (Verification)
                                            </Label>
                                            <Switch
                                                checked={editingTemplate.show_qr}
                                                onCheckedChange={(v) => setEditingTemplate({ ...editingTemplate, show_qr: v })}
                                            />
                                        </div>
                                        {editingTemplate.show_qr && (
                                            <div>
                                                <Label className="text-xs text-slate-500">QR Size: {editingTemplate.qr_size}px</Label>
                                                <Slider
                                                    value={[editingTemplate.qr_size]}
                                                    onValueChange={([v]) => setEditingTemplate({ ...editingTemplate, qr_size: v })}
                                                    min={40}
                                                    max={150}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Date Settings */}
                                    <div className="p-3 glass-light rounded-lg space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-slate-300 flex items-center gap-2">
                                                <Calendar className="w-4 h-4" /> Issue Date
                                            </Label>
                                            <Switch
                                                checked={editingTemplate.show_date}
                                                onCheckedChange={(v) => setEditingTemplate({ ...editingTemplate, show_date: v })}
                                            />
                                        </div>
                                        {editingTemplate.show_date && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-xs text-slate-500">Size: {editingTemplate.date_font_size}px</Label>
                                                    <Slider
                                                        value={[editingTemplate.date_font_size]}
                                                        onValueChange={([v]) => setEditingTemplate({ ...editingTemplate, date_font_size: v })}
                                                        min={10}
                                                        max={24}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={editingTemplate.date_font_color}
                                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, date_font_color: e.target.value })}
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
                                                <FileText className="w-4 h-4" /> Certificate ID
                                            </Label>
                                            <Switch
                                                checked={editingTemplate.show_cert_id}
                                                onCheckedChange={(v) => setEditingTemplate({ ...editingTemplate, show_cert_id: v })}
                                            />
                                        </div>
                                        {editingTemplate.show_cert_id && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-xs text-slate-500">Size: {editingTemplate.cert_id_font_size}px</Label>
                                                    <Slider
                                                        value={[editingTemplate.cert_id_font_size]}
                                                        onValueChange={([v]) => setEditingTemplate({ ...editingTemplate, cert_id_font_size: v })}
                                                        min={8}
                                                        max={18}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={editingTemplate.cert_id_font_color}
                                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, cert_id_font_color: e.target.value })}
                                                        className="w-10 h-8 rounded cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                {/* Position Tab */}
                                <TabsContent value="position" className="space-y-3 mt-4 max-h-[400px] overflow-y-auto">
                                    {editingTemplate.show_logo && <PositionControl label="Logo" element="logo" />}
                                    <PositionControl label="Recipient Name" element="name" />
                                    {editingTemplate.show_course && <PositionControl label="Course Title" element="course" />}
                                    {editingTemplate.show_signature && <PositionControl label="Signature" element="signature" />}
                                    {editingTemplate.show_date && <PositionControl label="Date" element="date" />}
                                    {editingTemplate.show_cert_id && <PositionControl label="Certificate ID" element="cert_id" />}
                                    {editingTemplate.show_qr && <PositionControl label="QR Code" element="qr" />}
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Preview Panel - 3 columns */}
                        <div className="lg:col-span-3 space-y-2">
                            <Label className="text-slate-300">Live Preview</Label>
                            <div 
                                ref={previewRef}
                                className="relative w-full aspect-[10/7] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden border border-purple-500/20"
                                style={{
                                    backgroundImage: previewImage ? `url(${previewImage})` : undefined,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}
                            >
                                {!previewImage && (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                        <Image className="w-24 h-24 text-slate-600" />
                                    </div>
                                )}

                                {/* Logo */}
                                {editingTemplate.show_logo && (
                                    <div 
                                        className="absolute flex items-center justify-center"
                                        style={{
                                            left: `${(editingTemplate.logo_position?.x || 500) / 10}%`,
                                            top: `${(editingTemplate.logo_position?.y || 80) / 7}%`,
                                            transform: 'translate(-50%, -50%)',
                                            width: `${(editingTemplate.logo_size?.width || 120) / 5}px`,
                                            height: `${(editingTemplate.logo_size?.height || 60) / 5}px`,
                                        }}
                                    >
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
                                        ) : (
                                            <div className="w-full h-full bg-purple-500/20 rounded flex items-center justify-center">
                                                <Building2 className="w-4 h-4 text-purple-400" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Name */}
                                <div 
                                    className="absolute text-center whitespace-nowrap"
                                    style={{
                                        left: `${(editingTemplate.name_position?.x || 500) / 10}%`,
                                        top: `${(editingTemplate.name_position?.y || 350) / 7}%`,
                                        transform: 'translate(-50%, -50%)',
                                        fontFamily: editingTemplate.name_font_family,
                                        fontSize: `${editingTemplate.name_font_size / 2.5}px`,
                                        color: editingTemplate.name_font_color
                                    }}
                                >
                                    John Doe
                                </div>

                                {/* Course Title */}
                                {editingTemplate.show_course && (
                                    <div 
                                        className="absolute text-center whitespace-nowrap"
                                        style={{
                                            left: `${(editingTemplate.course_position?.x || 500) / 10}%`,
                                            top: `${(editingTemplate.course_position?.y || 420) / 7}%`,
                                            transform: 'translate(-50%, -50%)',
                                            fontFamily: editingTemplate.course_font_family,
                                            fontSize: `${editingTemplate.course_font_size / 2.5}px`,
                                            color: editingTemplate.course_font_color
                                        }}
                                    >
                                        Complete Web Development
                                    </div>
                                )}

                                {/* Signature */}
                                {editingTemplate.show_signature && (
                                    <div 
                                        className="absolute text-center"
                                        style={{
                                            left: `${(editingTemplate.signature_position?.x || 500) / 10}%`,
                                            top: `${(editingTemplate.signature_position?.y || 520) / 7}%`,
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                    >
                                        <div className="border-b border-slate-500 pb-1 mb-1">
                                            <span className="text-xs italic text-slate-400" style={{ fontFamily: "Great Vibes" }}>
                                                {editingTemplate.signature_name}
                                            </span>
                                        </div>
                                        <span className="text-[8px] text-slate-500">{editingTemplate.signature_title}</span>
                                    </div>
                                )}

                                {/* Date */}
                                {editingTemplate.show_date && (
                                    <div 
                                        className="absolute"
                                        style={{
                                            left: `${(editingTemplate.date_position?.x || 500) / 10}%`,
                                            top: `${(editingTemplate.date_position?.y || 580) / 7}%`,
                                            transform: 'translate(-50%, -50%)',
                                            fontSize: `${editingTemplate.date_font_size / 2.5}px`,
                                            color: editingTemplate.date_font_color
                                        }}
                                    >
                                        February 28, 2026
                                    </div>
                                )}

                                {/* Certificate ID */}
                                {editingTemplate.show_cert_id && (
                                    <div 
                                        className="absolute font-mono"
                                        style={{
                                            left: `${(editingTemplate.cert_id_position?.x || 500) / 10}%`,
                                            top: `${(editingTemplate.cert_id_position?.y || 620) / 7}%`,
                                            transform: 'translate(-50%, -50%)',
                                            fontSize: `${editingTemplate.cert_id_font_size / 2.5}px`,
                                            color: editingTemplate.cert_id_font_color
                                        }}
                                    >
                                        LUMINA-XXXXXXXX-XXXXXXXX
                                    </div>
                                )}

                                {/* QR Code */}
                                {editingTemplate.show_qr && (
                                    <div 
                                        className="absolute bg-white/90 rounded p-1"
                                        style={{
                                            left: `${(editingTemplate.qr_position?.x || 900) / 10}%`,
                                            top: `${(editingTemplate.qr_position?.y || 600) / 7}%`,
                                            transform: 'translate(-50%, -50%)',
                                            width: `${editingTemplate.qr_size / 3}px`,
                                            height: `${editingTemplate.qr_size / 3}px`,
                                        }}
                                    >
                                        <QrCode className="w-full h-full text-slate-800" />
                                    </div>
                                )}
                            </div>

                            <p className="text-xs text-slate-500 text-center">
                                Preview shows approximate positions. Actual certificate may vary slightly.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <Button variant="outline" onClick={() => setShowEditor(false)}>
                            Cancel
                        </Button>
                        <Button 
                            className="btn-primary" 
                            onClick={handleSaveTemplate}
                            disabled={isSaving}
                        >
                            {isSaving ? "Saving..." : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Template
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
