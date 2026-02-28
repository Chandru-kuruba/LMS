import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import {
    Award,
    Save,
    RotateCcw,
    Eye,
    Upload,
    Type,
    Move,
    Image,
    QrCode,
    Building2,
    FileText,
    Calendar,
    Palette,
    Plus,
    Trash2,
    GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
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

const defaultGlobalDesign = {
    // Certificate dimensions - A4 Landscape (297mm x 210mm)
    // At 96 DPI: 1123px x 794px, for better quality we use 1190px x 842px
    certificate_width: 1190,
    certificate_height: 842,
    
    // Background
    background_color: "#0d0d1a",
    background_image: "",
    border_color: "#ca8a04",
    border_width: 4,
    
    // Margins (in pixels)
    margin_top: 40,
    margin_bottom: 40,
    margin_left: 50,
    margin_right: 50,
    
    // Header section
    header_text: "CERTIFICATE OF COMPLETION",
    header_position: { x: 595, y: 140 },
    header_font_size: 18,
    header_color: "#ca8a04",
    header_letter_spacing: 0.4,
    
    // Subheader
    subheader_text: "This is to certify that",
    subheader_position: { x: 595, y: 300 },
    subheader_font_size: 16,
    subheader_color: "#94A3B8",
    
    // Name settings
    name_position: { x: 595, y: 380 },
    name_font_family: "Great Vibes",
    name_font_size: 60,
    name_font_color: "#ffd700",
    
    // Course text
    course_prefix: "has successfully completed",
    course_prefix_position: { x: 595, y: 440 },
    course_prefix_font_size: 14,
    course_prefix_color: "#64748B",
    
    // Course title settings
    course_position: { x: 595, y: 490 },
    course_font_family: "Outfit",
    course_font_size: 28,
    course_font_color: "#94A3B8",
    show_course: true,
    
    // Date settings
    date_position: { x: 595, y: 580 },
    date_font_size: 16,
    date_font_color: "#94A3B8",
    date_format: "MMMM DD, YYYY",
    show_date: true,
    
    // Certificate ID settings
    cert_id_position: { x: 595, y: 780 },
    cert_id_font_size: 11,
    cert_id_font_color: "#64748B",
    show_cert_id: true,
    
    // Main Logo settings - INCREASED SIZE
    logo_position: { x: 150, y: 70 },
    logo_size: { width: 250, height: 100 },
    show_logo: true,
    logo_url: COMPANY_LOGO,
    
    // Additional logos - INCREASED SIZE
    additional_logos: [
        { id: "msme", url: MSME_LOGO, position: { x: 150, y: 760 }, size: { width: 80, height: 50 }, show: true },
        { id: "iso", url: ISO_LOGO, position: { x: 260, y: 760 }, size: { width: 80, height: 50 }, show: true }
    ],
    
    // QR Code settings
    qr_position: { x: 1080, y: 720 },
    qr_size: 100,
    show_qr: true,
    
    // Signature settings
    signature_position: { x: 595, y: 650 },
    signature_name: "Chandru H",
    signature_title: "Founder & CEO",
    signature_font_family: "Great Vibes",
    show_signature: true,
    
    // Decorative corners
    show_corners: true,
    corner_color: "#ca8a04",
    corner_size: 70
};

export default function CertificateDesignPage() {
    const { accessToken } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [design, setDesign] = useState({ ...defaultGlobalDesign });
    const [activeTab, setActiveTab] = useState("layout");
    const [newLogoUrl, setNewLogoUrl] = useState("");

    useEffect(() => {
        fetchGlobalDesign();
    }, [accessToken]);

    const fetchGlobalDesign = async () => {
        try {
            const response = await axios.get(`${API}/admin/certificate-design`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (response.data.design) {
                setDesign({ ...defaultGlobalDesign, ...response.data.design });
            }
        } catch (error) {
            console.log("No existing design, using defaults");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveDesign = async () => {
        setIsSaving(true);
        try {
            await axios.put(
                `${API}/admin/certificate-design`,
                design,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success("Global certificate design saved! All certificates will now use this design.");
        } catch (error) {
            toast.error("Failed to save design");
        } finally {
            setIsSaving(false);
        }
    };

    const resetToDefaults = () => {
        setDesign({ ...defaultGlobalDesign });
        toast.success("Design reset to defaults");
    };

    const updatePosition = (element, axis, value) => {
        const key = `${element}_position`;
        setDesign({
            ...design,
            [key]: { ...design[key], [axis]: value }
        });
    };

    const addAdditionalLogo = () => {
        if (!newLogoUrl.trim()) {
            toast.error("Please enter a logo URL");
            return;
        }
        const newLogo = {
            id: `logo_${Date.now()}`,
            url: newLogoUrl,
            position: { x: 300, y: 680 },
            size: { width: 60, height: 40 },
            show: true
        };
        setDesign({
            ...design,
            additional_logos: [...(design.additional_logos || []), newLogo]
        });
        setNewLogoUrl("");
        toast.success("Logo added!");
    };

    const updateAdditionalLogo = (id, field, value) => {
        setDesign({
            ...design,
            additional_logos: design.additional_logos.map(logo =>
                logo.id === id ? { ...logo, [field]: value } : logo
            )
        });
    };

    const removeAdditionalLogo = (id) => {
        setDesign({
            ...design,
            additional_logos: design.additional_logos.filter(logo => logo.id !== id)
        });
        toast.success("Logo removed");
    };

    const PositionControl = ({ label, element, icon: Icon, maxX = 1100, maxY = 780 }) => (
        <div className="space-y-3 p-3 glass-light rounded-lg">
            <div className="flex items-center justify-between">
                <Label className="text-slate-300 flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4 text-purple-400" />}
                    {label}
                </Label>
                <span className="text-xs text-slate-500 font-mono">
                    ({design[`${element}_position`]?.x || 0}, {design[`${element}_position`]?.y || 0})
                </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <Label className="text-xs text-slate-500">X Position</Label>
                    <Slider
                        value={[design[`${element}_position`]?.x || 0]}
                        onValueChange={([v]) => updatePosition(element, "x", v)}
                        min={0}
                        max={maxX}
                        className="py-2"
                    />
                </div>
                <div>
                    <Label className="text-xs text-slate-500">Y Position</Label>
                    <Slider
                        value={[design[`${element}_position`]?.y || 0]}
                        onValueChange={([v]) => updatePosition(element, "y", v)}
                        min={0}
                        max={maxY}
                        className="py-2"
                    />
                </div>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-[600px] rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="certificate-design-page">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-outfit text-2xl font-bold text-white">Global Certificate Design</h1>
                    <p className="text-slate-400">Edit the master certificate design - changes apply to ALL certificates</p>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={resetToDefaults}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset Defaults
                    </Button>
                    <Button className="btn-primary" onClick={handleSaveDesign} disabled={isSaving}>
                        {isSaving ? "Saving..." : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Global Design
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="glass-medium rounded-xl p-4 border border-yellow-500/30">
                <div className="flex items-start gap-3">
                    <Award className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-yellow-400">Global Design Mode</h3>
                        <p className="text-slate-400 text-sm">
                            Changes made here will apply to <strong className="text-white">all certificates</strong> globally. 
                            Individual certificate edits (from Certificates page) will override these settings for specific certificates only.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
                {/* Settings Panel - 2 columns */}
                <div className="lg:col-span-2 space-y-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-4 glass-medium">
                            <TabsTrigger value="layout" className="text-xs">Layout</TabsTrigger>
                            <TabsTrigger value="text" className="text-xs">Text</TabsTrigger>
                            <TabsTrigger value="logos" className="text-xs">Logos</TabsTrigger>
                            <TabsTrigger value="position" className="text-xs">Position</TabsTrigger>
                        </TabsList>

                        {/* Layout Tab */}
                        <TabsContent value="layout" className="space-y-4 mt-4 max-h-[500px] overflow-y-auto">
                            <div className="p-3 glass-light rounded-lg space-y-3">
                                <Label className="text-slate-300 flex items-center gap-2">
                                    <Palette className="w-4 h-4 text-purple-400" /> Background & Border
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs text-slate-500">Background Color</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <input
                                                type="color"
                                                value={design.background_color}
                                                onChange={(e) => setDesign({ ...design, background_color: e.target.value })}
                                                className="w-10 h-8 rounded cursor-pointer"
                                            />
                                            <Input
                                                value={design.background_color}
                                                onChange={(e) => setDesign({ ...design, background_color: e.target.value })}
                                                className="input-neon flex-1 text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-slate-500">Border Color</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <input
                                                type="color"
                                                value={design.border_color}
                                                onChange={(e) => setDesign({ ...design, border_color: e.target.value })}
                                                className="w-10 h-8 rounded cursor-pointer"
                                            />
                                            <Input
                                                value={design.border_color}
                                                onChange={(e) => setDesign({ ...design, border_color: e.target.value })}
                                                className="input-neon flex-1 text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Border Width: {design.border_width}px</Label>
                                    <Slider
                                        value={[design.border_width]}
                                        onValueChange={([v]) => setDesign({ ...design, border_width: v })}
                                        min={0}
                                        max={10}
                                    />
                                </div>
                            </div>

                            <div className="p-3 glass-light rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-slate-300">Decorative Corners</Label>
                                    <Switch
                                        checked={design.show_corners}
                                        onCheckedChange={(v) => setDesign({ ...design, show_corners: v })}
                                    />
                                </div>
                                {design.show_corners && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs text-slate-500">Corner Size: {design.corner_size}px</Label>
                                            <Slider
                                                value={[design.corner_size]}
                                                onValueChange={([v]) => setDesign({ ...design, corner_size: v })}
                                                min={20}
                                                max={100}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={design.corner_color}
                                                onChange={(e) => setDesign({ ...design, corner_color: e.target.value })}
                                                className="w-10 h-8 rounded cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-3 glass-light rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-slate-300 flex items-center gap-2">
                                        <QrCode className="w-4 h-4 text-blue-400" /> QR Code
                                    </Label>
                                    <Switch
                                        checked={design.show_qr}
                                        onCheckedChange={(v) => setDesign({ ...design, show_qr: v })}
                                    />
                                </div>
                                {design.show_qr && (
                                    <div>
                                        <Label className="text-xs text-slate-500">QR Size: {design.qr_size}px</Label>
                                        <Slider
                                            value={[design.qr_size]}
                                            onValueChange={([v]) => setDesign({ ...design, qr_size: v })}
                                            min={50}
                                            max={150}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="p-3 glass-light rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-slate-300">Show Date</Label>
                                    <Switch
                                        checked={design.show_date}
                                        onCheckedChange={(v) => setDesign({ ...design, show_date: v })}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-slate-300">Show Certificate ID</Label>
                                    <Switch
                                        checked={design.show_cert_id}
                                        onCheckedChange={(v) => setDesign({ ...design, show_cert_id: v })}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Text Styling Tab */}
                        <TabsContent value="text" className="space-y-4 mt-4 max-h-[500px] overflow-y-auto">
                            {/* Header */}
                            <div className="p-3 glass-light rounded-lg space-y-3">
                                <Label className="text-slate-300">Header Text</Label>
                                <Input
                                    value={design.header_text}
                                    onChange={(e) => setDesign({ ...design, header_text: e.target.value })}
                                    className="input-neon"
                                    placeholder="CERTIFICATE OF COMPLETION"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs text-slate-500">Size: {design.header_font_size}px</Label>
                                        <Slider
                                            value={[design.header_font_size]}
                                            onValueChange={([v]) => setDesign({ ...design, header_font_size: v })}
                                            min={10}
                                            max={24}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={design.header_color}
                                            onChange={(e) => setDesign({ ...design, header_color: e.target.value })}
                                            className="w-10 h-8 rounded cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Name Styling */}
                            <div className="p-3 glass-light rounded-lg space-y-3">
                                <Label className="text-slate-300 flex items-center gap-2">
                                    <Type className="w-4 h-4 text-yellow-400" /> Recipient Name
                                </Label>
                                <Select 
                                    value={design.name_font_family}
                                    onValueChange={(v) => setDesign({ ...design, name_font_family: v })}
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
                                        <Label className="text-xs text-slate-500">Size: {design.name_font_size}px</Label>
                                        <Slider
                                            value={[design.name_font_size]}
                                            onValueChange={([v]) => setDesign({ ...design, name_font_size: v })}
                                            min={24}
                                            max={80}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={design.name_font_color}
                                            onChange={(e) => setDesign({ ...design, name_font_color: e.target.value })}
                                            className="w-10 h-8 rounded cursor-pointer"
                                        />
                                        <Input
                                            value={design.name_font_color}
                                            onChange={(e) => setDesign({ ...design, name_font_color: e.target.value })}
                                            className="input-neon flex-1 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Course Styling */}
                            <div className="p-3 glass-light rounded-lg space-y-3">
                                <Label className="text-slate-300 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-cyan-400" /> Course Title
                                </Label>
                                <Select 
                                    value={design.course_font_family}
                                    onValueChange={(v) => setDesign({ ...design, course_font_family: v })}
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
                                        <Label className="text-xs text-slate-500">Size: {design.course_font_size}px</Label>
                                        <Slider
                                            value={[design.course_font_size]}
                                            onValueChange={([v]) => setDesign({ ...design, course_font_size: v })}
                                            min={12}
                                            max={40}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={design.course_font_color}
                                            onChange={(e) => setDesign({ ...design, course_font_color: e.target.value })}
                                            className="w-10 h-8 rounded cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Signature Settings */}
                            <div className="p-3 glass-light rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-slate-300 flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-green-400" /> Signature
                                    </Label>
                                    <Switch
                                        checked={design.show_signature}
                                        onCheckedChange={(v) => setDesign({ ...design, show_signature: v })}
                                    />
                                </div>
                                {design.show_signature && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-xs text-slate-500">Signer Name</Label>
                                                <Input
                                                    value={design.signature_name}
                                                    onChange={(e) => setDesign({ ...design, signature_name: e.target.value })}
                                                    className="input-neon text-sm"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs text-slate-500">Title</Label>
                                                <Input
                                                    value={design.signature_title}
                                                    onChange={(e) => setDesign({ ...design, signature_title: e.target.value })}
                                                    className="input-neon text-sm"
                                                />
                                            </div>
                                        </div>
                                        <Select 
                                            value={design.signature_font_family}
                                            onValueChange={(v) => setDesign({ ...design, signature_font_family: v })}
                                        >
                                            <SelectTrigger className="input-neon">
                                                <SelectValue placeholder="Signature Font" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {fontOptions.map(font => (
                                                    <SelectItem key={font.value} value={font.value}>
                                                        {font.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </>
                                )}
                            </div>
                        </TabsContent>

                        {/* Logos Tab */}
                        <TabsContent value="logos" className="space-y-4 mt-4 max-h-[500px] overflow-y-auto">
                            {/* Main Logo */}
                            <div className="p-3 glass-light rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-slate-300 flex items-center gap-2">
                                        <Image className="w-4 h-4 text-purple-400" /> Main Company Logo
                                    </Label>
                                    <Switch
                                        checked={design.show_logo}
                                        onCheckedChange={(v) => setDesign({ ...design, show_logo: v })}
                                    />
                                </div>
                                {design.show_logo && (
                                    <>
                                        <div>
                                            <Label className="text-xs text-slate-500">Logo URL</Label>
                                            <Input
                                                value={design.logo_url}
                                                onChange={(e) => setDesign({ ...design, logo_url: e.target.value })}
                                                className="input-neon text-sm"
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-xs text-slate-500">Width: {design.logo_size?.width || 180}px</Label>
                                                <Slider
                                                    value={[design.logo_size?.width || 180]}
                                                    onValueChange={([v]) => setDesign({
                                                        ...design,
                                                        logo_size: { ...design.logo_size, width: v }
                                                    })}
                                                    min={60}
                                                    max={400}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs text-slate-500">Height: {design.logo_size?.height || 60}px</Label>
                                                <Slider
                                                    value={[design.logo_size?.height || 60]}
                                                    onValueChange={([v]) => setDesign({
                                                        ...design,
                                                        logo_size: { ...design.logo_size, height: v }
                                                    })}
                                                    min={30}
                                                    max={150}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Additional Logos */}
                            <div className="p-3 glass-light rounded-lg space-y-3">
                                <Label className="text-slate-300 flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-green-400" /> Additional Logos (MSME, ISO, etc.)
                                </Label>
                                
                                {/* Add new logo */}
                                <div className="flex gap-2">
                                    <Input
                                        value={newLogoUrl}
                                        onChange={(e) => setNewLogoUrl(e.target.value)}
                                        placeholder="Enter logo URL..."
                                        className="input-neon flex-1 text-sm"
                                    />
                                    <Button size="sm" className="btn-primary" onClick={addAdditionalLogo}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* List of additional logos */}
                                {design.additional_logos?.map((logo) => (
                                    <div key={logo.id} className="p-2 bg-slate-800/50 rounded space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <img src={logo.url} alt="Logo" className="h-6 object-contain" />
                                                <span className="text-xs text-slate-400 truncate max-w-[150px]">{logo.id}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={logo.show}
                                                    onCheckedChange={(v) => updateAdditionalLogo(logo.id, 'show', v)}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-400 h-6 w-6 p-0"
                                                    onClick={() => removeAdditionalLogo(logo.id)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        {logo.show && (
                                            <div className="grid grid-cols-4 gap-2">
                                                <div>
                                                    <Label className="text-[10px] text-slate-500">X</Label>
                                                    <Slider
                                                        value={[logo.position?.x || 0]}
                                                        onValueChange={([v]) => updateAdditionalLogo(logo.id, 'position', { ...logo.position, x: v })}
                                                        min={0}
                                                        max={1100}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-[10px] text-slate-500">Y</Label>
                                                    <Slider
                                                        value={[logo.position?.y || 0]}
                                                        onValueChange={([v]) => updateAdditionalLogo(logo.id, 'position', { ...logo.position, y: v })}
                                                        min={0}
                                                        max={780}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-[10px] text-slate-500">W</Label>
                                                    <Slider
                                                        value={[logo.size?.width || 60]}
                                                        onValueChange={([v]) => updateAdditionalLogo(logo.id, 'size', { ...logo.size, width: v })}
                                                        min={20}
                                                        max={200}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-[10px] text-slate-500">H</Label>
                                                    <Slider
                                                        value={[logo.size?.height || 40]}
                                                        onValueChange={([v]) => updateAdditionalLogo(logo.id, 'size', { ...logo.size, height: v })}
                                                        min={20}
                                                        max={100}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Position Tab */}
                        <TabsContent value="position" className="space-y-3 mt-4 max-h-[500px] overflow-y-auto">
                            {design.show_logo && <PositionControl label="Main Logo" element="logo" icon={Image} />}
                            <PositionControl label="Header" element="header" icon={Type} />
                            <PositionControl label="Subheader" element="subheader" icon={Type} />
                            <PositionControl label="Recipient Name" element="name" icon={Type} />
                            <PositionControl label="Course Prefix" element="course_prefix" icon={FileText} />
                            <PositionControl label="Course Title" element="course" icon={FileText} />
                            {design.show_signature && <PositionControl label="Signature" element="signature" icon={Building2} />}
                            {design.show_date && <PositionControl label="Date" element="date" icon={Calendar} />}
                            {design.show_cert_id && <PositionControl label="Certificate ID" element="cert_id" icon={FileText} />}
                            {design.show_qr && <PositionControl label="QR Code" element="qr" icon={QrCode} />}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Live Preview - 3 columns */}
                <div className="lg:col-span-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-slate-300">Live Preview (1100 x 780px)</Label>
                        <span className="text-xs text-purple-400">Global Template</span>
                    </div>
                    <div 
                        className="relative w-full rounded-lg overflow-hidden"
                        style={{
                            aspectRatio: "1100/780",
                            backgroundColor: design.background_color,
                            backgroundImage: design.background_image ? `url(${design.background_image})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: `${design.border_width}px solid ${design.border_color}`
                        }}
                    >
                        {/* Decorative corners */}
                        {design.show_corners && (
                            <>
                                <div className="absolute top-2 left-2 border-t-2 border-l-2" style={{ width: `${design.corner_size / 2}px`, height: `${design.corner_size / 2}px`, borderColor: `${design.corner_color}50` }}></div>
                                <div className="absolute top-2 right-2 border-t-2 border-r-2" style={{ width: `${design.corner_size / 2}px`, height: `${design.corner_size / 2}px`, borderColor: `${design.corner_color}50` }}></div>
                                <div className="absolute bottom-2 left-2 border-b-2 border-l-2" style={{ width: `${design.corner_size / 2}px`, height: `${design.corner_size / 2}px`, borderColor: `${design.corner_color}50` }}></div>
                                <div className="absolute bottom-2 right-2 border-b-2 border-r-2" style={{ width: `${design.corner_size / 2}px`, height: `${design.corner_size / 2}px`, borderColor: `${design.corner_color}50` }}></div>
                            </>
                        )}

                        {/* Main Logo */}
                        {design.show_logo && (
                            <div 
                                className="absolute flex items-center justify-center"
                                style={{
                                    left: `${(design.logo_position?.x || 550) / 11}%`,
                                    top: `${(design.logo_position?.y || 60) / 7.8}%`,
                                    transform: 'translate(-50%, -50%)',
                                }}
                            >
                                <img 
                                    src={design.logo_url || COMPANY_LOGO} 
                                    alt="Logo" 
                                    style={{
                                        maxWidth: `${(design.logo_size?.width || 180) / 5}px`,
                                        maxHeight: `${(design.logo_size?.height || 60) / 2.5}px`,
                                    }}
                                    className="object-contain"
                                />
                            </div>
                        )}

                        {/* Header */}
                        <div 
                            className="absolute text-center whitespace-nowrap"
                            style={{
                                left: `${(design.header_position?.x || 550) / 11}%`,
                                top: `${(design.header_position?.y || 120) / 7.8}%`,
                                transform: 'translate(-50%, -50%)',
                                fontSize: `${design.header_font_size / 2.5}px`,
                                color: design.header_color,
                                letterSpacing: `${design.header_letter_spacing}em`
                            }}
                        >
                            {design.header_text}
                        </div>

                        {/* Subheader */}
                        <div 
                            className="absolute text-center"
                            style={{
                                left: `${(design.subheader_position?.x || 550) / 11}%`,
                                top: `${(design.subheader_position?.y || 280) / 7.8}%`,
                                transform: 'translate(-50%, -50%)',
                                fontSize: `${design.subheader_font_size / 2.5}px`,
                                color: design.subheader_color
                            }}
                        >
                            {design.subheader_text}
                        </div>

                        {/* Name */}
                        <div 
                            className="absolute text-center whitespace-nowrap"
                            style={{
                                left: `${(design.name_position?.x || 550) / 11}%`,
                                top: `${(design.name_position?.y || 350) / 7.8}%`,
                                transform: 'translate(-50%, -50%)',
                                fontFamily: design.name_font_family,
                                fontSize: `${design.name_font_size / 3}px`,
                                color: design.name_font_color
                            }}
                        >
                            John Doe
                        </div>

                        {/* Course Prefix */}
                        <div 
                            className="absolute text-center"
                            style={{
                                left: `${(design.course_prefix_position?.x || 550) / 11}%`,
                                top: `${(design.course_prefix_position?.y || 400) / 7.8}%`,
                                transform: 'translate(-50%, -50%)',
                                fontSize: `${design.course_prefix_font_size / 2.5}px`,
                                color: design.course_prefix_color
                            }}
                        >
                            {design.course_prefix}
                        </div>

                        {/* Course Title */}
                        <div 
                            className="absolute text-center"
                            style={{
                                left: `${(design.course_position?.x || 550) / 11}%`,
                                top: `${(design.course_position?.y || 440) / 7.8}%`,
                                transform: 'translate(-50%, -50%)',
                                fontFamily: design.course_font_family,
                                fontSize: `${design.course_font_size / 3}px`,
                                color: design.course_font_color
                            }}
                        >
                            Complete Web Development
                        </div>

                        {/* Signature */}
                        {design.show_signature && (
                            <div 
                                className="absolute text-center"
                                style={{
                                    left: `${(design.signature_position?.x || 550) / 11}%`,
                                    top: `${(design.signature_position?.y || 580) / 7.8}%`,
                                    transform: 'translate(-50%, -50%)',
                                }}
                            >
                                <div className="border-b pb-0.5 mb-0.5" style={{ borderColor: `${design.border_color}50` }}>
                                    <span 
                                        className="italic" 
                                        style={{ 
                                            fontFamily: design.signature_font_family,
                                            fontSize: '10px',
                                            color: `${design.border_color}cc`
                                        }}
                                    >
                                        {design.signature_name}
                                    </span>
                                </div>
                                <span className="text-[6px] text-slate-500">{design.signature_title}</span>
                            </div>
                        )}

                        {/* Date */}
                        {design.show_date && (
                            <div 
                                className="absolute"
                                style={{
                                    left: `${(design.date_position?.x || 550) / 11}%`,
                                    top: `${(design.date_position?.y || 520) / 7.8}%`,
                                    transform: 'translate(-50%, -50%)',
                                    fontSize: `${design.date_font_size / 3}px`,
                                    color: design.date_font_color
                                }}
                            >
                                February 28, 2026
                            </div>
                        )}

                        {/* Certificate ID */}
                        {design.show_cert_id && (
                            <div 
                                className="absolute font-mono"
                                style={{
                                    left: `${(design.cert_id_position?.x || 550) / 11}%`,
                                    top: `${(design.cert_id_position?.y || 700) / 7.8}%`,
                                    transform: 'translate(-50%, -50%)',
                                    fontSize: `${design.cert_id_font_size / 3}px`,
                                    color: design.cert_id_font_color
                                }}
                            >
                                LUMINA-XXXXXXXX-XXXXXXXX
                            </div>
                        )}

                        {/* QR Code */}
                        {design.show_qr && (
                            <div 
                                className="absolute bg-white/90 rounded p-0.5 flex items-center justify-center"
                                style={{
                                    left: `${(design.qr_position?.x || 1000) / 11}%`,
                                    top: `${(design.qr_position?.y || 650) / 7.8}%`,
                                    transform: 'translate(-50%, -50%)',
                                    width: `${design.qr_size / 3.5}px`,
                                    height: `${design.qr_size / 3.5}px`,
                                }}
                            >
                                <QrCode className="w-full h-full text-slate-800" />
                            </div>
                        )}

                        {/* Additional Logos */}
                        {design.additional_logos?.filter(l => l.show).map((logo) => (
                            <div 
                                key={logo.id}
                                className="absolute"
                                style={{
                                    left: `${(logo.position?.x || 100) / 11}%`,
                                    top: `${(logo.position?.y || 680) / 7.8}%`,
                                    transform: 'translate(-50%, -50%)',
                                }}
                            >
                                <img 
                                    src={logo.url} 
                                    alt="Logo" 
                                    style={{
                                        width: `${(logo.size?.width || 60) / 5}px`,
                                        height: `${(logo.size?.height || 40) / 5}px`,
                                    }}
                                    className="object-contain opacity-70"
                                />
                            </div>
                        ))}
                    </div>

                    <p className="text-xs text-slate-500 text-center">
                        This is the master template. All certificates will use this design unless individually edited.
                    </p>
                </div>
            </div>
        </div>
    );
}
