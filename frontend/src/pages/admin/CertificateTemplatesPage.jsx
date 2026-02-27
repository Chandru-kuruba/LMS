import { useState, useEffect } from "react";
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
    Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
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
import { useAuthStore } from "@/store/authStore";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const defaultTemplate = {
    name: "",
    background_image: "",
    name_position: { x: 500, y: 350 },
    cert_id_position: { x: 500, y: 650 },
    date_position: { x: 500, y: 600 },
    font_family: "Great Vibes",
    font_size: 48,
    font_color: "#8B5CF6"
};

const fontOptions = [
    { value: "Great Vibes", label: "Great Vibes (Script)" },
    { value: "Outfit", label: "Outfit (Modern)" },
    { value: "Playfair Display", label: "Playfair Display (Elegant)" },
    { value: "Montserrat", label: "Montserrat (Clean)" },
    { value: "Georgia", label: "Georgia (Classic)" }
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

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be less than 5MB");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setEditingTemplate({
                ...editingTemplate,
                background_image: reader.result
            });
            setPreviewImage(reader.result);
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
            setEditingTemplate(template);
            setPreviewImage(template.background_image);
        } else {
            setEditingTemplate({ ...defaultTemplate });
            setPreviewImage(null);
        }
        setShowEditor(true);
    };

    return (
        <div className="space-y-6" data-testid="certificate-templates-page">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-outfit text-2xl font-bold text-white">Certificate Templates</h1>
                    <p className="text-slate-400">Create and manage certificate designs</p>
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
                        Create your first certificate template to customize how certificates look.
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
                                            fontFamily: template.font_family,
                                            fontSize: `${template.font_size / 2}px`,
                                            color: template.font_color
                                        }}
                                    >
                                        Sample Name
                                    </span>
                                </div>
                            </div>

                            <div className="p-4">
                                <h3 className="font-semibold text-white mb-2">{template.name}</h3>
                                
                                <div className="flex items-center gap-2 mb-4 text-sm text-slate-400">
                                    <Type className="w-4 h-4" />
                                    <span>{template.font_family}</span>
                                    <span className="w-4 h-4 rounded" style={{ backgroundColor: template.font_color }} />
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
                    The default template features a dark gradient background with neon accents.
                </p>
            </div>

            {/* Template Editor Dialog */}
            <Dialog open={showEditor} onOpenChange={setShowEditor}>
                <DialogContent className="glass-heavy border-purple-500/30 max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Award className="w-5 h-5 text-purple-400" />
                            {editingTemplate.id ? "Edit Template" : "Create Template"}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid lg:grid-cols-2 gap-6 py-4">
                        {/* Settings */}
                        <div className="space-y-4">
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
                                <div className="flex gap-2">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="input-neon"
                                    />
                                </div>
                                <p className="text-xs text-slate-500">Recommended: 1000x700px, max 5MB</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300">Font Family</Label>
                                <Select 
                                    value={editingTemplate.font_family}
                                    onValueChange={(v) => setEditingTemplate({ ...editingTemplate, font_family: v })}
                                >
                                    <SelectTrigger className="input-neon">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fontOptions.map(font => (
                                            <SelectItem key={font.value} value={font.value}>
                                                {font.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300">Font Size: {editingTemplate.font_size}px</Label>
                                <Slider
                                    value={[editingTemplate.font_size]}
                                    onValueChange={([v]) => setEditingTemplate({ ...editingTemplate, font_size: v })}
                                    min={24}
                                    max={72}
                                    step={2}
                                    className="py-2"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300">Font Color</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={editingTemplate.font_color}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, font_color: e.target.value })}
                                        className="w-12 h-10 rounded cursor-pointer"
                                    />
                                    <Input
                                        value={editingTemplate.font_color}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, font_color: e.target.value })}
                                        className="input-neon flex-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Name X Position</Label>
                                    <Slider
                                        value={[editingTemplate.name_position.x]}
                                        onValueChange={([v]) => setEditingTemplate({ 
                                            ...editingTemplate, 
                                            name_position: { ...editingTemplate.name_position, x: v }
                                        })}
                                        min={0}
                                        max={1000}
                                        className="py-2"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Name Y Position</Label>
                                    <Slider
                                        value={[editingTemplate.name_position.y]}
                                        onValueChange={([v]) => setEditingTemplate({ 
                                            ...editingTemplate, 
                                            name_position: { ...editingTemplate.name_position, y: v }
                                        })}
                                        min={0}
                                        max={700}
                                        className="py-2"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="space-y-2">
                            <Label className="text-slate-300">Preview</Label>
                            <div 
                                className="relative w-full aspect-[10/7] bg-slate-800 rounded-lg overflow-hidden border border-white/10"
                                style={{
                                    backgroundImage: previewImage ? `url(${previewImage})` : undefined,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}
                            >
                                {!previewImage && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Image className="w-12 h-12 text-slate-600" />
                                    </div>
                                )}
                                <div 
                                    className="absolute"
                                    style={{
                                        left: `${editingTemplate.name_position.x / 10}%`,
                                        top: `${editingTemplate.name_position.y / 7}%`,
                                        transform: 'translate(-50%, -50%)',
                                        fontFamily: editingTemplate.font_family,
                                        fontSize: `${editingTemplate.font_size / 2}px`,
                                        color: editingTemplate.font_color
                                    }}
                                >
                                    John Doe
                                </div>
                            </div>
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
                            {isSaving ? "Saving..." : "Save Template"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
